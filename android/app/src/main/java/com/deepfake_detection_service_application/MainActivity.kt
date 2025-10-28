// android/app/src/main/java/com/deepfake_detection_service_application/MainActivity.kt
package com.deepfake_detection_service_application

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "deepfake_detection_service_application"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)

    // ✅ Android 10+(API 29+)에서 재생 오디오 캡처 허용 정책을 명시적으로 열어줌
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      try {
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        am.setAllowedCapturePolicy(AudioAttributes.ALLOW_CAPTURE_BY_ALL)
        Log.i("MainActivity", "Allowed capture policy set to ALLOW_CAPTURE_BY_ALL")
      } catch (t: Throwable) {
        Log.w("MainActivity", "Failed to set allowed capture policy", t)
      }
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
