package com.deepvoice

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi

class PlaybackCaptureActivity : Activity() {

  @RequiresApi(Build.VERSION_CODES.Q)
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val mpm = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    // 시스템 권한 다이얼로그 표시
    startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CODE)
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == REQ_CODE) {
      if (resultCode == RESULT_OK && data != null) {
        // DeepfakeDetectorModule에게 넘기기
        DeepfakeDetectorModule.onProjectionResult(data)
      }
      finish()
    }
  }

  companion object {
    private const val REQ_CODE = 7601
  }
}
