package com.deepfake_detection_service_application.Call;  

import android.app.Notification;  
import android.app.NotificationChannel;  
import android.app.NotificationManager;  
import android.content.Context;  
import android.os.Build;  

public class NotificationHelper {  
    private static final String CHANNEL_ID = "call_detection_channel";  

    public static void createNotificationChannel(Context context) {  
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {  
            NotificationChannel channel = new NotificationChannel(  
                    CHANNEL_ID,  
                    "Call Detection Notifications",  
                    NotificationManager.IMPORTANCE_HIGH  
            );  
            NotificationManager manager = context.getSystemService(NotificationManager.class);  
            if (manager != null) {  
                manager.createNotificationChannel(channel);  
            }  
        }  
    }  

    public static void showNotification(Context context, String message) {  
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);  

        Notification notification = new Notification.Builder(context, CHANNEL_ID) // C  
                .setContentTitle("전화 감지됨")  
                .setContentText(message)  
                .setSmallIcon(android.R.drawable.ic_dialog_info)  
                .setAutoCancel(true)  
                .build();  

        if (notificationManager != null) {  
            notificationManager.notify(1, notification); // 고유 아이디로 알림 생성  
        }  
    }  
}