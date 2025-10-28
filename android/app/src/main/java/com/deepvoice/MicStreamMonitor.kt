package com.deepvoice

import android.media.*
import android.os.Process
import android.util.Log
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.Tensor
import kotlin.concurrent.thread
import kotlin.math.max
import kotlin.math.min

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
  @Volatile private var running = false
  private var worker: Thread? = null
  private var rec: AudioRecord? = null

  fun start() {
    if (running) return
    running = true
    worker = thread(name = "DeepfakeMicMon") { runLoop() }
  }

  fun stop() {
    running = false
    try { worker?.join(500) } catch (_: Throwable) {}
    try { rec?.stop() } catch (_: Throwable) {}
    try { rec?.release() } catch (_: Throwable) {}
    rec = null
  }

  private fun runLoop() {
    try { Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO) } catch (_: Throwable) {}

    val winSamp = (windowMs * sampleRate) / 1000

    // VOICE_COMMUNICATION 경로를 우선 사용(에코 억제/AGC가 켜진 단말에 유리)
    val minBuf = AudioRecord.getMinBufferSize(
      sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
    )
    val buf = max(minBuf, sampleRate)

    rec = AudioRecord(
      MediaRecorder.AudioSource.VOICE_COMMUNICATION,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      buf
    )

    try {
      rec?.startRecording()
    } catch (t: Throwable) {
      Log.e("Deepfake", "Mic startRecording failed: ${t.message}")
      return
    }

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
        if (now - lastInfer >= hopMs && wPos >= winSamp) {
          val start = (wPos - winSamp).coerceAtLeast(0)
          val win = FloatArray(winSamp)
          var i = 0
          while (i < winSamp) { win[i] = ring[(start + i) % ring.size]; i++ }
          val (pF, pR) = infer(win)
          onResult(RealtimeResult(pF, pR, windowMs / 1000f, hopMs / 1000f))
          lastInfer = now
        }
      }
    } finally {
      try { rec?.stop() } catch (_: Throwable) {}
      try { rec?.release() } catch (_: Throwable) {}
      rec = null
    }
  }

  private fun infer(pcm: FloatArray): Pair<Float, Float> {
    val t = Tensor.fromBlob(pcm, longArrayOf(1, 1, pcm.size.toLong()))
    val emb = encoder.forward(IValue.from(t)).toTensor().dataAsFloatArray
    val shape = longArrayOf(1, 256)
    val a = Tensor.fromBlob(emb, shape)
    val f = Tensor.fromBlob(refFake, shape)
    val r = Tensor.fromBlob(refReal, shape)
    val out = siam.forward(IValue.from(a), IValue.from(f), IValue.from(r))
    return if (out.isTuple) {
      val tup = out.toTuple()
      tup[0].toTensor().dataAsFloatArray[0] to tup[1].toTensor().dataAsFloatArray[0]
    } else {
      val s = out.toTensor().dataAsFloatArray[0]
      s to (1f - s)
    }
  }
}
