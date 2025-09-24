package com.deepvoice

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi

class PlaybackCaptureActivity : Activity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // Android 10 미만은 지원 안 함
      finish()
      return
    }

    val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    @Suppress("DEPRECATION")
    startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CODE)
  }

  @Deprecated("Activity Result API로 대체 가능하지만 호환을 위해 유지")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == REQ_CODE) {
      if (resultCode == RESULT_OK && data != null) {
        // DeepfakeDetectorModule에게 전달
        DeepfakeDetectorModule.onProjectionResult(data)
      }
      finish()
    }
  }

  companion object {
    private const val REQ_CODE = 7601
  }
}
