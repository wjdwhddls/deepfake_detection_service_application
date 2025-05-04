package com.deepfake_detection_service_application.Call;  

import android.annotation.SuppressLint;  
import android.app.Activity;  
import android.graphics.PixelFormat;  
import android.os.Build;  
import android.os.Bundle;  
import android.view.WindowManager;  
import android.widget.Button;  
import android.widget.TextView;  

import androidx.annotation.RequiresApi;  

import com.deepfake_detection_service_application.R;  

public class CallOverlayActivity extends Activity {  
    
    @SuppressLint("SetTextI18n")  
    @RequiresApi(Build.VERSION_CODES.O)  
    @Override  
    protected void onCreate(Bundle savedInstanceState) {  
        super.onCreate(savedInstanceState);  
        setContentView(R.layout.activity_call_overlay);  

        // Set layout parameters to make the activity overlay on top of other apps  
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(  
            WindowManager.LayoutParams.MATCH_PARENT,  
            WindowManager.LayoutParams.WRAP_CONTENT,  
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,  
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |   
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |   
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,  
            PixelFormat.TRANSLUCENT  
        );  
        
        getWindow().setAttributes(params);  

        String phoneNumber = getIntent().getStringExtra("phoneNumber");  
        if (phoneNumber == null) {  
            phoneNumber = "Unknown";  
        }  

        TextView textView = findViewById(R.id.textView);  
        textView.setText("Incoming call from " + phoneNumber);  

        Button closeButton = findViewById(R.id.closeButton);  
        closeButton.setOnClickListener(view -> finish());  // Close the overlay activity  
    }  
}