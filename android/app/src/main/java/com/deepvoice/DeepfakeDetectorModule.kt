package com.deepvoice

import android.app.Activity
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.MediaRecorder
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
import be.tarsos.dsp.mfcc.MFCC
import be.tarsos.dsp.AudioEvent
import be.tarsos.dsp.io.TarsosDSPAudioFormat
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.math.*

class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

  init {
    reactCtx.addActivityEventListener(this)
  }

  private var tflite: Interpreter? = null
  private val MODEL_NAME = "vgg19_alternative_mode.tflite"

  // Playback capture
  private var mediaProjection: MediaProjection? = null
  private var recorder: AudioRecord? = null
  private var captureThread: Thread? = null

  // Realtime inference
  private var monitorThread: Thread? = null
  @Volatile private var monitoring = false
  private val pcmQueue = ArrayBlockingQueue<Short>(16000 * 10) // 10초 버퍼

  override fun getName() = "DeepfakeDetector"

  // ===== Public API (JS) =====

  @ReactMethod
  fun initModel(promise: Promise) {
    try {
      if (tflite != null) { promise.resolve(true); return }
      val mmap = FileUtil.loadMappedFile(reactCtx, MODEL_NAME)
      val opt = Interpreter.Options().apply {
        setNumThreads(4)
        // 기기에 따라 느릴 수 있음. 필요시 주석 처리.
        addDelegate(NnApiDelegate())
      }
      tflite = Interpreter(mmap, opt)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("MODEL_LOAD_FAIL", e)
    }
  }

  /**
   * 1) Playback capture 권한 요청 (Android 10+)
   *    승인 다이얼로그가 뜨고, 결과는 onProjectionResult()로 콜백됨.
   */
  @ReactMethod
  fun requestPlaybackCapture(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+")
      return
    }
    try {
      val current = currentActivity
        ?: run { promise.reject("NO_ACTIVITY", "No foreground Activity"); return }
      val intent = Intent(current, PlaybackCaptureActivity::class.java)
      current.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REQ_CAPTURE_FAIL", e)
    }
  }

  /**
   * 2) 통화 중 모니터 시작
   *    - AudioRecord(PlaybackCapture)로 재생 오디오(=원격 음성) 수집
   *    - 윈도잉→MFCC→TFLite→결과 이벤트 'DeepfakeVerdict' 송신
   */
  @ReactMethod
  fun startStreamMonitor(remoteTrackId: String?, options: ReadableMap?, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject("UNSUPPORTED", "Playback capture needs Android 10+")
      return
    }
    try {
      ensureModel()
      if (monitoring) { promise.resolve(true); return }

      // AudioRecord 시작
      startPlaybackRecorder()

      // 추론 스레드 시작 (1초 윈도우)
      monitoring = true
      monitorThread = Thread { runInferenceLoop() }.apply { start() }

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STREAM_START_FAIL", e)
    }
  }

  /**
   * 3) 모니터 정지
   */
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

  /**
   * 파일 기반 검출 (기존 기능 유지)
   */
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
    } catch (e: Exception) {
      promise.reject("DETECT_FAIL", e)
    }
  }

  // ===== Playback capture: MediaProjection result bridge =====

  companion object {
    // PlaybackCaptureActivity → 여기로 전달
    fun onProjectionResult(data: Intent) {
      _lastProjectionData = data
    }
    private var _lastProjectionData: Intent? = null
  }

  // ActivityEventListener (unused; 별도 투명 Activity에서 콜백을 static으로 전달)
  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {}
  override fun onNewIntent(intent: Intent?) {}

  // ===== Internal: AudioRecord (Playback capture) =====

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun startPlaybackRecorder() {
    if (recorder != null) return

    val mpm = reactCtx.getSystemService(Activity.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val projIntent = _lastProjectionData ?: throw IllegalStateException("Call requestPlaybackCapture() first")
    mediaProjection = mpm.getMediaProjection(Activity.RESULT_OK, projIntent)

    // 우리 앱(현재 uid)의 재생 오디오 + 통화 용도만 타깃
    val config = AudioPlaybackCaptureConfiguration.Builder(mediaProjection!!)
      .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
      // .addMatchingUid(android.os.Process.myUid()) // (기본적으로 자가 UID)
      .build()

    // 캡처는 48k/16k 등 가능. 모델 입력은 16k 모노이므로 다운샘플링.
    val srcRate = 48000
    val channelMask = AudioFormat.CHANNEL_IN_MONO
    val audioFormat = AudioFormat.ENCODING_PCM_16BIT

    val minBuf = AudioRecord.getMinBufferSize(srcRate, channelMask, audioFormat)
    recorder = AudioRecord.Builder()
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(audioFormat)
          .setSampleRate(srcRate)
          .setChannelMask(channelMask)
          .build()
      )
      .setBufferSizeInBytes(minBuf * 4)
      .setAudioPlaybackCaptureConfig(config)
      .build()

    recorder?.startRecording()

    // 캡처 스레드: 48k → 16k 다운샘플·큐 적재
    captureThread = Thread {
      val buf = ShortArray(2048)
      while (recorder != null && recorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        val n = recorder!!.read(buf, 0, buf.size)
        if (n > 0) {
          // 48k 모노 → 16k 모노 (간단 decimate by 3)
          var i = 0
          while (i + 2 < n) {
            val s = buf[i] // 매우 단순 decimation (필요하면 FIR/소프트 다운샘플로 개선)
            pcmQueue.offer(s)
            i += 3
          }
        } else {
          Thread.sleep(5)
        }
      }
    }.apply { start() }
  }

  private fun stopPlaybackRecorder() {
    recorder?.let {
      try { it.stop() } catch (_: Throwable) {}
      try { it.release() } catch (_: Throwable) {}
    }
    recorder = null

    mediaProjection?.stop()
    mediaProjection = null

    captureThread?.join(200)
    captureThread = null
  }

  // ===== Realtime inference loop =====

  private fun runInferenceLoop() {
    val sr = 16000
    val windowMs = 1000
    val samplesPerWin = sr * windowMs / 1000 // 16000

    val floatBuf = FloatArray(samplesPerWin)
    val shortTmp = ShortArray(samplesPerWin)

    while (monitoring) {
      var got = 0
      while (got < samplesPerWin && monitoring) {
        val s = pcmQueue.poll(10, TimeUnit.MILLISECONDS)
        if (s != null) {
          shortTmp[got++] = s
        }
      }
      if (!monitoring) break

      for (i in 0 until samplesPerWin) floatBuf[i] = shortTmp[i] / 32768f

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
    val inBuf = ByteBuffer.allocateDirect(4 * 224 * 224 * 3).order(ByteOrder.nativeOrder())
    for (i in 0 until 224) for (j in 0 until 224) for (k in 0 until 3) inBuf.putFloat(input[i][j][k])
    val out = Array(1) { FloatArray(1) }
    interpreter.run(inBuf.rewind(), out)
    return out[0][0]
  }

  // ===== WAV 16k mono → FloatArray =====

  private fun readWav16kMono(uriString: String): FloatArray? {
    val uri = Uri.parse(uriString)
    val ins = if (uri.scheme == "content") {
      reactCtx.contentResolver.openInputStream(uri)
    } else {
      java.io.FileInputStream(uri.path)
    } ?: return null

    val all = ins.readBytes().also { ins.close() }
    if (all.size < 44 || String(all.copyOfRange(0,4)) != "RIFF") return null

    var p = 12
    var dataOffset = -1
    var dataSize = -1
    while (p + 8 <= all.size) {
      val id = String(all.copyOfRange(p, p+4))
      val sz = ByteBuffer.wrap(all, p+4, 4).order(ByteOrder.LITTLE_ENDIAN).int
      if (id == "data") { dataOffset = p + 8; dataSize = sz; break }
      p += 8 + sz
    }
    if (dataOffset < 0) return null

    val bb = ByteBuffer.wrap(all, dataOffset, dataSize).order(ByteOrder.LITTLE_ENDIAN)
    val out = FloatArray(dataSize / 2)
    for (i in out.indices) out[i] = (bb.short / 32768f)
    return out
  }

  // ===== MFCC → 224x224x3 =====

  private fun computeCnnMFCC(pcm: FloatArray): Array<Array<FloatArray>> {
    val SAMPLE_RATE = 16000
    val FRAME = 400  // 25 ms
    val HOP = 160    // 10 ms
    val N_MFCC = 64

    val fmt = TarsosDSPAudioFormat(SAMPLE_RATE.toFloat(), 16, 1, true, false)
    val mf = MFCC(FRAME, SAMPLE_RATE.toFloat(), N_MFCC, 20f, (SAMPLE_RATE/2).toFloat())

    val timeFeats = mutableListOf<FloatArray>()
    var i = 0
    while (i + FRAME <= pcm.size) {
      val win = hamming(pcm, i, FRAME)
      val evt = AudioEvent(fmt)
      evt.floatBuffer = win
      mf.process(evt)
      val row = FloatArray(N_MFCC) { idx ->
        ln(1e-6f + kotlin.math.abs(mf.mfcc[idx]))
      }
      timeFeats.add(row)
      i += HOP
    }
    val spec = timeFeats.toTypedArray()
    val img = bilinearResizeAndNorm(spec, 224, 224)
    return Array(224) { r -> Array(224) { c -> floatArrayOf(img[r][c], img[r][c], img[r][c]) } }
  }

  private fun hamming(src: FloatArray, off: Int, n: Int): FloatArray {
    val out = FloatArray(n)
    val twoPi = 2f * Math.PI.toFloat()
    for (i in 0 until n) {
      out[i] = src[off + i] * (0.54f - 0.46f * kotlin.math.cos(twoPi * i / (n - 1)))
    }
    return out
  }

  private fun bilinearResizeAndNorm(src: Array<FloatArray>, h: Int, w: Int): Array<FloatArray> {
    val sh = src.size; val sw = src[0].size
    val out = Array(h){ FloatArray(w) }
    for (y in 0 until h) {
      val gy = (y.toFloat() * (sh - 1)) / (h - 1)
      val y0 = floor(gy).toInt().coerceIn(0, sh-1); val y1 = min(y0 + 1, sh-1); val wy = gy - y0
      for (x in 0 until w) {
        val gx = (x.toFloat() * (sw - 1)) / (w - 1)
        val x0 = floor(gx).toInt().coerceIn(0, sw-1); val x1 = min(x0 + 1, sw-1); val wx = gx - x0
        val a = src[y0][x0]; val b = src[y0][x1]; val c = src[y1][x0]; val d = src[y1][x1]
        out[y][x] = ((1-wy)*((1-wx)*a + wx*b) + wy*((1-wx)*c + wx*d)).toFloat()
      }
    }
    var mn = Float.POSITIVE_INFINITY; var mx = Float.NEGATIVE_INFINITY
    for (r in out) for (v in r) { if (v < mn) mn = v; if (v > mx) mx = v }
    val s = (mx - mn).takeIf { it > 1e-6 } ?: 1f
    for (r in 0 until h) for (c in 0 until w) out[r][c] = ((out[r][c] - mn) / s)
    return out
  }
}
