package com.deepfake_detection_service_application.Call;  

import android.content.BroadcastReceiver;  
import android.content.Context;  
import android.content.Intent;  
import android.telephony.TelephonyManager;  
import android.util.Log;  
import android.os.Build;  
import android.telecom.TelecomManager;  
import com.facebook.react.modules.core.DeviceEventManagerModule;  
import com.facebook.react.bridge.ReactContext;  

public class CallReceiver extends BroadcastReceiver {  
    @Override  
    public void onReceive(Context context, Intent intent) {  
        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);  
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {  
            String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);  
            Log.d("CallReceiver", "Incoming call from: " + incomingNumber);  
            sendToReactNative(incomingNumber, context);  
        }  
    }  

    private void sendToReactNative(String phoneNumber, Context context) {  
        if (context instanceof ReactContext) {  
            ReactContext reactContext = (ReactContext) context;  
            if (reactContext.hasActiveCatalystInstance()) {  
                reactContext  
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)  
                        .emit("CallScreeningEvent", phoneNumber);  
            }  
        }  
    }  

    public void answerPhoneCall(Context context) {  
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {  
            TelecomManager telecomManager = (TelecomManager) context.getSystemService(Context.TELECOM_SERVICE);  
            if (telecomManager != null) {  
                try {  
                    telecomManager.acceptRingingCall();  // API 28 이상에서 사용  (Android 9.0)  
                } catch (Exception e) {  
                    Log.e("CallReceiver", "Error accepting call: " + e.getMessage());  
                }  
            }  
        } else {  
            Log.d("CallReceiver", "Cannot accept call on this Android version.");  
        }  
    }  
}  