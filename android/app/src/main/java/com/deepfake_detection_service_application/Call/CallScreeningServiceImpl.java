package com.deepfake_detection_service_application.Call;  

import android.app.ActivityManager;  
import android.content.Context;  
import android.content.Intent;  
import android.telecom.Call;  
import android.telecom.CallScreeningService;  
import android.util.Log;  

import com.facebook.react.modules.core.DeviceEventManagerModule;  
import com.facebook.react.bridge.ReactApplicationContext;  

public class CallScreeningServiceImpl extends CallScreeningService {  

    private static final String TAG = "CallScreeningServiceImpl";  

    // Send a message to React Native  
    private void sendToReactNative(String message) {  
        ReactApplicationContext reactContext = CallScreeningModule.getReactContext(); // 수정   
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {  
            reactContext  
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)  
                .emit("CallScreeningEvent", message);  
        }  
    }  

    @Override  
    public void onScreenCall(Call.Details callDetails) {  
        String phoneNumber = callDetails.getHandle().getSchemeSpecificPart();  
        Log.d(TAG, "Incoming call from: " + phoneNumber);  

        // Send message to React Native  
        sendToReactNative("Incoming call from: " + phoneNumber);  
        if (isAppInBackground()) {  
            triggerHeadlessJs(phoneNumber);  
        }  
        
        CallResponse response = new CallResponse.Builder()  
            .setDisallowCall(false)  
            .setRejectCall(false)  
            .setSilenceCall(false)  
            .setSkipCallLog(false)  
            .setSkipNotification(false)  
            .build();  

        respondToCall(callDetails, response);  
    }  

    // Trigger the Headless JS service  
    private void triggerHeadlessJs(String phoneNumber) {  
        Intent intent = new Intent(this, CallBackgroundMessaging.class);  
        intent.putExtra("phoneNumber", phoneNumber);  
        startService(intent);  
    }  

    // Check if the app is in the background  
    private boolean isAppInBackground() {  
        ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);  
        if (activityManager == null) return true;  

        for (ActivityManager.RunningAppProcessInfo appProcess : activityManager.getRunningAppProcesses()) {  
            if (appProcess.processName.equals(getPackageName())) {  
                return appProcess.importance != ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;  
            }  
        }  
        return true;  
    }  
}