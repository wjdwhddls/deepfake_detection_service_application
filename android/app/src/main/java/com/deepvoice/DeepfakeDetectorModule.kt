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
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.nnapi.NnApiDelegate
import org.tensorflow.lite.support.common.FileUtil
import be.tarsos.dsp.util.fft.FFT
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.ArrayList
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.floor

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

  // ===== Public API (JS) =====

  @ReactMethod
  fun initModel(promise: Promise) {
    try {
      if (tflite != null) { promise.resolve(true); return }
      val mmap = FileUtil.loadMappedFile(reactCtx, MODEL_NAME)
      val opt = Interpreter.Options()
      opt.setNumThreads(4)
      try { opt.addDelegate(NnApiDelegate()) } catch (_: Throwable) {}
      tflite = Interpreter(mmap, opt)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("MODEL_LOAD_FAIL", e)
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
      promise.reject("REQ_CAPTURE_FAIL", e)
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
      monitorThread = Thread { runInferenceLoop() }
      monitorThread?.start()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STREAM_START_FAIL", e)
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
      promise.reject("STREAM_STOP_FAIL", e)
    }
  }

  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      ensureModel()
      val pcm: FloatArray = readWav16kMono(uriString)
        ?: throw Exception("지원하지 않는 오디오 형식 (16kHz mono WAV만 지원)")
      val input: Array<Array<FloatArray>> = computeCnnMFCC(pcm)
      val prob: Float = runOnce(input)
      val result = Arguments.createMap()
      result.putDouble("prob_real", prob.toDouble())
      result.putString("result", if (prob >= 0.5f) "진짜 음성" else "가짜 음성")
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("DETECT_FAIL", e)
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
      val buf = ShortArray(2048)
      while (recorder != null && recorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        val n = recorder!!.read(buf, 0, buf.size)
        if (n > 0) {
          var i = 0
          while (i + 2 < n) { // 48k → 16k decimate by 3
            pcmQueue.offer(buf[i])
            i += 3
          }
        } else {
          try { Thread.sleep(5) } catch (_: InterruptedException) {}
        }
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

  private fun runOnce(input: Array<Array<FloatArray>>): Float {
    val interpreter = tflite ?: throw IllegalStateException("Model not initialized")

    val inBuf: ByteBuffer = ByteBuffer
      .allocateDirect(4 * 224 * 224 * 3)
      .order(ByteOrder.nativeOrder())

    var i = 0
    while (i < 224) {
      var j = 0
      while (j < 224) {
        var k = 0
        while (k < 3) {
          inBuf.putFloat(input[i][j][k])
          k++
        }
        j++
      }
      i++
    }

    val out: Array<FloatArray> = arrayOf(FloatArray(1))
    inBuf.rewind()
    interpreter.run(inBuf, out)
    return out[0][0]
  }

  // ===== WAV 16k mono → FloatArray =====
  private fun readWav16kMono(uriString: String): FloatArray? {
    val uri = Uri.parse(uriString)
    val ins = if (uri.scheme == "content") reactCtx.contentResolver.openInputStream(uri)
              else java.io.FileInputStream(uri.path)
    if (ins == null) return null
    val all = ins.readBytes().also { ins.close() }
    if (all.size < 44 || String(all.copyOfRange(0,4)) != "RIFF") return null

    var p = 12
    var dataOffset = -1
    var dataSize = -1
    while (p + 8 <= all.size) {
      val id = String(all.copyOfRange(p, p+4))
      val sz = ByteBuffer
        .wrap(all, p+4, 4)
        .order(ByteOrder.LITTLE_ENDIAN)
        .getInt()
      if (id == "data") { dataOffset = p + 8; dataSize = sz; break }
      p += 8 + sz
    }
    if (dataOffset < 0 || dataSize <= 0) return null

    val bb: ByteBuffer = ByteBuffer
      .wrap(all, dataOffset, dataSize)
      .order(ByteOrder.LITTLE_ENDIAN)
    val out = FloatArray(dataSize / 2)
    var i = 0
    while (i < out.size) {
      out[i] = (bb.getShort().toFloat() / 32768f)
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
    val mags: FloatArray = FloatArray(FFT_SIZE / 2)

    while (idx + FRAME <= pcm.size) {
      // Hamming window & zero-padding
      java.util.Arrays.fill(windowed, 0f)
      val win: FloatArray = hamming(pcm, idx, FRAME)
      System.arraycopy(win, 0, windowed, 0, FRAME)

      // Fill re/im buffer (real, imag interleaved)
      java.util.Arrays.fill(fftBuffer, 0f)
      var w = 0; var b = 0
      while (w < FFT_SIZE) { fftBuffer[b] = windowed[w]; b += 2; w++ }

      // FFT → magnitude
      fft.forwardTransform(fftBuffer)
      fft.modulus(fftBuffer, mags)

      // === MFCC 직접 계산 ===
      val mfccs: FloatArray = computeMFCCFromSpectrum(
        mags = mags,
        sampleRate = SAMPLE_RATE,
        fftSize = FFT_SIZE,
        nMels = MEL_FILTERS,
        nMfcc = N_MFCC
      )

      // log, 정규화는 computeMFCCFromSpectrum 내부에서 처리됨
      val row = FloatArray(N_MFCC)
      var k = 0
      while (k < N_MFCC) {
        val v0: Float = if (k < mfccs.size) {
          val v = mfccs[k]
          if (v < 0f) -v else v
        } else 0f
        val vSafe = if (v0 <= 1e-6f) 1e-6f else v0
        row[k] = Math.log(vSafe.toDouble()).toFloat() // 안정적 로그
        k++
      }
      timeFeats.add(row)
      idx += HOP
    }

    // spec list -> array
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

    // out: 224x224x3 (list -> array)
    val outRows: ArrayList<Array<FloatArray>> = ArrayList(224)
    var r = 0
    while (r < 224) {
      val colList: ArrayList<FloatArray> = ArrayList(224)
      var c = 0
      while (c < 224) {
        val v = img[r][c]
        val triple = FloatArray(3)
        triple[0] = v
        triple[1] = v
        triple[2] = v
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
      out[i] = (src[off + i] * w.toFloat())
      i++
    }
    return out
  }

  private fun bilinearResizeAndNorm(src: Array<FloatArray>, h: Int, w: Int): Array<FloatArray> {
    val sh: Int = src.size
    val sw: Int = if (sh > 0) src[0].size else 1

    val outList: ArrayList<FloatArray> = ArrayList(h)
    var y = 0
    while (y < h) {
      outList.add(FloatArray(w))
      y++
    }

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

        val v = ((1f - wy) * ((1f - wx) * a + wx * b) + wy * ((1f - wx) * c + wx * d))
        outList[y][x] = v

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
        var x2 = 0
        while (x2 < w) {
          outList[y][x2] = (outList[y][x2] - mn) / s
          x2++
        }
        y++
      }
    } else {
      y = 0
      while (y < h) {
        var x3 = 0
        while (x3 < w) {
          outList[y][x3] = 0f
          x3++
        }
        y++
      }
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
    // 1) Mel 필터뱅크 (삼각 필터)
    val melFilters = buildMelFilterBank(sampleRate, fftSize, nMels)

    // 2) mel 에너지 = Σ |X(k)|^2 * filter
    val melEnergies = FloatArray(nMels)
    var m = 0
    while (m < nMels) {
      var sum = 0.0
      val filt = melFilters[m]
      var k = 0
      val len = mags.size.coerceAtMost(filt.size)
      while (k < len) {
        val p = mags[k].toDouble()
        sum += (p * p) * filt[k] // power spectrum
        k++
      }
      // 3) log
      melEnergies[m] = Math.log(if (sum <= 1e-10) 1e-10 else sum).toFloat()
      m++
    }

    // 4) DCT-II → MFCC (0..nMfcc-1)
    return dctTypeII(melEnergies, nMfcc)
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

    // mel 포인트를 FFT bin 인덱스로 매핑
    val bin = IntArray(nMels + 2)
    for (i in 0 until nMels + 2) {
      val hz = melToHz(melPoints[i])
      bin[i] = Math.floor((fftSize + 1) * hz / (2.0 * sampleRate)).toInt().coerceIn(0, nFftBins - 1)
    }

    // 삼각 필터 생성
    val filters = Array(nMels) { DoubleArray(nFftBins) }
    for (m in 1..nMels) {
      val f_m_minus = bin[m - 1]
      val f_m = bin[m]
      val f_m_plus = bin[m + 1]

      var k = f_m_minus
      while (k < f_m) {
        filters[m - 1][k] = (k - f_m_minus).toDouble() / (f_m - f_m_minus).toDouble().coerceAtLeast(1.0)
        k++
      }
      while (k <= f_m_plus && k < nFftBins) {
        filters[m - 1][k] = (f_m_plus - k).toDouble() / (f_m_plus - f_m).toDouble().coerceAtLeast(1.0)
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
      // 간단 정규화 (c0 특수처리 생략)
      out[k] = (sum * Math.sqrt(2.0 / N)).toFloat()
      k++
    }
    return out
  }
}
