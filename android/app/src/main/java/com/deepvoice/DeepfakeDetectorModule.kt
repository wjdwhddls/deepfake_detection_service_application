package com.deepvoice

import android.app.Activity
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.nnapi.NnApiDelegate
import org.tensorflow.lite.support.common.FileUtil
import be.tarsos.dsp.mfcc.MFCC
import be.tarsos.dsp.util.fft.FFT
import android.net.Uri
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.math.*

class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

  init { reactCtx.addActivityEventListener(this) }

  private var tflite: Interpreter? = null
  private val MODEL_NAME = "vgg19_alternative_mode.tflite"

  // Playback capture
  private var mediaProjection: MediaProjection? = null
  private var recorder: AudioRecord? = null
  private var captureThread: Thread? = null

  // Realtime inference
  private var monitorThread: Thread? = null
  @Volatile private var monitoring = false
  private val pcmQueue = ArrayBlockingQueue<Short>(16000 * 10)

  override fun getName() = "DeepfakeDetector"

  // ===== Public API (JS) =====

  @ReactMethod
  fun initModel(promise: Promise) {
    try {
      if (tflite != null) { promise.resolve(true); return }
      val mmap = FileUtil.loadMappedFile(reactCtx, MODEL_NAME)
      val opt = Interpreter.Options().apply {
        setNumThreads(4)
        addDelegate(NnApiDelegate())
      }
      tflite = Interpreter(mmap, opt)
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("MODEL_LOAD_FAIL", e) }
  }

  @ReactMethod
  fun requestPlaybackCapture(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+"); return
    }
    try {
      val current = currentActivity ?: run {
        promise.reject("NO_ACTIVITY", "No foreground Activity"); return
      }
      current.startActivity(Intent(current, PlaybackCaptureActivity::class.java))
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("REQ_CAPTURE_FAIL", e) }
  }

  @ReactMethod
  fun startStreamMonitor(remoteTrackId: String?, options: ReadableMap?, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+"); return
    }
    try {
      ensureModel()
      if (monitoring) { promise.resolve(true); return }

      startPlaybackRecorder()
      monitoring = true
      monitorThread = Thread { runInferenceLoop() }.apply { start() }
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("STREAM_START_FAIL", e) }
  }

  @ReactMethod
  fun stopStreamMonitor(promise: Promise) {
    try {
      monitoring = false
      monitorThread?.join(500)
      monitorThread = null
      stopPlaybackRecorder()
      pcmQueue.clear()
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("STREAM_STOP_FAIL", e) }
  }

  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      ensureModel()
      val pcm = readWav16kMono(uriString)
        ?: throw Exception("지원하지 않는 오디오 형식 (16kHz mono WAV만 지원)")
      val input = computeCnnMFCC(pcm)
      val prob = runOnce(input)
      val result = Arguments.createMap().apply {
        putDouble("prob_real", prob.toDouble())
        putString("result", if (prob >= 0.5f) "진짜 음성" else "가짜 음성")
      }
      promise.resolve(result)
    } catch (e: Exception) { promise.reject("DETECT_FAIL", e) }
  }

  companion object {
    fun onProjectionResult(data: Intent) { _lastProjectionData = data }
    private var _lastProjectionData: Intent? = null
  }
  override fun onActivityResult(a: Activity?, r: Int, c: Int, d: Intent?) {}
  override fun onNewIntent(intent: Intent?) {}

  // ===== AudioRecord (Playback capture) =====
  @RequiresApi(Build.VERSION_CODES.Q)
  private fun startPlaybackRecorder() {
    if (recorder != null) return
    val mpm = reactCtx.getSystemService(Activity.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val projIntent = _lastProjectionData ?: throw IllegalStateException("Call requestPlaybackCapture() first")
    mediaProjection = mpm.getMediaProjection(Activity.RESULT_OK, projIntent)

    val config = AudioPlaybackCaptureConfiguration.Builder(mediaProjection!!)
      .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
      .build()

    val srcRate = 48000
    val minBuf = AudioRecord.getMinBufferSize(srcRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    recorder = AudioRecord.Builder()
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(srcRate)
          .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
          .build()
      )
      .setBufferSizeInBytes(minBuf * 4)
      .setAudioPlaybackCaptureConfig(config)
      .build()

    recorder?.startRecording()

    captureThread = Thread {
      val buf = ShortArray(2048)
      while (recorder != null && recorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        val n = recorder!!.read(buf, 0, buf.size)
        if (n > 0) {
          var i = 0
          while (i + 2 < n) { // 48k → 16k decimate by 3
            pcmQueue.offer(buf[i])
            i += 3
          }
        } else Thread.sleep(5)
      }
    }.apply { start() }
  }

  private fun stopPlaybackRecorder() {
    recorder?.let { try { it.stop() } catch (_:Throwable) {}; try { it.release() } catch (_:Throwable) {} }
    recorder = null
    mediaProjection?.stop(); mediaProjection = null
    captureThread?.join(200); captureThread = null
  }

  // ===== Realtime inference loop =====
  private fun runInferenceLoop() {
    val sr = 16000
    val windowMs = 1000
    val samplesPerWin = sr * windowMs / 1000
    val floatBuf = FloatArray(samplesPerWin)
    val shortTmp = ShortArray(samplesPerWin)

    while (monitoring) {
      var got = 0
      while (got < samplesPerWin && monitoring) {
        val s = pcmQueue.poll(10, TimeUnit.MILLISECONDS)
        if (s != null) shortTmp[got++] = s
      }
      if (!monitoring) break

      var i = 0
      while (i < samplesPerWin) { floatBuf[i] = shortTmp[i] / 32768f; i++ }

      val input = computeCnnMFCC(floatBuf)
      val prob = runOnce(input)

      val map = Arguments.createMap().apply {
        putDouble("prob_real", prob.toDouble())
        putString("decision", if (prob >= 0.5f) "real" else "fake")
        putInt("windowMs", windowMs)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }
      emitEvent("DeepfakeVerdict", map)
    }
  }

  private fun emitEvent(name: String, data: WritableMap) {
    reactCtx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, data)
  }

  // ===== Single-shot inference =====
  private fun ensureModel() {
    if (tflite == null) throw IllegalStateException("Call initModel() first")
  }

  private fun runOnce(input: Array<Array<FloatArray>>): Float {
    val interpreter = tflite ?: throw IllegalStateException("Model not initialized")
    val inBuf = ByteBuffer.allocateDirect(4 * 224 * 224 * 3).order(ByteOrder.nativeOrder())
    var i = 0; var j: Int; var k: Int
    while (i < 224) {
      j = 0
      while (j < 224) {
        k = 0
        while (k < 3) { inBuf.putFloat(input[i][j][k]); k++ }
        j++
      }
      i++
    }
    val out = Array(1) { FloatArray(1) }
    interpreter.run(inBuf.rewind(), out)
    return out[0][0]
  }

  // ===== WAV 16k mono → FloatArray =====
  private fun readWav16kMono(uriString: String): FloatArray? {
    val uri = Uri.parse(uriString)
    val ins = if (uri.scheme == "content") reactCtx.contentResolver.openInputStream(uri)
              else java.io.FileInputStream(uri.path) ?: return null
    val all = ins!!.readBytes().also { ins.close() }
    if (all.size < 44 || String(all.copyOfRange(0,4)) != "RIFF") return null

    var p = 12; var dataOffset = -1; var dataSize = -1
    while (p + 8 <= all.size) {
      val id = String(all.copyOfRange(p, p+4))
      val sz = ByteBuffer.wrap(all, p+4, 4).order(ByteOrder.LITTLE_ENDIAN).int
      if (id == "data") { dataOffset = p + 8; dataSize = sz; break }
      p += 8 + sz
    }
    if (dataOffset < 0) return null

    val bb = ByteBuffer.wrap(all, dataOffset, dataSize).order(ByteOrder.LITTLE_ENDIAN)
    val out = FloatArray(dataSize / 2)
    var i = 0
    while (i < out.size) { out[i] = (bb.short / 32768f); i++ }
    return out
  }

  // ===== MFCC → 224x224x3 =====
  private fun computeCnnMFCC(pcm: FloatArray): Array<Array<FloatArray>> {
    val SAMPLE_RATE = 16000
    val FRAME = 400   // 25 ms @ 16k
    val HOP = 160     // 10 ms @ 16k
    val N_MFCC = 64
    val MEL_FILTERS = 40
    val FFT_SIZE = 512

    val fft = FFT(FFT_SIZE)
    val mfccExtractor = MFCC(
      FFT_SIZE,
      SAMPLE_RATE.toFloat(),
      N_MFCC,
      MEL_FILTERS,
      20f,
      (SAMPLE_RATE / 2).toFloat()
    )

    val timeFeats = ArrayList<FloatArray>()
    var idx = 0
    val windowed = FloatArray(FFT_SIZE)
    val fftBuffer = FloatArray(FFT_SIZE * 2) // interleaved re,im
    val mags = FloatArray(FFT_SIZE / 2)

    while (idx + FRAME <= pcm.size) {
      // Hamming window & zero-padding
      java.util.Arrays.fill(windowed, 0f)
      val win = hamming(pcm, idx, FRAME)
      System.arraycopy(win, 0, windowed, 0, FRAME)

      // Fill re/im buffer
      java.util.Arrays.fill(fftBuffer, 0f)
      var w = 0; var b = 0
      while (w < FFT_SIZE) { fftBuffer[b] = windowed[w]; b += 2; w++ }

      // FFT → magnitude
      fft.forwardTransform(fftBuffer)
      fft.modulus(fftBuffer, mags)

      // MFCC
      val mfccs: FloatArray = mfccExtractor.mfcc(mags)
      val row = FloatArray(N_MFCC)
      var k = 0
      while (k < N_MFCC) {
        val v = if (k < mfccs.size) abs(mfccs[k]) else 0f
        row[k] = ln(1e-6f + v).toFloat()
        k++
      }
      timeFeats.add(row)
      idx += HOP
    }

    val spec: Array<FloatArray> = timeFeats.toTypedArray()
    val img = bilinearResizeAndNorm(spec, 224, 224)

    // *** 중첩 람다 대신 명시 루프로 3채널 복제 ***
    val out = Array(224) { Array(224) { FloatArray(3) } }
    var r = 0
    while (r < 224) {
      var c = 0
      while (c < 224) {
        val v = img[r][c]
        out[r][c][0] = v
        out[r][c][1] = v
        out[r][c][2] = v
        c++
      }
      r++
    }
    return out
  }

  private fun hamming(src: FloatArray, off: Int, n: Int): FloatArray {
    val out = FloatArray(n)
    val twoPi = (2.0 * Math.PI).toFloat()
    var i = 0
    while (i < n) {
      out[i] = src[off + i] * (0.54f - 0.46f * cos(twoPi * i / (n - 1)))
      i++
    }
    return out
  }

  private fun bilinearResizeAndNorm(src: Array<FloatArray>, h: Int, w: Int): Array<FloatArray> {
    val sh = src.size
    val sw = src[0].size
    val out = Array(h) { FloatArray(w) }

    var mn = Float.POSITIVE_INFINITY
    var mx = Float.NEGATIVE_INFINITY

    var y = 0
    while (y < h) {
      val gy = (y.toFloat() * (sh - 1f)) / (h - 1f)
      val y0 = floor(gy).toInt().coerceIn(0, sh - 1)
      val y1 = min(y0 + 1, sh - 1)
      val wy = (gy - y0).toFloat()

      var x = 0
      while (x < w) {
        val gx = (x.toFloat() * (sw - 1f)) / (w - 1f)
        val x0 = floor(gx).toInt().coerceIn(0, sw - 1)
        val x1 = min(x0 + 1, sw - 1)
        val wx = (gx - x0).toFloat()

        val a = src[y0][x0]
        val b = src[y0][x1]
        val c = src[y1][x0]
        val d = src[y1][x1]

        val v = ((1f - wy) * ((1f - wx) * a + wx * b) + wy * ((1f - wx) * c + wx * d))
        out[y][x] = v

        if (v < mn) mn = v
        if (v > mx) mx = v
        x++
      }
      y++
    }

    val s = mx - mn
    if (s > 1e-6f) {
      y = 0
      while (y < h) {
        var x = 0
        while (x < w) { out[y][x] = (out[y][x] - mn) / s; x++ }
        y++
      }
    } else {
      y = 0
      while (y < h) { var x = 0; while (x < w) { out[y][x] = 0f; x++ }; y++ }
    }
    return out
  }
}
