package com.deepfake_detection_service_application  

import android.app.Application  
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
import com.deepfake_detection_service_application.Call.CallScreeningPackage
import com.deepfake_detection_service_application.Call.CallScreeningServiceImpl

class MainApplication : Application(), ReactApplication {  

    override val reactNativeHost: ReactNativeHost =  
        object : DefaultReactNativeHost(this) {  
            override fun getPackages(): List<ReactPackage> =  
                PackageList(this).packages.apply {  
                    // 사용자 정의 패키지 추가  
                    add(CallScreeningPackage())  // CallScreeningModule의 정확한 생성자 사용  
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
            // 새로운 아키텍처를 선택한 경우 네이티브 진입점을 로드합니다.  
            load()  
        }  
    }  
}