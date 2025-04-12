package com.deepfake_detection_service_application.Call;  

import android.app.Service;  
import android.content.Intent;  
import android.os.Bundle;  
import android.util.Log;  

import com.facebook.react.HeadlessJsTaskService;  
import com.facebook.react.bridge.Arguments;  
import com.facebook.react.jstasks.HeadlessJsTaskConfig;  
import com.facebook.react.jstasks.LinearCountingRetryPolicy;  

public class CallBackgroundMessaging extends HeadlessJsTaskService {  

    @Override  
    public HeadlessJsTaskConfig getTaskConfig(Intent intent) {  
        Bundle extras = intent.getExtras();  
        String phoneNumber = extras != null ? extras.getString("phoneNumber") : null;  

        Log.d("CallBackgroundMessaging", "Handling phone number: " + phoneNumber);  

        LinearCountingRetryPolicy retryPolicy = new LinearCountingRetryPolicy(  
            5,   // Max number of retry attempts  
            500  // Delay between each retry attempt  
        );  

        return new HeadlessJsTaskConfig(  
            "CallBackgroundMessaging",  
            Arguments.fromBundle(extras),  
            60000,  
            false,  
            retryPolicy  
        );  
    }  

    // Uncomment if needed  
    // @Override  
    // public int onStartCommand(Intent intent, int flags, int startId) {  
    //     String phoneNumber = intent.getStringExtra("phoneNumber");  
    //     if (phoneNumber == null) {  
    //         return START_NOT_STICKY;  
    //     }  
    //  
    //     // Start the overlay activity  
    //     Intent overlayIntent = new Intent(this, CallOverlayActivity.class);  
    //     overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);  
    //     overlayIntent.putExtra("phoneNumber", phoneNumber);  
    //     startActivity(overlayIntent);  
    //  
    //     return START_NOT_STICKY;  
    // }  

    // @Override  
    // public IBinder onBind(Intent intent) {  
    //     return null;  
    // }  
}