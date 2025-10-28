package com.deepvoice

import android.app.Activity
import android.content.*
import android.media.*
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.*
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.pytorch.IValue
import org.pytorch.LiteModuleLoader
import org.pytorch.Module
import org.pytorch.Tensor
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteOrder
import java.security.MessageDigest
import kotlin.math.*
import java.util.concurrent.TimeUnit
import java.util.concurrent.CountDownLatch

class DeepfakeDetectorModule(private val reactCtx: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactCtx) {

  override fun getName(): String = "DeepfakeDetector"

  // ===== assets =====
  private val ENCODER_E2E_ASSET = "encoder_e2e_mobile.ptl"
  private val SIAMESE_ASSET     = "siamese_mobile.ptl"
  private val REF_ASSET         = "ref_embeddings_mobile.ptl"

  // ===== modules =====
  @Volatile private var encoderE2E: Module? = null
  @Volatile private var siamese: Module? = null
  @Volatile private var refBundle: Module? = null

  // ===== refs =====
  @Volatile private var refFake: FloatArray? = null
  @Volatile private var refReal: FloatArray? = null

  private val SAMPLE_RATE = 16000
  private val SIAMESE_RETURNS_REAL_THEN_FAKE = false
  private val APPLY_SIGMOID_ON_SIAMESE = false

  // ===== Mic monitor =====
  @Volatile private var micMonitor: MicStreamMonitor? = null

  // (Playback 관련 필드/리스너는 남겨둬도 되지만 Mic 방식만 쓸 거면 사용 안함)

  // ===== RN EventEmitter 호환용 스텁 (경고 제거)
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Int) {}

  // ===== Public API =====
  @ReactMethod
  fun initModels(promise: Promise) {
    try { ensureLoaded(); ensureRefsLoaded(); promise.resolve(true) }
    catch (e: Exception) { Log.e("Deepfake", "initModels failed", e); promise.reject("INIT_MODELS_ERR", e) }
  }
  @ReactMethod fun initModel(promise: Promise) = initModels(promise)

  @ReactMethod
  fun setReferenceEmbeddings(fakeRefEmb: ReadableArray, realRefEmb: ReadableArray, promise: Promise) {
    try {
      refFake = toFloatArray256(fakeRefEmb); refReal = toFloatArray256(realRefEmb)
      Log.i("Deepfake", "setReferenceEmbeddings: ok")
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("SET_REF_ERR", e) }
  }

  /** 파일에서 동기 검증 */
  @ReactMethod
  fun detectFromFile(uriString: String, promise: Promise) {
    try {
      ensureLoaded(); ensureRefsLoaded()
      val f = refFake ?: throw IllegalStateException("Ref(fake) not loaded")
      val r = refReal ?: throw IllegalStateException("Ref(real) not loaded")

      val pcm = decodeToMonoFloat(uriString, SAMPLE_RATE)
      require(pcm.isNotEmpty()) { "Decoded PCM is empty" }

      val emb = forwardEncoderE2E(pcm)
      val (pFake, pReal) = forwardSiamese(emb, f, r)
      val map = Arguments.createMap().apply {
        putDouble("pFake", pFake.toDouble())
        putDouble("pReal", pReal.toDouble())
        putString("label", if (pFake > pReal + 0.05f) "fake" else "real")
      }
      promise.resolve(map)
    } catch (e: Exception) {
      Log.e("Deepfake", "detectFromFile failed", e)
      promise.reject("DETECT_FILE_ERR", e)
    }
  }

  /** (새) 마이크 실시간 모니터 시작 */
  @ReactMethod
  fun startMicMonitor(options: ReadableMap?, promise: Promise) {
    try {
      ensureLoaded(); ensureRefsLoaded()
      val f = refFake ?: throw IllegalStateException("Ref(fake) not loaded")
      val r = refReal ?: throw IllegalStateException("Ref(real) not loaded")
      val winMs = options?.getIntOrDefault("windowMs", 1000) ?: 1000
      val hopMs = options?.getIntOrDefault("hopMs", 500) ?: 500

      stopMicMonitorInternal()

      micMonitor = MicStreamMonitor(
        encoder = encoderE2E!!,
        siam = siamese!!,
        refFake = f,
        refReal = r,
        windowMs = winMs,
        hopMs = hopMs,
        sampleRate = SAMPLE_RATE
      ) { rr -> sendRealtime(rr) }.also { it.start() }

      Log.i("Deepfake", "mic monitor started (winMs=$winMs, hopMs=$hopMs)")
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("Deepfake", "startMicMonitor failed", e)
      promise.reject("START_MIC_ERR", e)
    }
  }

  /** (새) 마이크 실시간 모니터 중지 */
  @ReactMethod
  fun stopMicMonitor(promise: Promise) {
    try {
      stopMicMonitorInternal()
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("STOP_MIC_ERR", e) }
  }

  // ===== Core =====
  @Synchronized private fun ensureLoaded() {
    if (encoderE2E == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, ENCODER_E2E_ASSET)
      encoderE2E = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded encoder: $p")
    }
    if (siamese == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, SIAMESE_ASSET)
      siamese = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded siamese: $p")
    }
  }

  @Synchronized private fun ensureRefsLoaded() {
    if (refFake != null && refReal != null) return
    if (refBundle == null) {
      val p = assetFilePathWithMd5Sync(reactCtx, REF_ASSET)
      refBundle = LiteModuleLoader.load(p)
      Log.i("Deepfake", "Loaded ref bundle: $p")
    }
    val tup = refBundle!!.forward().toTuple()
    val rf = tup[0].toTensor().dataAsFloatArray
    val rr = tup[1].toTensor().dataAsFloatArray
    require(rf.size == 256 && rr.size == 256) { "Ref bundle must contain 256-D tensors" }
    refFake = rf; refReal = rr
  }

  private fun forwardEncoderE2E(pcm: FloatArray): FloatArray {
    val t = Tensor.fromBlob(pcm, longArrayOf(1, 1, pcm.size.toLong()))
    val y = encoderE2E!!.forward(IValue.from(t)).toTensor().dataAsFloatArray
    require(y.size == 256) { "Encoder output must be 256-D, got ${y.size}" }
    return y
  }

  private fun forwardSiamese(anchor: FloatArray, fakeRef: FloatArray, realRef: FloatArray): Pair<Float, Float> {
    val shape = longArrayOf(1, 256)
    val tA = Tensor.fromBlob(anchor, shape)
    val tF = Tensor.fromBlob(fakeRef, shape)
    val tR = Tensor.fromBlob(realRef, shape)
    val out = siamese!!.forward(IValue.from(tA), IValue.from(tF), IValue.from(tR))
    return if (out.isTuple) {
      val tuple = out.toTuple()
      var first = tuple[0].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
      var second = tuple[1].toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
      if (APPLY_SIGMOID_ON_SIAMESE) { first = sigmoid(first); second = sigmoid(second) }
      var pF = first; var pR = second
      if (SIAMESE_RETURNS_REAL_THEN_FAKE) { val t = pF; pF = pR; pR = t }
      pF to pR
    } else {
      val s = out.toTensor().dataAsFloatArray.getOrNull(0) ?: 0f
      s to (1f - s)
    }
  }

  // ===== Emit to JS =====
  private fun sendRealtime(r: RealtimeResult) {
    try {
      val map = Arguments.createMap()
      map.putDouble("pFake", r.pFake.toDouble())
      map.putDouble("pReal", r.pReal.toDouble())
      map.putDouble("winSec", r.winSec.toDouble())
      map.putDouble("hopSec", r.hopSec.toDouble())
      map.putString("label", if (r.pFake > r.pReal + 0.05f) "fake" else "real")
      map.putDouble("timestamp", System.currentTimeMillis().toDouble())
      reactCtx
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("DeepfakeRealtime", map)
    } catch (e: Exception) { Log.w("Deepfake", "sendRealtime failed", e) }
  }

  // ===== Utils =====
  private fun sigmoid(x: Float): Float = (1f / (1f + kotlin.math.exp(-x)))

  private fun toFloatArray256(arr: ReadableArray): FloatArray {
    require(arr.size() == 256) { "Embedding must be 256-D" }
    val out = FloatArray(256)
    for (i in 0 until 256) out[i] = arr.getDouble(i).toFloat()
    return out
  }

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
  private fun md5OfFile(file: File): String {
    if (!file.exists()) return "NA"
    val md = MessageDigest.getInstance("MD5")
    file.inputStream().use { ins ->
      val buf = ByteArray(8192)
      while (true) {
        val r = ins.read(buf); if (r <= 0) break; md.update(buf, 0, r)
      }
    }
    return md.digest().joinToString("") { "%02x".format(it) }
  }
  private fun ReadableMap.getIntOrDefault(key: String, def: Int): Int? =
    if (hasKey(key) && !isNull(key)) getInt(key) else def

  // 파일 디코더(그대로 유지)
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
      var outSr = targetSr

      while (!sawOutputEOS) {
        if (!sawInputEOS) {
          val inIndex = decoder.dequeueInputBuffer(10_000)
          if (inIndex >= 0) {
            val buf = decoder.getInputBuffer(inIndex)!!
            val size = extractor.readSampleData(buf, 0)
            if (size < 0) {
              decoder.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              sawInputEOS = true
            } else {
              decoder.queueInputBuffer(inIndex, 0, size, extractor.sampleTime, 0)
              extractor.advance()
            }
          }
        }
        val outIndex = decoder.dequeueOutputBuffer(info, 10_000)
        if (outIndex >= 0) {
          val outBuf = decoder.getOutputBuffer(outIndex)!!
          if (info.size > 0) {
            val of = decoder.outputFormat
            val ch = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            val sr = of.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            outSr = sr

            val shortCount = info.size / 2
            val sb = outBuf.order(ByteOrder.LITTLE_ENDIAN).asShortBuffer()
            val tmp = ShortArray(shortCount)
            sb.get(tmp, 0, shortCount)

            var i = 0
            while (i < tmp.size) {
              var sum = 0f
              for (c in 0 until ch) sum += (tmp.getOrNull(i + c)?.toFloat() ?: 0f)
              val mono = (sum / ch) / 32768f
              pcm.add(mono); i += ch
            }
          }
          decoder.releaseOutputBuffer(outIndex, false)
          if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) sawOutputEOS = true
        }
      }
      decoder.stop(); decoder.release(); extractor.release()

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
    val outLen = max(1, kotlin.math.floor(src.size * ratio).toInt())
    val out = FloatArray(outLen)
    for (i in 0 until outLen) {
      val pos = i / ratio
      val i0 = kotlin.math.floor(pos).toInt().coerceIn(0, src.size - 1)
      val i1 = min(i0 + 1, src.size - 1)
      val frac = (pos - i0).toFloat()
      out[i] = src[i0] * (1 - frac) + src[i1] * frac
    }
    return out
  }

  private fun stopMicMonitorInternal() {
    try { micMonitor?.stop() } catch (_: Throwable) {}
    micMonitor = null
  }
}
