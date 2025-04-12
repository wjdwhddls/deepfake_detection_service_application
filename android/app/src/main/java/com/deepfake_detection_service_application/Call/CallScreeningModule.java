package com.deepfake_detection_service_application.Call;  

import android.app.Activity;  
import android.app.role.RoleManager;  
import android.content.Intent;  
import android.content.Context;  
import android.os.Build;  
import android.telecom.TelecomManager;  
import android.telephony.PhoneStateListener;  
import android.telephony.TelephonyManager;  
import com.facebook.react.bridge.LifecycleEventListener;  
import com.facebook.react.bridge.Promise;  
import com.facebook.react.bridge.ReactApplicationContext;  
import com.facebook.react.bridge.ReactContextBaseJavaModule;  
import com.facebook.react.bridge.ReactMethod;  
import com.facebook.react.modules.core.DeviceEventManagerModule;  
import android.util.Log;  
import android.provider.CallLog;  
import com.facebook.react.bridge.Arguments;  
import android.database.Cursor;  

public class CallScreeningModule extends ReactContextBaseJavaModule implements LifecycleEventListener {  

    private static ReactApplicationContext reactContext;  
    private PhoneStateListener phoneStateListener;  

    public CallScreeningModule(ReactApplicationContext reactContext) {  
        super(reactContext);  
        CallScreeningModule.reactContext = reactContext;  
        reactContext.addLifecycleEventListener(this);  
    }  

    // ReactApplicationContext를 반환하는 메서드 추가  
    public static ReactApplicationContext getReactContext() {  
        return reactContext;  
    }  

    public static final String NAME = "CallScreeningModule";  

    @Override  
    public String getName() {  
        return NAME;  
    }  

    @ReactMethod  
    public void showModal(String message) {  
        Log.d("CallScreeningModule", "showModal called with message: " + message);  
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {  
            reactContext  
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)  
                .emit("CallScreeningEvent", message);  
        }  
    }  

    @ReactMethod  
    public void requestCallScreeningRole(Promise promise) {  
        // 현재 API 레벨이 Q 이상인지 확인  
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {  
            Activity activity = getCurrentActivity();  
            if (activity != null) {  
                RoleManager roleManager = activity.getSystemService(RoleManager.class);  
                if (roleManager != null) {  
                    Intent intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING);  
                    activity.startActivityForResult(intent, 1);  
                    promise.resolve(true);  
                } else {  
                    promise.reject("RoleManagerError", "RoleManager is not available");  
                }  
            } else {  
                promise.reject("ActivityError", "Activity is null");  
            }  
        } else {  
            // Android Q 이하에서는 해당 역할 요청을 하지 않음  
            Log.d("CallScreeningModule", "RoleManager not required for Android versions below Q");  
            promise.resolve(false); // Q 이하에서 성공적으로 호출되었음을 알림  
        }  
    }   

    @ReactMethod  
    public void requestDefaultDialerRole(Promise promise) {  
        Activity activity = getCurrentActivity();  
        if (activity != null) {  
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {  
                Intent intent = new Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER);  
                intent.putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, activity.getPackageName());  
                activity.startActivityForResult(intent, 1);  
                promise.resolve(true);  
            } else {  
                promise.reject("DialerRoleError", "Default Dialer role requires Android M or higher");  
            }  
        } else {  
            promise.reject("ActivityError", "Activity is null");  
        }  
    }  

    @ReactMethod  
    public void getRecentLogs(Promise promise) {  
        try {  
            String[] projection = new String[]{  
                CallLog.Calls._ID,  
                CallLog.Calls.NUMBER,  
                CallLog.Calls.TYPE,  
                CallLog.Calls.DURATION,  
                CallLog.Calls.DATE,  
                CallLog.Calls.COUNTRY_ISO  
            };  
            String sortOrder = CallLog.Calls.DATE + " DESC";  
            Cursor cursor = reactContext.getContentResolver().query(  
                CallLog.Calls.CONTENT_URI,  
                projection,  
                null,  
                null,  
                sortOrder  
            );  

            if (cursor != null && cursor.moveToFirst()) {  
                var result = Arguments.createArray();  
                int numberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER);  
                int typeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE);  
                int dateIndex = cursor.getColumnIndex(CallLog.Calls.DATE);  
                int durationIndex = cursor.getColumnIndex(CallLog.Calls.DURATION);  
                int countryIsoIndex = cursor.getColumnIndex(CallLog.Calls.COUNTRY_ISO);  

                int count = 0;  
                do {  
                    if (count >= 5) break;  
                    var callLog = Arguments.createMap();  
                    callLog.putString("number", cursor.getString(numberIndex));  
                    callLog.putInt("type", cursor.getInt(typeIndex));  
                    callLog.putDouble("date", cursor.getLong(dateIndex));  
                    callLog.putInt("duration", cursor.getInt(durationIndex));  
                    callLog.putString("countryIso", cursor.getString(countryIsoIndex));  
                    result.pushMap(callLog);  
                    count++;  
                } while (cursor.moveToNext());  

                cursor.close();  
                promise.resolve(result);  
            } else {  
                promise.reject("Error", "No call logs found");  
            }  
        } catch (Exception e) {  
            promise.reject("Exception", e.getMessage());  
        }  
    }  

    @Override  
    public void onHostResume() {  
        // 알림 채널 생성  
        NotificationHelper.createNotificationChannel(reactContext);  

        TelephonyManager telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);  
        
        phoneStateListener = new PhoneStateListener() {  
            @Override  
            public void onCallStateChanged(int state, String phoneNumber) {  
                switch (state) {  
                    case TelephonyManager.CALL_STATE_RINGING:  
                        String incomingNumber = getLastIncomingCall();  
                        Log.d("CallScreeningModule", "Incoming number: " + incomingNumber);  
                        showModal(incomingNumber);  // Q 이전의 경우에도 사용 가능  
                        // 알림 생성  
                        NotificationHelper.showNotification(reactContext, "전화가 감지되었습니다: " + incomingNumber);  
                        break;  
                    case TelephonyManager.CALL_STATE_IDLE:  
                        // 호출이 종료된 경우  
                        break;  
                    case TelephonyManager.CALL_STATE_OFFHOOK:  
                        // 통화 중인 경우  
                        break;  
                }  
            }  
        };  
        
        telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);  
    }  

    @Override  
    public void onHostPause() {  
        if (phoneStateListener != null) {  
            TelephonyManager telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);  
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);  
        }  
    }  

    @Override  
    public void onHostDestroy() {  
        onHostPause(); // Clean up listener  
    }  

    // 최근 전화번호를 가져오는 메서드  
    private String getLastIncomingCall() {  
        String lastIncomingCall = "";  
        Cursor cursor = null;  
        try {  
            String[] projection = new String[]{CallLog.Calls.NUMBER};  
            cursor = reactContext.getContentResolver().query(  
                CallLog.Calls.CONTENT_URI,  
                projection,  
                CallLog.Calls.TYPE + "=?",  
                new String[]{String.valueOf(CallLog.Calls.INCOMING_TYPE)},  
                CallLog.Calls.DATE + " DESC"  
            );  

            if (cursor != null && cursor.moveToFirst()) {  
                lastIncomingCall = cursor.getString(cursor.getColumnIndex(CallLog.Calls.NUMBER));  
            }  
        } catch (Exception e) {  
            Log.e("CallScreeningModule", "Error fetching last incoming call: " + e.getMessage());  
        } finally {  
            if (cursor != null) {  
                cursor.close();  
            }  
        }  

        return lastIncomingCall;  
    }  
}