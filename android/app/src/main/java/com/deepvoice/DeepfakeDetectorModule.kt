// android/app/src/main/java/com/deepvoice/DeepfakeDetectorModule.kt
package com.deepvoice

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.DataType
import be.tarsos.dsp.util.fft.FFT
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.ArrayList
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.abs
import kotlin.math.ln

class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

  init { reactCtx.addActivityEventListener(this) }

  private var tflite: Interpreter? = null
  private val MODEL_NAME: String = "vgg19_alternative_mode.tflite"

  // Playback capture
  private var mediaProjection: MediaProjection? = null
  private var recorder: AudioRecord? = null
  private var captureThread: Thread? = null

  // Realtime inference
  private var monitorThread: Thread? = null
  @Volatile private var monitoring: Boolean = false
  private val pcmQueue: ArrayBlockingQueue<Short> = ArrayBlockingQueue(16000 * 10)

  override fun getName(): String = "DeepfakeDetector"

  // --- small helpers (avoid Kotlin stdlib isFinite() incompat) ---
  private fun isFiniteF(x: Float): Boolean = !x.isNaN() && !x.isInfinite()
  // ---------------------------------------------------------------

  // ===== Public API (JS) =====

  @ReactMethod
  fun initModel(promise: Promise) {
    try {
      if (tflite != null) { logModelIO(); promise.resolve(true); return }
      val mmap = FileUtil.loadMappedFile(reactCtx, MODEL_NAME)

      // CPU only for stability
      val opt = Interpreter.Options().apply { setNumThreads(4) }
      tflite = Interpreter(mmap, opt)

      logModelIO()
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("DeepfakeStep", "initModel failed", e)
      promise.reject("MODEL_LOAD_FAIL", e)
    } catch (t: Throwable) {
      Log.e("DeepfakeStep", "initModel failed (throwable)", t)
      promise.reject("MODEL_LOAD_FAIL", t)
    }
  }

  @ReactMethod
  fun requestPlaybackCapture(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+")
      return
    }
    try {
      val current: Activity? = currentActivity
      if (current == null) {
        promise.reject("NO_ACTIVITY", "No foreground Activity")
        return
      }
      current.startActivity(Intent(current, PlaybackCaptureActivity::class.java))
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("DeepfakeStep", "requestPlaybackCapture failed", e)
      promise.reject("REQ_CAPTURE_FAIL", e)
    } catch (t: Throwable) {
      Log.e("DeepfakeStep", "requestPlaybackCapture failed (throwable)", t)
      promise.reject("REQ_CAPTURE_FAIL", t)
    }
  }

  @ReactMethod
  fun startStreamMonitor(remoteTrackId: String?, options: ReadableMap?, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+")
      return
    }
    try {
      ensureModel()
      if (monitoring) { promise.resolve(true); return }

      startPlaybackRecorder()
      monitoring = true
      monitorThread = Thread {
        try { runInferenceLoop() }
        catch (t: Throwable) { Log.e("DeepfakeStep", "runInferenceLoop crashed", t) }
      }
      monitorThread?.start()
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("DeepfakeStep", "startStreamMonitor failed", e)
      promise.reject("STREAM_START_FAIL", e)
    } catch (t: Throwable) {
      Log.e("DeepfakeStep", "startStreamMonitor failed (throwable)", t)
      promise.reject("STREAM_START_FAIL", t)
    }
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
    } catch (e: Exception) {
      Log.e("DeepfakeStep", "stopStreamMonitor failed", e)
      promise.reject("STREAM_STOP_FAIL", e)
    } catch (t: Throwable) {
      Log.e("DeepfakeStep", "stopStreamMonitor failed (throwable)", t)
      promise.reject("STREAM_STOP_FAIL", t)
    }
  }

  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      Log.d("DeepfakeStep", "detectFromFile uri=$uriString")
      ensureModel()

      // 1) WAV load (PCM/16-bit, any SR; 1ch or 2ch)
      val wav = readWav16kMono(uriString)
        ?: throw Exception("지원하지 않는 오디오 형식 (16kHz, mono, 16-bit PCM WAV만 지원)")
      Log.d("DeepfakeStep", "WAV loaded: samples=${wav.size}")

      // 2) features → 224x224x3
      val input: Array<Array<FloatArray>> = computeCnnMFCC(wav)
      Log.d("DeepfakeStep", "MFCC->img done")

      // 3) inference
      val prob: Float = runOnce(input)
      Log.d("DeepfakeStep", "inference prob=$prob")

      // 4) result
      val result = Arguments.createMap()
      result.putDouble("prob_real", prob.toDouble())
      result.putString("result", if (prob >= 0.5f) "진짜 음성" else "가짜 음성")
      promise.resolve(result)
    } catch (e: Exception) {
      Log.e("DeepfakeStep", "detectFromFile failed", e)
      promise.reject("DETECT_FAIL", e)
    } catch (t: Throwable) {
      Log.e("DeepfakeStep", "detectFromFile failed (throwable)", t)
      promise.reject("DETECT_FAIL", t)
    }
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
    val mpm = reactCtx.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val projIntent: Intent = _lastProjectionData ?: throw IllegalStateException("Call requestPlaybackCapture() first")
    mediaProjection = mpm.getMediaProjection(Activity.RESULT_OK, projIntent)

    val config: AudioPlaybackCaptureConfiguration =
      AudioPlaybackCaptureConfiguration.Builder(mediaProjection!!)
        .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
        .build()

    val srcRate = 48000
    val minBuf = AudioRecord.getMinBufferSize(
      srcRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )

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
      try {
        val buf = ShortArray(2048)
        while (recorder != null && recorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
          val n = recorder!!.read(buf, 0, buf.size)
          if (n > 0) {
            var i = 0
            // 48k → 16k decimate by 3
            while (i + 2 < n) {
              pcmQueue.offer(buf[i])
              i += 3
            }
          } else {
            try { Thread.sleep(5) } catch (_: InterruptedException) {}
          }
        }
      } catch (t: Throwable) {
        Log.e("DeepfakeStep", "captureThread crashed", t)
      }
    }
    captureThread?.start()
  }

  private fun stopPlaybackRecorder() {
    recorder?.let {
      try { it.stop() } catch (_: Throwable) {}
      try { it.release() } catch (_: Throwable) {}
    }
    recorder = null

    mediaProjection?.let {
      try { it.stop() } catch (_: Throwable) {}
    }
    mediaProjection = null

    captureThread?.let {
      try { it.join(200) } catch (_: InterruptedException) {}
    }
    captureThread = null
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
        val s: Short? = pcmQueue.poll(10, TimeUnit.MILLISECONDS)
        if (s != null) {
          shortTmp[got] = s
          got++
        }
      }
      if (!monitoring) break

      var i = 0
      while (i < samplesPerWin) {
        floatBuf[i] = shortTmp[i] / 32768f
        i++
      }

      val input: Array<Array<FloatArray>> = computeCnnMFCC(floatBuf)
      val prob: Float = runOnce(input)

      val map = Arguments.createMap()
      map.putDouble("prob_real", prob.toDouble())
      map.putString("decision", if (prob >= 0.5f) "real" else "fake")
      map.putInt("windowMs", windowMs)
      map.putDouble("timestamp", System.currentTimeMillis().toDouble())
      emitEvent("DeepfakeVerdict", map)
    }
  }

  private fun emitEvent(name: String, data: WritableMap) {
    reactCtx
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, data)
  }

  // ===== Single-shot inference =====
  private fun ensureModel() {
    if (tflite == null) throw IllegalStateException("Call initModel() first")
  }

  /**
   * 입력: 224x224x3 (HWC) float(0~1) 그레이 3채널
   * 출력: [1,1] 또는 [1,2] (이진/소프트맥스 모두 허용)
   */
  private fun runOnce(inputHWC: Array<Array<FloatArray>>): Float {
    val interpreter = tflite ?: throw IllegalStateException("Model not initialized")

    val inTensor = interpreter.getInputTensor(0)
    val inShape  = inTensor.shape()
    val inType   = inTensor.dataType()
    if (inType != DataType.FLOAT32) {
      throw IllegalStateException("Model expects FLOAT32, got $inType")
    }
    if (inShape.size != 4 || inShape[1] != 224 || inShape[2] != 224 || inShape[3] != 3) {
      interpreter.resizeInput(0, intArrayOf(1, 224, 224, 3))
      interpreter.allocateTensors()
    }

    // fill input
    val inBuf = ByteBuffer.allocateDirect(4 * 224 * 224 * 3).order(ByteOrder.nativeOrder())
    var i = 0
    while (i < 224) {
      var j = 0
      while (j < 224) {
        val px = inputHWC[i][j]
        val r = if (!px[0].isNaN() && !px[0].isInfinite()) px[0].coerceIn(0f, 1f) else 0f
        val g = if (!px[1].isNaN() && !px[1].isInfinite()) px[1].coerceIn(0f, 1f) else 0f
        val b = if (!px[2].isNaN() && !px[2].isInfinite()) px[2].coerceIn(0f, 1f) else 0f
        inBuf.putFloat(r); inBuf.putFloat(g); inBuf.putFloat(b)
        j++
      }
      i++
    }
    inBuf.rewind()

    // ==== 출력 shape에 맞춰 정확한 객체로 받기 ====
    val outTensor = interpreter.getOutputTensor(0)
    val outShape  = outTensor.shape()   // e.g., [1,1] or [1,2]
    val rank = outShape.size

    var prob = 0f
    try {
      when (rank) {
        1 -> {
          val out = FloatArray(outShape[0].coerceAtLeast(1))
          interpreter.run(inBuf, out)
          prob = out.getOrElse(if (out.size > 1) 1 else 0) { 0f }
        }
        2 -> {
          val out = Array(outShape[0]) { FloatArray(outShape[1]) }
          interpreter.run(inBuf, out)
          prob = if (outShape[1] == 1) out[0][0] else out[0].getOrElse(1) { out[0][0] }
        }
        else -> {
          val last = outShape.last()
          val out = Array(outShape[0]) { FloatArray(last) }
          interpreter.run(inBuf, out)
          prob = if (last == 1) out[0][0] else out[0].getOrElse(1) { out[0][0] }
        }
      }
    } catch (t: Throwable) {
      Log.e("DeepfakeRun", "TFLite run() failed: ${t.javaClass.simpleName}: ${t.message}", t)
      throw t
    }

    if (prob.isNaN() || prob.isInfinite()) prob = 0.5f
    return prob.coerceIn(0f, 1f)
  }

  // 모델 IO 스펙 로그
  private fun logModelIO() {
    try {
      val it = tflite ?: return
      val inT = it.getInputTensor(0)
      val outT = it.getOutputTensor(0)
      Log.i("DeepfakeIO", "IN: ${inT.dataType()} ${inT.shape().contentToString()} / OUT: ${outT.dataType()} ${outT.shape().contentToString()}")
    } catch (_: Throwable) { /* ignore */ }
  }

  // ===== WAV 16k mono → FloatArray =====
  /**
   * PCM(1) + 16bit. 채널 1/2 허용. 샘플레이트는 임의 → 16kHz로 리샘플.
   */
  private fun readWav16kMono(uriString: String): FloatArray? {
    val uri = Uri.parse(uriString)
    val ins = if (uri.scheme == "content") reactCtx.contentResolver.openInputStream(uri)
              else java.io.FileInputStream(uri.path)
    if (ins == null) return null
    val all = ins.readBytes().also { ins.close() }
    if (all.size < 44 || String(all.copyOfRange(0,4)) != "RIFF" || String(all.copyOfRange(8,12)) != "WAVE") {
      Log.e("DeepfakeStep", "Not a RIFF/WAVE")
      return null
    }

    var p = 12
    var fmtFound = false
    var audioFormat = -1
    var numChannels = -1
    var sampleRate = -1
    var bitsPerSample = -1
    var dataOffset = -1
    var dataSize = -1

    while (p + 8 <= all.size) {
      val id = String(all.copyOfRange(p, p+4))
      val sz = ByteBuffer.wrap(all, p+4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt()
      val body = p + 8
      when (id) {
        "fmt " -> {
          fmtFound = true
          if (sz >= 16) {
            audioFormat   = ByteBuffer.wrap(all, body + 0,  2).order(ByteOrder.LITTLE_ENDIAN).getShort().toInt() and 0xFFFF
            numChannels   = ByteBuffer.wrap(all, body + 2,  2).order(ByteOrder.LITTLE_ENDIAN).getShort().toInt() and 0xFFFF
            sampleRate    = ByteBuffer.wrap(all, body + 4,  4).order(ByteOrder.LITTLE_ENDIAN).getInt()
            bitsPerSample = ByteBuffer.wrap(all, body + 14, 2).order(ByteOrder.LITTLE_ENDIAN).getShort().toInt() and 0xFFFF
          }
        }
        "data" -> {
          dataOffset = body
          dataSize = sz
          break
        }
      }
      p += 8 + sz
    }

    if (!fmtFound || dataOffset < 0 || dataSize <= 0) {
      Log.e("DeepfakeStep", "fmt/data chunk not found")
      return null
    }
    // PCM 16bit만 허용
    if (audioFormat != 1 || bitsPerSample != 16) {
      Log.e("DeepfakeStep", "Unsupported WAV fmt: format=$audioFormat, ch=$numChannels, sr=$sampleRate, bps=$bitsPerSample")
      return null
    }
    if (numChannels != 1 && numChannels != 2) {
      Log.e("DeepfakeStep", "Unsupported channels: $numChannels")
      return null
    }

    val bb = ByteBuffer.wrap(all, dataOffset, dataSize).order(ByteOrder.LITTLE_ENDIAN)

    // 1) 모노 신호 추출 (2ch → (L+R)/2 다운믹스)
    val mono: FloatArray = if (numChannels == 1) {
      val frames = dataSize / 2
      val out = FloatArray(frames)
      var i = 0
      while (i < frames && bb.remaining() >= 2) { out[i] = bb.getShort() / 32768f; i++ }
      out
    } else {
      val frames = dataSize / 4
      val out = FloatArray(frames)
      var i = 0
      while (i < frames && bb.remaining() >= 4) {
        val l = bb.getShort().toInt()
        val r = bb.getShort().toInt()
        out[i] = ((l + r) / 2.0f) / 32768f
        i++
      }
      out
    }

    // 2) 16kHz로 리샘플
    return if (sampleRate == 16000) {
      mono
    } else {
      val res = resampleLinear(mono, sampleRate, 16000)
      Log.d("DeepfakeStep", "Resampled ${sampleRate}→16000, in=${mono.size}, out=${res.size}")
      res
    }
  }

  // 간단한 선형 보간 리샘플러 (srcRate → dstRate)
  private fun resampleLinear(input: FloatArray, srcRate: Int, dstRate: Int): FloatArray {
    if (input.isEmpty() || srcRate <= 0 || dstRate <= 0) return FloatArray(0)
    if (srcRate == dstRate) return input.copyOf()

    val ratio = dstRate.toDouble() / srcRate.toDouble()
    val outLen = kotlin.math.max(1, kotlin.math.floor(input.size * ratio).toInt())
    val out = FloatArray(outLen)

    var i = 0
    while (i < outLen) {
      val srcPos = i / ratio
      val i0 = kotlin.math.floor(srcPos).toInt().coerceIn(0, input.size - 1)
      val i1 = (i0 + 1).coerceAtMost(input.size - 1)
      val frac = (srcPos - i0)
      val v = (input[i0] * (1.0 - frac) + input[i1] * frac).toFloat()
      out[i] = if (isFiniteF(v)) v else 0f
      i++
    }
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

    val timeFeats: ArrayList<FloatArray> = ArrayList()
    var idx = 0
    val windowed = FloatArray(FFT_SIZE)
    val fftBuffer = FloatArray(FFT_SIZE * 2) // interleaved re,im

    // modulus() 출력: 풀 스펙트럼(= FFT_SIZE)
    val magsFull: FloatArray = FloatArray(FFT_SIZE)
    // 실제 사용: 반쪽 스펙트럼(= FFT_SIZE / 2)
    val nBins = FFT_SIZE / 2
    val mags: FloatArray = FloatArray(nBins)

    var frameIndex = 0
    while (idx + FRAME <= pcm.size) {
      // window & zero-pad
      java.util.Arrays.fill(windowed, 0f)
      val win: FloatArray = hamming(pcm, idx, FRAME)
      System.arraycopy(win, 0, windowed, 0, FRAME)

      // real → interleaved re/im
      java.util.Arrays.fill(fftBuffer, 0f)
      var w = 0; var b = 0
      while (w < FFT_SIZE) { fftBuffer[b] = windowed[w]; b += 2; w++ }

      // FFT → magnitude(full)
      fft.forwardTransform(fftBuffer)
      fft.modulus(fftBuffer, magsFull)  // length = FFT_SIZE

      // 반쪽 스펙트럼만 사용 (0..nBins-1)
      System.arraycopy(magsFull, 0, mags, 0, nBins)

      // NaN/Inf guard
      var badMags = 0
      var mi = 0
      while (mi < mags.size) {
        val v = mags[mi]
        if (!isFiniteF(v) || v < 0f) { mags[mi] = 0f; badMags++ }
        mi++
      }
      if (frameIndex % 50 == 0) {
        Log.d("DeepfakeStep", "FFT ok frame=$frameIndex badMags=$badMags")
      }

      // MFCC (mel power → log → DCT)
      val mfccs: FloatArray = try {
        computeMFCCFromSpectrum(
          mags = mags,                // 256 bins
          sampleRate = SAMPLE_RATE,
          fftSize = FFT_SIZE,
          nMels = MEL_FILTERS,
          nMfcc = N_MFCC
        )
      } catch (t: Throwable) {
        Log.e("DeepfakeStep", "computeMFCCFromSpectrum failed at frame=$frameIndex", t)
        throw t
      }

      // 안정적 로그/클램프
      val row = FloatArray(N_MFCC)
      var k = 0
      while (k < N_MFCC) {
        val v0 = if (k < mfccs.size) mfccs[k] else 0f
        val vSafe = if (!isFiniteF(v0)) 0f else abs(v0)
        var vv = ln((if (vSafe <= 1e-6f) 1e-6f else vSafe).toDouble()).toFloat()
        if (!isFiniteF(vv)) vv = 0f
        row[k] = vv
        k++
      }
      timeFeats.add(row)

      idx += HOP
      frameIndex++
    }

    // list -> array
    val specList: ArrayList<FloatArray> = ArrayList(timeFeats.size)
    var r0 = 0
    while (r0 < timeFeats.size) {
      val row = FloatArray(N_MFCC)
      val srcRow = timeFeats[r0]
      val copyLen = if (srcRow.size < N_MFCC) srcRow.size else N_MFCC
      System.arraycopy(srcRow, 0, row, 0, copyLen)
      specList.add(row)
      r0++
    }
    val spec: Array<FloatArray> = specList.toTypedArray()

    val img: Array<FloatArray> = bilinearResizeAndNorm(spec, 224, 224)

    // out: 224x224x3 (grayscale→3ch) + NaN guard
    val outRows: ArrayList<Array<FloatArray>> = ArrayList(224)
    var r = 0
    while (r < 224) {
      val colList: ArrayList<FloatArray> = ArrayList(224)
      var c = 0
      while (c < 224) {
        val v0 = img[r][c]
        val v = if (isFiniteF(v0)) v0.coerceIn(0f, 1f) else 0f
        val triple = FloatArray(3)
        triple[0] = v; triple[1] = v; triple[2] = v
        colList.add(triple)
        c++
      }
      outRows.add(colList.toTypedArray())
      r++
    }
    return outRows.toTypedArray()
  }

  private fun hamming(src: FloatArray, off: Int, n: Int): FloatArray {
    val out = FloatArray(n)
    val twoPi: Double = 2.0 * PI
    var i = 0
    while (i < n) {
      val w = 0.54 - 0.46 * cos(twoPi * i / (n - 1).toDouble())
      var v = src[off + i] * w.toFloat()
      if (!isFiniteF(v)) v = 0f
      out[i] = v
      i++
    }
    return out
  }

  private fun bilinearResizeAndNorm(src: Array<FloatArray>, h: Int, w: Int): Array<FloatArray> {
    val sh: Int = src.size
    val sw: Int = if (sh > 0) src[0].size else 1

    val outList: ArrayList<FloatArray> = ArrayList(h)
    var y = 0
    while (y < h) { outList.add(FloatArray(w)); y++ }

    var mn = Float.POSITIVE_INFINITY
    var mx = Float.NEGATIVE_INFINITY

    y = 0
    while (y < h) {
      val gy = (y.toFloat() * (sh - 1f)) / (h - 1f)
      val y0 = floor(gy.toDouble()).toInt().coerceIn(0, sh - 1)
      val y1 = if (y0 + 1 < sh) y0 + 1 else sh - 1
      val wy = (gy - y0).toFloat()

      var x = 0
      while (x < w) {
        val gx = (x.toFloat() * (sw - 1f)) / (w - 1f)
        val x0 = floor(gx.toDouble()).toInt().coerceIn(0, sw - 1)
        val x1 = if (x0 + 1 < sw) x0 + 1 else sw - 1
        val wx = (gx - x0).toFloat()

        val a = src[y0][x0]
        val b = src[y0][x1]
        val c = src[y1][x0]
        val d = src[y1][x1]

        var v = ((1f - wy) * ((1f - wx) * a + wx * b) + wy * ((1f - wx) * c + wx * d))
        if (!isFiniteF(v)) v = 0f
        outList[y][x] = v

        if (v < mn) mn = v
        if (v > mx) mx = v
        x++
      }
      y++
    }

    val s = mx - mn
    if (s > 1e-6f && isFiniteF(mn) && isFiniteF(mx)) {
      y = 0
      while (y < h) {
        var x2 = 0
        while (x2 < w) {
          var z = (outList[y][x2] - mn) / s
          if (!isFiniteF(z)) z = 0f
          outList[y][x2] = z
          x2++
        }
        y++
      }
    } else {
      y = 0
      while (y < h) { java.util.Arrays.fill(outList[y], 0f); y++ }
    }
    return outList.toTypedArray()
  }

  // ===== Simple MFCC (mel filterbank + log + DCT-II) =====
  private fun computeMFCCFromSpectrum(
    mags: FloatArray,
    sampleRate: Int,
    fftSize: Int,
    nMels: Int,
    nMfcc: Int
  ): FloatArray {
    val melFilters = buildMelFilterBank(sampleRate, fftSize, nMels)

    val melEnergies = FloatArray(nMels)
    var m = 0
    while (m < nMels) {
      var sum = 0.0
      val filt = melFilters[m]
      val len = mags.size.coerceAtMost(filt.size)
      var k = 0
      while (k < len) {
        val p = mags[k].toDouble()
        val pp = if (p.isFinite() && p >= 0.0) p else 0.0
        sum += (pp * pp) * filt[k] // power spectrum
        k++
      }
      val logged = ln((if (sum <= 1e-10) 1e-10 else sum)).toFloat()
      melEnergies[m] = if (!logged.isNaN() && !logged.isInfinite()) logged else 0f
      m++
    }
    val out = dctTypeII(melEnergies, nMfcc)
    var i = 0
    while (i < out.size) {
      if (!isFiniteF(out[i])) out[i] = 0f
      i++
    }
    return out
  }

  private fun buildMelFilterBank(sampleRate: Int, fftSize: Int, nMels: Int): Array<DoubleArray> {
    val nFftBins = fftSize / 2
    val fMin = 20.0
    val fMax = sampleRate / 2.0

    fun hzToMel(f: Double) = 2595.0 * Math.log10(1.0 + f / 700.0)
    fun melToHz(m: Double) = 700.0 * (Math.pow(10.0, m / 2595.0) - 1.0)

    val melMin = hzToMel(fMin)
    val melMax = hzToMel(fMax)
    val melPoints = DoubleArray(nMels + 2)
    for (i in 0 until nMels + 2) {
      melPoints[i] = melMin + (melMax - melMin) * i / (nMels + 1)
    }

    val bin = IntArray(nMels + 2)
    for (i in 0 until nMels + 2) {
      val hz = melToHz(melPoints[i])
      bin[i] = Math.floor((fftSize + 1) * hz / (2.0 * sampleRate)).toInt().coerceIn(0, nFftBins - 1)
    }

    val filters = Array(nMels) { DoubleArray(nFftBins) }
    for (m in 1..nMels) {
      val f_m_minus = bin[m - 1]
      val f_m = bin[m]
      val f_m_plus = bin[m + 1]

      var k = f_m_minus
      while (k < f_m) {
        val denom = (f_m - f_m_minus).toDouble().coerceAtLeast(1.0)
        filters[m - 1][k] = (k - f_m_minus).toDouble() / denom
        k++
      }
      while (k <= f_m_plus && k < nFftBins) {
        val denom = (f_m_plus - f_m).toDouble().coerceAtLeast(1.0)
        filters[m - 1][k] = (f_m_plus - k).toDouble() / denom
        k++
      }
    }
    return filters
  }

  private fun dctTypeII(src: FloatArray, nCoeffs: Int): FloatArray {
    val N = src.size
    val out = FloatArray(nCoeffs)
    val factor = Math.PI / N
    var k = 0
    while (k < nCoeffs) {
      var sum = 0.0
      var n = 0
      while (n < N) {
        sum += src[n] * Math.cos((n + 0.5) * k * factor)
        n++
      }
      var v = (sum * Math.sqrt(2.0 / N)).toFloat()
      if (!isFiniteF(v)) v = 0f
      out[k] = v
      k++
    }
    return out
  }
}
