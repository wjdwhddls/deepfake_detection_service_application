// android/app/src/main/java/com/deepvoice/DeepfakeDetectorModule.kt
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
import java.security.MessageDigest
import kotlin.math.*

/**
 * On-device:
 *   audio file (PCM@16k) -> encoder_e2e_mobile.ptl  -> 256D
 *                        -> siamese_mobile.ptl      -> [pFake, pReal]
 *                        -> result
 */
class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  override fun getName(): String = "DeepfakeDetector"

  // ===== assets filenames (.ptl) =====
  private val ENCODER_E2E_ASSET = "encoder_e2e_mobile.ptl"    // [1,1,T] -> [1,256]
  private val SIAMESE_ASSET     = "siamese_mobile.ptl"        // (256,256,256) -> (pFake,pReal) or (pReal,pFake)
  private val REF_ASSET         = "ref_embeddings_mobile.ptl" // forward() -> (ref_fake[1,256], ref_real[1,256])

  // ===== PyTorch modules =====
  @Volatile private var encoderE2E: Module? = null
  @Volatile private var siamese: Module? = null
  @Volatile private var refBundle: Module? = null

  // ===== Stored references (자동 로드됨, JS로 override 가능) =====
  @Volatile private var refFake: FloatArray? = null
  @Volatile private var refReal: FloatArray? = null

  // ===== Audio config =====
  private val SAMPLE_RATE = 16000

  // 시암 출력 순서가 (real, fake)인 모델이면 true로 변경
  private val SIAMESE_RETURNS_REAL_THEN_FAKE = false

  // 디버그: 시암 출력이 logit일 경우 확률로 보기 위해 적용해볼 수 있음
  private val APPLY_SIGMOID_ON_SIAMESE = false

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
      Log.i("Deepfake", "setReferenceEmbeddings: fake[0..4]=${refFake!!.take(5)}, real[0..4]=${refReal!!.take(5)}")
      Log.i("Deepfake", "setReferenceEmbeddings: cos(fake,real)=${cos(refFake!!, refReal!!)}")
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

      // 1) 디코드(+필요 시 16k로 리샘플)
      val pcm = decodeToMonoFloat(uriString, SAMPLE_RATE)
      require(pcm.isNotEmpty()) { "Decoded PCM is empty" }
      Log.i("Deepfake", "decodeToMonoFloat: len=${pcm.size}") // ✅ 파이썬과 동일하게 '크롭 없음'

      // 2) 엔드투엔드 인코더 -> 256D
      val emb = forwardEncoderE2E(pcm)
      Log.i("Deepfake", "emb[0..4]=${emb.take(5)}")
      Log.i("Deepfake", "cos(emb, real)=${cos(emb, r)}  cos(emb, fake)=${cos(emb, f)}")

      // 3) 시암 추론 (raw 로그 포함)
      val (pFake, pReal) = forwardSiamese(emb, f, r)

      // 4) 결과
      promise.resolve(makeResultMap(pFake, pReal))
    } catch (e: Exception) {
      Log.e("Deepfake", "detectFromFile failed", e)
      promise.reject("DETECT_FILE_ERR", e)
    }
  }

  // ===== Core =====

  @Synchronized
  private fun ensureLoaded() {
    if (encoderE2E == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, ENCODER_E2E_ASSET)
      encoderE2E = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded E2E encoder: $p (md5=${md5OfPath(p)})")
    }
    if (siamese == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, SIAMESE_ASSET)
      siamese = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded siamese: $p (md5=${md5OfPath(p)})")
    }
  }

  /** ref_embeddings_mobile.ptl에서 refFake/refReal 자동 로드 */
  @Synchronized
  private fun ensureRefsLoaded() {
    if (refFake != null && refReal != null) return
    if (refBundle == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, REF_ASSET)
      refBundle = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded ref bundle: $p (md5=${md5OfPath(p)})")
    }
    // TorchScript forward() 0-arg 호출 → tuple(ref_fake[1,256], ref_real[1,256])
    val tup = refBundle!!.forward().toTuple()
    val rf = tup[0].toTensor().dataAsFloatArray
    val rr = tup[1].toTensor().dataAsFloatArray
    require(rf.size == 256 && rr.size == 256) { "Ref bundle must contain 256-D tensors" }
    refFake = rf
    refReal = rr

    // === Debug logs ===
    Log.i("Deepfake", "refFake[0..4]=${rf.take(5)}")
    Log.i("Deepfake", "refReal[0..4]=${rr.take(5)}")
    Log.i("Deepfake", "cos(fake,real)=${cos(rf, rr)}")
  }

  /** 엔드투엔드 임베더: PCM [T] -> FloatArray(256) */
  private fun forwardEncoderE2E(pcm: FloatArray): FloatArray {
    val t = Tensor.fromBlob(pcm, longArrayOf(1, 1, pcm.size.toLong()))
    val y = encoderE2E!!.forward(IValue.from(t)).toTensor().dataAsFloatArray
    require(y.size == 256) { "Encoder output must be 256-D, got ${y.size}" }
    return y
  }

  /** 시암: 256D×3 -> (pFake, pReal) */
  private fun forwardSiamese(anchor: FloatArray, fakeRef: FloatArray, realRef: FloatArray): Pair<Float, Float> {
    val shape = longArrayOf(1, 256)
    val tA = Tensor.fromBlob(anchor, shape)
    val tF = Tensor.fromBlob(fakeRef, shape)
    val tR = Tensor.fromBlob(realRef, shape)
    val out = siamese!!.forward(IValue.from(tA), IValue.from(tF), IValue.from(tR))

    // 두 값(tuple) 또는 단일 스칼라(이전 버전) 모두 가드
    return if (out.isTuple) {
      val tuple = out.toTuple()
      var firstRaw = tuple[0].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
      var secondRaw = tuple[1].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f

      Log.i("Deepfake", "siam raw: first=$firstRaw, second=$secondRaw")

      if (APPLY_SIGMOID_ON_SIAMESE) {
        firstRaw = sigmoid(firstRaw)
        secondRaw = sigmoid(secondRaw)
        Log.i("Deepfake", "siam sigmoid: first=$firstRaw, second=$secondRaw")
      }

      var first = firstRaw
      var second = secondRaw
      if (SIAMESE_RETURNS_REAL_THEN_FAKE) {
        val tmp = first; first = second; second = tmp
        Log.i("Deepfake", "siam order swapped -> pFake=$first, pReal=$second")
      } else {
        Log.i("Deepfake", "siam order assumed (fake, real) -> pFake=$first, pReal=$second")
      }
      first to second
    } else {
      val s = out.toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
      Log.i("Deepfake", "siam single out=$s (interpreted as pFake), pReal=1-pFake=${1f - s}")
      s to (1f - s)
    }
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
              val mono = (sum / ch) / 32768f
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

  // ===== helpers =====

  private fun sigmoid(x: Float): Float = (1f / (1f + kotlin.math.exp(-x)))

  private fun cos(a: FloatArray, b: FloatArray): Double {
    var dot = 0.0; var na = 0.0; var nb = 0.0
    val n = min(a.size, b.size)
    for (i in 0 until n) {
      dot += a[i] * b[i]
      na += a[i] * a[i]
      nb += b[i] * b[i]
    }
    return dot / (kotlin.math.sqrt(na) * kotlin.math.sqrt(nb) + 1e-12)
  }

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
    Log.i("Deepfake", "result: pFake=$pFake, pReal=$pReal, margin=$margin, label=${if (pFake > pReal + 0.05f) "fake" else "real"}")
    return map
  }

  /** 에셋을 내부저장소로 동기화: 기존 파일이 있어도 MD5가 다르면 덮어씀 (로그 포함) */
  private fun assetFilePathWithMd5Sync(context: Context, assetName: String): String {
    val outFile = File(context.filesDir, assetName)
    val tmpFile = File(context.cacheDir, "$assetName.tmp")
    context.assets.open(assetName).use { inp ->
      FileOutputStream(tmpFile, false).use { out -> inp.copyTo(out) }
    }
    val tmpMd5 = md5OfFile(tmpFile)

    val needCopy = (!outFile.exists()) || (md5OfFile(outFile) != tmpMd5)
    if (needCopy) {
      tmpFile.copyTo(outFile, overwrite = true)
      Log.i("Deepfake", "asset sync: '$assetName' updated -> ${outFile.absolutePath} (md5=$tmpMd5)")
    } else {
      Log.i("Deepfake", "asset sync: '$assetName' unchanged (md5=$tmpMd5)")
    }
    tmpFile.delete()
    return outFile.absolutePath
  }

  /** 파일 경로의 MD5 (문자열 반환) */
  private fun md5OfPath(path: String): String = md5OfFile(File(path))

  /** 파일의 MD5 (문자열 반환) */
  private fun md5OfFile(file: File): String {
    if (!file.exists()) return "NA"
    val md = MessageDigest.getInstance("MD5")
    file.inputStream().use { ins ->
      val buf = ByteArray(8192)
      while (true) {
        val r = ins.read(buf)
        if (r <= 0) break
        md.update(buf, 0, r)
      }
    }
    return md.digest().joinToString("") { "%02x".format(it) }
  }
}
