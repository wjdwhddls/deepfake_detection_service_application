package com.deepfake_detection_service_application

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.oney.WebRTCModule.WebRTCModulePackage
import com.deepvoice.DeepfakeDetectorPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages.toMutableList()
        packages.add(WebRTCModulePackage()) // WebRTC 모듈 수동 등록
        packages.add(DeepfakeDetectorPackage())
        return packages
      }

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }

    // ✅ 포그라운드 서비스용 알림 채널 생성 (PlaybackCaptureService에서 사용)
    createNotificationChannels()
  }

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val mgr = getSystemService(NotificationManager::class.java)

      // 캡처/분석 진행 중 알림
      val capture = NotificationChannel(
        "playback_capture",
        "Playback Capture",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Capturing call/media audio for deepfake analysis"
        setShowBadge(false)
      }

      // 탐지 경고 알림 (원하면 별도 채널)
      val alerts = NotificationChannel(
        "deepfake_alerts",
        "Deepfake Alerts",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Realtime deepfake detection alerts"
      }

      mgr?.createNotificationChannel(capture)
      mgr?.createNotificationChannel(alerts)
    }
  }
}
