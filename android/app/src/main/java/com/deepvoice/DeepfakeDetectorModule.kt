package com.deepvoice

import android.net.Uri
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.nnapi.NnApiDelegate
import org.tensorflow.lite.support.common.FileUtil
import be.tarsos.dsp.AudioEvent
import be.tarsos.dsp.io.TarsosDSPAudioFormat
import be.tarsos.dsp.mfcc.MFCC
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.*

class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  private var tflite: Interpreter? = null
  private val MODEL_NAME = "vgg19_alternative_mode.tflite"

  override fun getName() = "DeepfakeDetector"

  @ReactMethod
  fun initModel(promise: Promise) {
    try {
      val mmap = FileUtil.loadMappedFile(reactCtx, MODEL_NAME)
      val opt = Interpreter.Options().apply {
        setNumThreads(4)
        // 일부 기기에서 NNAPI가 느릴 수 있으므로 필요 시 주석 처리
        addDelegate(NnApiDelegate())
      }
      tflite = Interpreter(mmap, opt)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("MODEL_LOAD_FAIL", e)
    }
  }

  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      ensureModel()
      val pcm = readWav16kMono(uriString)
        ?: throw Exception("지원하지 않는 오디오 형식 (16kHz mono WAV만)")
      val input = computeCnnMFCC(pcm) // [224][224][3] float32
      val prob = runInference(input)  // Float (예: real 확률)
      val result = Arguments.createMap().apply {
        putDouble("prob_real", prob.toDouble())
        putString("result", if (prob >= 0.5f) "진짜 음성" else "가짜 음성")
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("DETECT_FAIL", e)
    }
  }

  // ---- Inference ----
  private fun runInference(input: Array<Array<FloatArray>>): Float {
    val interpreter = tflite ?: throw IllegalStateException("Model not initialized")
    val inBuf = ByteBuffer.allocateDirect(4 * 224 * 224 * 3).order(ByteOrder.nativeOrder())
    for (i in 0 until 224) for (j in 0 until 224) for (k in 0 until 3) {
      inBuf.putFloat(input[i][j][k])
    }
    val out = Array(1) { FloatArray(1) }
    interpreter.run(inBuf.rewind(), out)
    return out[0][0]
  }

  private fun ensureModel() {
    if (tflite == null) throw IllegalStateException("Call initModel() first")
  }

  // ---- WAV 16k mono → FloatArray ----
  private fun readWav16kMono(uriString: String): FloatArray? {
    val uri = Uri.parse(uriString)
    val ins = if (uri.scheme == "content") {
      reactCtx.contentResolver.openInputStream(uri)
    } else {
      java.io.FileInputStream(uri.path)
    } ?: return null

    val all = ins.readBytes().also { ins.close() }
    if (all.size < 44 || String(all.copyOfRange(0, 4)) != "RIFF") return null

    // data 청크 찾기
    var p = 12
    var dataOffset = -1
    var dataSize = -1
    while (p + 8 <= all.size) {
      val id = String(all.copyOfRange(p, p + 4))
      val sz = ByteBuffer.wrap(all, p + 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
      if (id == "data") {
        dataOffset = p + 8
        dataSize = sz
        break
      }
      p += 8 + sz
    }
    if (dataOffset < 0) return null

    val bb = ByteBuffer.wrap(all, dataOffset, dataSize).order(ByteOrder.LITTLE_ENDIAN)
    val out = FloatArray(dataSize / 2)
    for (i in out.indices) out[i] = (bb.short / 32768f)
    return out
  }

  // ---- MFCC → 224x224x3 ----
  private fun computeCnnMFCC(pcm: FloatArray): Array<Array<FloatArray>> {
    val SAMPLE_RATE = 16000
    val FRAME = 400  // 25 ms
    val HOP = 160    // 10 ms
    val N_MEL = 64   // 멜필터 개수
    val N_MFCC = 64  // MFCC 차원

    // TarsosDSP 전용 포맷 클래스
    val fmt = TarsosDSPAudioFormat(SAMPLE_RATE.toFloat(), 16, 1, true, false)
    // 6-인자 생성자: (frameSize, sampleRate, nMel, nMfcc, fmin, fmax)
    val mf = MFCC(
      FRAME,
      SAMPLE_RATE.toFloat(),
      N_MEL,
      N_MFCC,
      20f,
      SAMPLE_RATE / 2f
    )

    val timeFeats = mutableListOf<FloatArray>()
    var i = 0
    while (i + FRAME <= pcm.size) {
      val win = hamming(pcm, i, FRAME)
      val evt = AudioEvent(fmt)
      evt.setFloatBuffer(win)
      mf.process(evt)

      val coeffs = mf.mfcc // public float[] mfcc
      val row = FloatArray(N_MFCC) { idx ->
        val v = 1e-6f + kotlin.math.abs(coeffs[idx])
        kotlin.math.ln(v.toDouble()).toFloat()
      }
      timeFeats.add(row)
      i += HOP
    }

    val spec = timeFeats.toTypedArray()          // [time][N_MFCC]
    val img = bilinearResizeAndNorm(spec, 224, 224)
    return Array(224) { r ->
      Array(224) { c ->
        floatArrayOf(img[r][c], img[r][c], img[r][c])
      }
    }
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
    val sh = src.size
    val sw = src[0].size
    val out = Array(h) { FloatArray(w) }

    for (y in 0 until h) {
      val gy = (y.toFloat() * (sh - 1)) / (h - 1)
      val y0 = floor(gy).toInt().coerceIn(0, sh - 1)
      val y1 = min(y0 + 1, sh - 1)
      val wy = gy - y0
      for (x in 0 until w) {
        val gx = (x.toFloat() * (sw - 1)) / (w - 1)
        val x0 = floor(gx).toInt().coerceIn(0, sw - 1)
        val x1 = min(x0 + 1, sw - 1)
        val wx = gx - x0
        val a = src[y0][x0]
        val b = src[y0][x1]
        val c = src[y1][x0]
        val d = src[y1][x1]
        out[y][x] = ((1 - wy) * ((1 - wx) * a + wx * b) + wy * ((1 - wx) * c + wx * d)).toFloat()
      }
    }

    // 0~1 정규화
    var mn = Float.POSITIVE_INFINITY
    var mx = Float.NEGATIVE_INFINITY
    for (r in out) for (v in r) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    val s = (mx - mn).takeIf { it > 1e-6 } ?: 1f
    for (r in 0 until h) for (c in 0 until w) {
      out[r][c] = ((out[r][c] - mn) / s)
    }
    return out
  }
}
