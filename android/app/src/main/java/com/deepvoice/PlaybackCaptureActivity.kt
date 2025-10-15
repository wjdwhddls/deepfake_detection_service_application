package com.deepvoice

import android.app.Activity
import android.os.Bundle

class PlaybackCaptureActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // 필요 시 RESULT_OK/EXTRA 전달 등으로 바꿔도 됨
    setResult(RESULT_CANCELED)
    finish()
  }
}