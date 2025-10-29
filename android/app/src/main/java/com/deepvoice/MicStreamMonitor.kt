package com.deepvoice

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import android.util.Log
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.Tensor
import kotlin.concurrent.thread
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt
import kotlin.math.exp
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.media.audiofx.AcousticEchoCanceler

data class RealtimeResult(
  val pFake: Float,
  val pReal: Float,
  val winSec: Float,
  val hopSec: Float
)

/** 마이크 입력을 캡처해 실시간으로 추론한다. (MediaProjection 불필요) */
class MicStreamMonitor(
  private val encoder: Module,
  private val siam: Module,
  private val refFake: FloatArray,
  private val refReal: FloatArray,
  private val windowMs: Int,
  private val hopMs: Int,
  private val sampleRate: Int = 16000,
  private val onResult: (RealtimeResult) -> Unit
) {
  // ===== 동작 옵션 =====
  private val USE_VOICE_RECOGNITION_SOURCE = true      // VOICE_RECOGNITION 사용
  private val DISABLE_BUILTIN_AUDIO_EFFECTS = true     // AEC/NS/AGC 전부 끄기
  private val APPLY_RMS_NORMALIZE = false              // 파일 경로와 동일하게 OFF(필요시 true)
  private val SIAMESE_RETURNS_REAL_THEN_FAKE = false   // 모델이 [real,fake] 순이라면 true
  private val LOGIT_SCALE = 2.0f                       // 마진 스케일 (1.0~3.0 사이 튜닝)
  // =====================

  @Volatile private var running = false
  private var worker: Thread? = null
  private var rec: AudioRecord? = null

  // 오디오 이펙트(끄기/해제용)
  private var agc: AutomaticGainControl? = null
  private var ns: NoiseSuppressor? = null
  private var aec: AcousticEchoCanceler? = null

  fun start() {
    if (running) return
    running = true
    worker = thread(name = "DeepfakeMicMon") { runLoop() }
  }

  fun stop() {
    running = false
    try { worker?.join(500) } catch (_: Throwable) {}
    cleanupRecorder()
  }

  private fun runLoop() {
    try { Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO) } catch (_: Throwable) {}

    val winSamp = (windowMs * sampleRate) / 1000
    val hopMsSafe = hopMs.coerceAtLeast(10)

    // 버퍼 사이즈: 최소 필요치와 윈도우 크기, 샘플레이트 등을 고려해 여유 확보
    val minBuf = AudioRecord.getMinBufferSize(
      sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
    )
    val buf = max(minBuf * 2, max(sampleRate, winSamp * 2))

    // 소스 선택
    val source = if (USE_VOICE_RECOGNITION_SOURCE)
      MediaRecorder.AudioSource.VOICE_RECOGNITION
    else
      MediaRecorder.AudioSource.VOICE_COMMUNICATION

    rec = AudioRecord(
      source,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      buf
    )

    if (rec?.state != AudioRecord.STATE_INITIALIZED) {
      Log.e("Deepfake", "AudioRecord init failed (state=${rec?.state})")
      cleanupRecorder()
      return
    }

    // 이펙트 비활성화(가능한 경우)
    if (DISABLE_BUILTIN_AUDIO_EFFECTS) {
      try {
        val sid = rec!!.audioSessionId
        agc = AutomaticGainControl.create(sid)?.apply { setEnabled(false) }
        ns  = NoiseSuppressor.create(sid)?.apply { setEnabled(false) }
        aec = AcousticEchoCanceler.create(sid)?.apply { setEnabled(false) }
      } catch (t: Throwable) {
        Log.w("Deepfake", "Disable audio effects failed: ${t.message}")
      }
    }

    try {
      rec?.startRecording()
    } catch (t: Throwable) {
      Log.e("Deepfake", "Mic startRecording failed: ${t.message}")
      cleanupRecorder()
      return
    }

    // 고정 길이 링버퍼
    val ring = FloatArray(max(winSamp * 3, max(48000, sampleRate * 2)))
    var wPos = 0
    fun push(s: FloatArray, n: Int) { var i = 0; while (i < n) { ring[wPos % ring.size] = s[i]; wPos++; i++ } }

    val tmpShort = ShortArray(4096)
    val tmpFloat = FloatArray(tmpShort.size)
    var lastInfer = 0L

    try {
      while (running) {
        val n = rec?.read(tmpShort, 0, tmpShort.size, AudioRecord.READ_BLOCKING) ?: 0
        if (n > 0) {
          var i = 0
          while (i < n) { tmpFloat[i] = tmpShort[i] / 32768f; i++ }
          push(tmpFloat, n)
        }

        val now = System.currentTimeMillis()
        if (now - lastInfer >= hopMsSafe && wPos >= winSamp) {
          val start = (wPos - winSamp).coerceAtLeast(0)
          val win = FloatArray(winSamp)
          var i = 0
          while (i < winSamp) { win[i] = ring[(start + i) % ring.size]; i++ }

          if (APPLY_RMS_NORMALIZE) rmsNormalize(win, 0.10f)

          val (pF, pR) = infer(win)
          onResult(RealtimeResult(pF, pR, windowMs / 1000f, hopMsSafe / 1000f))
          lastInfer = now
        }
      }
    } finally {
      cleanupRecorder()
    }
  }

  private fun cleanupRecorder() {
    try { rec?.stop() } catch (_: Throwable) {}
    try { rec?.release() } catch (_: Throwable) {}
    rec = null

    // 이펙트 해제
    try { agc?.release() } catch (_: Throwable) {}
    try { ns?.release() } catch (_: Throwable) {}
    try { aec?.release() } catch (_: Throwable) {}
    agc = null; ns = null; aec = null
  }

  // 창 단위 RMS 정규화(옵션)
  private fun rmsNormalize(x: FloatArray, targetRms: Float = 0.1f) {
    var sum = 0f
    for (v in x) sum += v * v
    val rms = sqrt(sum / x.size.coerceAtLeast(1))
    if (rms > 1e-6f) {
      val g = (targetRms / rms)
      for (i in x.indices) {
        var y = x[i] * g
        if (y > 1f) y = 1f else if (y < -1f) y = -1f
        x[i] = y
      }
    }
  }

  private fun sigmoid(x: Float): Float = (1f / (1f + exp(-x)))

  /**
   * 방법 A: 시암 출력(zF, zR) → margin=(zF-zR)*LOGIT_SCALE → sigmoid → 확률 pFake
   * - 최종 반환: (pFake, 1 - pFake)  ⇒ JS에서 확률로 바로 해석 가능
   */
  private fun infer(pcm: FloatArray): Pair<Float, Float> {
    // 1) 임베딩
    val t = Tensor.fromBlob(pcm, longArrayOf(1, 1, pcm.size.toLong()))
    val emb = encoder.forward(IValue.from(t)).toTensor().dataAsFloatArray

    // 2) 시암 비교
    val shape = longArrayOf(1, 256)
    val a = Tensor.fromBlob(emb, shape)
    val f = Tensor.fromBlob(refFake, shape)
    val r = Tensor.fromBlob(refReal, shape)
    val out = siam.forward(IValue.from(a), IValue.from(f), IValue.from(r))

    return if (out.isTuple) {
      var zF = out.toTuple()[0].toTensor().dataAsFloatArray[0]
      var zR = out.toTuple()[1].toTensor().dataAsFloatArray[0]

      if (SIAMESE_RETURNS_REAL_THEN_FAKE) {
        val tmp = zF; zF = zR; zR = tmp
      }

      val margin = (zF - zR) * LOGIT_SCALE
      val pFake = sigmoid(margin)
      val pReal = 1f - pFake
      pFake to pReal
    } else {
      // 단일 스칼라면 이미 0~1 확률이라고 가정
      val s = out.toTensor().dataAsFloatArray[0]
      s to (1f - s)
    }
  }
}
