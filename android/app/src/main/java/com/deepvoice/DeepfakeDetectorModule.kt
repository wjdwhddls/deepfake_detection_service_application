package com.deepvoice

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import org.pytorch.IValue
import org.pytorch.LiteModuleLoader
import org.pytorch.Module
import org.pytorch.Tensor
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteOrder
import kotlin.math.*

// On-device: audio file -> log-mel(80) -> embedder .ptl -> 256D -> siamese .ptl -> [pFake, pReal]
class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  override fun getName(): String = "DeepfakeDetector"

  // ===== assets filenames (Lite .ptl) =====
  private val EMBEDDER_ASSET = "embedder_mobile.ptl"        // [1,80,T] -> [1,256] (또는 [256])
  private val SIAMESE_ASSET  = "siamese_mobile.ptl"         // (256,256,256) -> (pFake,pReal) 또는 (pReal,pFake)
  private val REF_ASSET      = "ref_embeddings_mobile.ptl"  // forward() -> (ref_fake[1,256], ref_real[1,256])

  // ===== PyTorch modules =====
  @Volatile private var embedder: Module? = null
  @Volatile private var siamese: Module?  = null
  @Volatile private var refBundle: Module? = null

  // ===== Stored references (자동 로드됨, JS로 override 가능) =====
  @Volatile private var refFake: FloatArray? = null
  @Volatile private var refReal: FloatArray? = null

  // ===== Feature config (WeSpeaker-like, 중요!) =====
  // WeSpeaker 기본에 맞춰 수정: 16k / 25ms / 10ms / FFT=512 / Hamming / dB+CMN
  private val SAMPLE_RATE = 16000
  private val WIN_MS = 25.0
  private val HOP_MS = 10.0
  private val N_MELS = 80
  private val MEL_MIN = -80.0
  private val MEL_MAX = 0.0

  private val WIN_SIZE = (SAMPLE_RATE * (WIN_MS / 1000.0)).roundToInt() // 400 @16k
  private val HOP_SIZE = (SAMPLE_RATE * (HOP_MS / 1000.0)).roundToInt() // 160 @16k
  private val FFT_SIZE = 512

  // 선택 기능(필요시 true): Kaldi 계열과 더 일치시키고 싶을 때
  private val USE_PREEMPHASIS = false
  private val PREEMPH_COEF = 0.97f
  private val USE_DITHER = false
  private val DITHER_STD = 1.0e-5f

  // 시암 출력 순서가 (real, fake)인 모델이면 true로 변경하세요.
  // 학습/내보내기 코드 기준이 확실하면 false로 고정.
  private val SIAMESE_RETURNS_REAL_THEN_FAKE = false

  // ===== Public API (JS) =====

  /** 모델 + 기준 임베딩 번들 로드 (권장) */
  @ReactMethod
  fun initModels(promise: Promise) {
    try {
      ensureLoaded()
      ensureRefsLoaded()
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("Deepfake", "initModels failed", e)
      promise.reject("INIT_MODELS_ERR", e)
    }
  }

  /** 레거시 호환: initModel() 이름도 허용 */
  @ReactMethod
  fun initModel(promise: Promise) = initModels(promise)

  /** JS에서 ref를 덮어쓰고 싶을 때 사용(선택) */
  @ReactMethod
  fun setReferenceEmbeddings(fakeRefEmb: ReadableArray, realRefEmb: ReadableArray, promise: Promise) {
    try {
      refFake = toFloatArray256(fakeRefEmb)
      refReal = toFloatArray256(realRefEmb)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_REF_ERR", e)
    }
  }

  /** 파일 1개 판별 (uriString: content:// 또는 file://) */
  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      ensureLoaded()
      ensureRefsLoaded()

      val f = refFake ?: throw IllegalStateException("Ref(fake) not loaded")
      val r = refReal ?: throw IllegalStateException("Ref(real) not loaded")

      val pcm = decodeToMonoFloat(uriString, SAMPLE_RATE)
      require(pcm.isNotEmpty()) { "Decoded PCM is empty" }

      val logMel = computeLogMel(pcm)          // [80, T] dB(-80~0), CMN 전 단계
      val emb = forwardEmbedder(logMel)        // 256-D
      val (pFake, pReal) = forwardSiamese(emb, f, r)

      promise.resolve(makeResultMap(pFake, pReal))
    } catch (e: Exception) {
      Log.e("Deepfake", "detectFromFile failed", e)
      promise.reject("DETECT_FILE_ERR", e)
    }
  }

  // ===== Core =====

  @Synchronized
  private fun ensureLoaded() {
    if (embedder == null) {
      val p = assetFilePath(reactCtx, EMBEDDER_ASSET)
      embedder = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded embedder: $p")
    }
    if (siamese == null) {
      val p = assetFilePath(reactCtx, SIAMESE_ASSET)
      siamese = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded siamese:  $p")
    }
  }

  /** ref_embeddings_mobile.ptl에서 refFake/refReal 자동 로드 */
  @Synchronized
  private fun ensureRefsLoaded() {
    if (refFake != null && refReal != null) return

    if (refBundle == null) {
      val p = assetFilePath(reactCtx, REF_ASSET)
      refBundle = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded ref bundle: $p")
    }
    // TorchScript forward() 0-arg 호출 → tuple(ref_fake[1,256], ref_real[1,256])
    val tup = refBundle!!.forward().toTuple()
    val rf = tup[0].toTensor().dataAsFloatArray
    val rr = tup[1].toTensor().dataAsFloatArray
    require(rf.size == 256 && rr.size == 256) { "Ref bundle must contain 256-D tensors" }
    refFake = rf
    refReal = rr
  }

  /** 임베더: log-mel [N_MELS, T] -> FloatArray(256) */
  private fun forwardEmbedder(logMel: Array<FloatArray>): FloatArray {
    val T = if (logMel.isNotEmpty()) logMel[0].size else 0
    require(T > 0) { "Empty log-mel" }

    // (1) CMN: 각 멜 차원별 시간 평균 제거
    val cmn = Array(N_MELS) { FloatArray(T) }
    for (m in 0 until N_MELS) {
      var mean = 0.0
      for (t in 0 until T) mean += logMel[m][t]
      mean /= max(1, T)
      for (t in 0 until T) cmn[m][t] = (logMel[m][t] - mean).toFloat()
    }

    // (2) 그대로 텐서 생성 (0~1 스케일링 없음)
    val input = FloatArray(N_MELS * T)
    var idx = 0
    for (m in 0 until N_MELS) for (t in 0 until T) input[idx++] = cmn[m][t]
    val x = Tensor.fromBlob(input, longArrayOf(1, N_MELS.toLong(), T.toLong()))

    val y = embedder!!.forward(IValue.from(x)).toTensor().dataAsFloatArray
    require(y.size == 256) { "Embedder output must be 256-D, got ${y.size}" }
    return y
  }

  /** 시암: 256D×3 -> (pFake, pReal) */
  private fun forwardSiamese(anchor: FloatArray, fakeRef: FloatArray, realRef: FloatArray): Pair<Float, Float> {
    val shape = longArrayOf(1, 256)
    val tA = Tensor.fromBlob(anchor, shape)
    val tF = Tensor.fromBlob(fakeRef, shape)
    val tR = Tensor.fromBlob(realRef, shape)
    val tuple = siamese!!.forward(IValue.from(tA), IValue.from(tF), IValue.from(tR)).toTuple()

    var first = tuple[0].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
    var second = tuple[1].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f

    // 모델이 (real, fake) 순서를 낸다면 스와핑
    if (SIAMESE_RETURNS_REAL_THEN_FAKE) {
      val tmp = first; first = second; second = tmp
    }

    val pFake = first
    val pReal = second
    return pFake to pReal
  }

  // ===== Audio decode (file/content URI -> mono float @ targetSr) =====
  private fun decodeToMonoFloat(uriStr: String, targetSr: Int): FloatArray {
    val uri = Uri.parse(uriStr)
    val resolver = reactCtx.contentResolver
    val extractor = MediaExtractor()
    try {
      when (uri.scheme) {
        "file" -> extractor.setDataSource(uri.path!!)
        else -> resolver.openFileDescriptor(uri, "r")!!.use { pfd ->
          extractor.setDataSource(pfd.fileDescriptor)
        }
      }
      var track = -1
      for (i in 0 until extractor.trackCount) {
        val fmt = extractor.getTrackFormat(i)
        val mime = fmt.getString(MediaFormat.KEY_MIME) ?: ""
        if (mime.startsWith("audio/")) { track = i; break }
      }
      require(track >= 0) { "No audio track" }
      extractor.selectTrack(track)

      val mime = extractor.getTrackFormat(track).getString(MediaFormat.KEY_MIME)!!
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(extractor.getTrackFormat(track), null, null, 0)
      decoder.start()

      val pcm = ArrayList<Float>()
      val info = MediaCodec.BufferInfo()
      var sawInputEOS = false
      var sawOutputEOS = false
      var outCh = 1
      var outSr = targetSr

      while (!sawOutputEOS) {
        if (!sawInputEOS) {
          val inIndex = decoder.dequeueInputBuffer(10_000)
          if (inIndex >= 0) {
            val buf = decoder.getInputBuffer(inIndex)!!
            val sampleSize = extractor.readSampleData(buf, 0)
            if (sampleSize < 0) {
              decoder.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              sawInputEOS = true
            } else {
              decoder.queueInputBuffer(inIndex, 0, sampleSize, extractor.sampleTime, 0)
              extractor.advance()
            }
          }
        }
        val outIndex = decoder.dequeueOutputBuffer(info, 10_000)
        if (outIndex >= 0) {
          val outBuf = decoder.getOutputBuffer(outIndex)!!
          if (info.size > 0) {
            val outFormat = decoder.outputFormat
            val ch = outFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            val sr = outFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            outCh = ch; outSr = sr

            // PCM 16-bit little-endian 가정
            val shortCount = info.size / 2
            val sb = outBuf.order(ByteOrder.LITTLE_ENDIAN).asShortBuffer()
            val tmp = ShortArray(shortCount)
            sb.get(tmp, 0, shortCount)

            var i = 0
            while (i < tmp.size) {
              var sum = 0f
              for (c in 0 until ch) {
                val v = tmp.getOrNull(i + c)?.toFloat() ?: 0f
                sum += v
              }
              var mono = (sum / ch) / 32768f

              // 선택: dither / pre-emphasis
              if (USE_DITHER) {
                mono += (Math.random().toFloat() * 2f - 1f) * DITHER_STD
              }
              if (USE_PREEMPHASIS) {
                // pre-emphasis는 frame단위 대신 연속 신호에 적용(간단 구현)
                // 실제 CMVN 파이프라인과 다른 세부는 무시
                // (정확히 맞추려면 파이썬에서 프론트엔드 포함해 .ptl로 묶는 것이 최선)
              }

              pcm.add(mono)
              i += ch
            }
          }
          decoder.releaseOutputBuffer(outIndex, false)
          if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) sawOutputEOS = true
        }
      }
      decoder.stop()
      decoder.release()
      extractor.release()

      val mono = pcm.toFloatArray()
      return if (outSr == targetSr) mono else resampleLinear(mono, outSr, targetSr)
    } catch (e: Exception) {
      try { extractor.release() } catch (_: Exception) {}
      throw e
    }
  }

  private fun resampleLinear(src: FloatArray, srcSr: Int, dstSr: Int): FloatArray {
    if (srcSr == dstSr || src.isEmpty()) return src
    val ratio = dstSr.toDouble() / srcSr
    val outLen = max(1, floor(src.size * ratio).toInt())
    val out = FloatArray(outLen)
    for (i in 0 until outLen) {
      val pos = i / ratio
      val i0 = floor(pos).toInt().coerceIn(0, src.size - 1)
      val i1 = min(i0 + 1, src.size - 1)
      val frac = (pos - i0).toFloat()
      out[i] = src[i0] * (1 - frac) + src[i1] * frac
    }
    return out
  }

  // ===== Log-mel (80, 25ms/10ms, Hamming, clamp[-80,0], 0~1 스케일 X) =====
  private fun computeLogMel(xIn: FloatArray): Array<FloatArray> {
    // 선택: pre-emphasis (간단 적용)
    val x = if (USE_PREEMPHASIS && xIn.isNotEmpty()) {
      val y = FloatArray(xIn.size)
      y[0] = xIn[0]
      for (i in 1 until xIn.size) y[i] = xIn[i] - PREEMPH_COEF * xIn[i - 1]
      y
    } else xIn

    val frames = frameSignal(x, WIN_SIZE, HOP_SIZE)
    val hamming = FloatArray(WIN_SIZE) { i ->
      (0.54f - 0.46f * kotlin.math.cos(2.0 * Math.PI * i / (WIN_SIZE - 1))).toFloat()
    }

    val spec = Array(frames.size) { FloatArray(FFT_SIZE / 2 + 1) }
    val re = FloatArray(FFT_SIZE)
    val im = FloatArray(FFT_SIZE)
    val tw = precomputeTwiddles(FFT_SIZE)

    for (t in frames.indices) {
      java.util.Arrays.fill(re, 0f); java.util.Arrays.fill(im, 0f)
      for (i in 0 until WIN_SIZE) re[i] = frames[t][i] * hamming[i]
      fftRadix2(re, im, tw)
      for (k in 0..FFT_SIZE/2) {
        val p = re[k]*re[k] + im[k]*im[k]
        spec[t][k] = p
      }
    }

    val melFb = melFilterBank(SAMPLE_RATE, FFT_SIZE, N_MELS, 20.0, SAMPLE_RATE / 2.0)
    val T = frames.size
    val mel = Array(N_MELS) { FloatArray(T) }
    for (m in 0 until N_MELS) {
      for (t in 0 until T) {
        var s = 0f
        for (pair in melFb[m]) {
          val idx = pair.first
          val w = pair.second
          s += w * spec[t][idx]
        }
        var db = (10.0 * ln((s.toDouble() + 1e-10)) / ln(10.0)).toFloat() // 10*log10(power)
        if (db.isNaN() || db.isInfinite()) db = -80f
        mel[m][t] = db.coerceIn(MEL_MIN.toFloat(), MEL_MAX.toFloat())
      }
    }
    return mel
  }

  private fun frameSignal(x: FloatArray, win: Int, hop: Int): Array<FloatArray> {
    if (x.isEmpty()) return arrayOf(FloatArray(win))
    if (x.size < win) return arrayOf(x.copyOf(win)) // zero-pad
    val nFrames = 1 + (x.size - win) / hop
    val out = Array(nFrames) { FloatArray(win) }
    var start = 0
    for (t in 0 until nFrames) {
      System.arraycopy(x, start, out[t], 0, win)
      start += hop
    }
    return out
  }

  private data class Tw(val c: FloatArray, val s: FloatArray)
  private fun precomputeTwiddles(n: Int): Tw {
    val c = FloatArray(n / 2); val s = FloatArray(n / 2)
    for (i in 0 until n / 2) {
      val ang = -2.0 * Math.PI * i / n
      c[i] = kotlin.math.cos(ang).toFloat()
      s[i] = kotlin.math.sin(ang).toFloat()
    }
    return Tw(c, s)
  }
  private fun fftRadix2(re: FloatArray, im: FloatArray, tw: Tw) {
    val n = re.size
    var j = 0
    for (i in 1 until n - 1) {
      var bit = n shr 1
      while (j >= bit) { j -= bit; bit = bit shr 1 }
      j += bit
      if (i < j) {
        val tr = re[i]; re[i] = re[j]; re[j] = tr
        val ti = im[i]; im[i] = im[j]; im[j] = ti
      }
    }
    var len = 2
    while (len <= n) {
      val half = len / 2
      val step = n / len
      var i = 0
      while (i < n) {
        var k = 0
        for (j2 in i until i + half) {
          val tpre = re[j2 + half] * tw.c[k] - im[j2 + half] * tw.s[k]
          val tpim = re[j2 + half] * tw.s[k] + im[j2 + half] * tw.c[k]
          re[j2 + half] = re[j2] - tpre
          im[j2 + half] = im[j2] - tpim
          re[j2] += tpre
          im[j2] += tpim
          k += step
        }
        i += len
      }
      len = len shl 1
    }
  }

  private fun hz2mel(hz: Double) = 2595.0 * ln(1.0 + hz / 700.0) / ln(10.0)
  private fun mel2hz(m: Double) = 700.0 * (10.0.pow(m / 2595.0) - 1.0)

  private fun melFilterBank(sr: Int, nFft: Int, nMels: Int, fmin: Double, fmax: Double): Array<Array<Pair<Int, Float>>> {
    val mMin = hz2mel(fmin)
    val mMax = hz2mel(fmax)
    val mpts = DoubleArray(nMels + 2) { i -> mMin + (mMax - mMin) * i / (nMels + 1) }
    val fpts = DoubleArray(nMels + 2) { i -> mel2hz(mpts[i]) }
    val bins = IntArray(nMels + 2) { i -> floor((nFft + 1) * fpts[i] / sr).toInt().coerceIn(0, nFft / 2) }

    val fb = Array(nMels) { ArrayList<Pair<Int, Float>>() }
    for (m in 1..nMels) {
      val f_m_minus = bins[m - 1]
      val f_m = bins[m]
      val f_m_plus = bins[m + 1]

      for (k in f_m_minus until f_m) {
        val w = (k - f_m_minus).toFloat() / (f_m - f_m_minus).toFloat().coerceAtLeast(1f)
        fb[m - 1].add(Pair(k, w))
      }
      for (k in f_m until f_m_plus) {
        val w = (f_m_plus - k).toFloat() / (f_m_plus - f_m).toFloat().coerceAtLeast(1f)
        fb[m - 1].add(Pair(k, w))
      }
    }
    return Array(nMels) { fb[it].toTypedArray() }
  }

  // ===== helpers =====

  private fun toFloatArray256(arr: ReadableArray): FloatArray {
    require(arr.size() == 256) { "Embedding must be 256-D" }
    val out = FloatArray(256)
    for (i in 0 until 256) out[i] = arr.getDouble(i).toFloat()
    return out
  }

  private fun makeResultMap(pFake: Float, pReal: Float): WritableMap {
    val map = Arguments.createMap()
    map.putDouble("pFake", pFake.toDouble())
    map.putDouble("pReal", pReal.toDouble())
    val margin = (pFake - pReal)
    map.putDouble("margin", margin.toDouble())
    map.putString("label", if (pFake > pReal + 0.05f) "fake" else "real")
    return map
  }

  /** assets -> 내부저장소 복사 후 경로 반환 (PyTorch Lite Module.load 용) */
  private fun assetFilePath(context: Context, assetName: String): String {
    val file = File(context.filesDir, assetName)
    if (file.exists() && file.length() > 0) return file.absolutePath
    context.assets.open(assetName).use { inp ->
      FileOutputStream(file).use { out ->
        val buffer = ByteArray(4 * 1024)
        while (true) {
          val read = inp.read(buffer)
          if (read <= 0) break
          out.write(buffer, 0, read)
        }
        out.flush()
      }
    }
    return file.absolutePath
  }
}
