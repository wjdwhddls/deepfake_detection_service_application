package com.deepfake_detection_service_application.Call;  

import com.facebook.react.ReactPackage;  
import com.facebook.react.bridge.NativeModule;  
import com.facebook.react.bridge.ReactApplicationContext;  
import com.facebook.react.uimanager.ViewManager;  

import java.util.ArrayList;  
import java.util.List;  

public class CallScreeningPackage implements ReactPackage {  

    @Override  
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {  
        List<NativeModule> modules = new ArrayList<>();  
        modules.add(new CallScreeningModule(reactContext));  
        return modules;  
    }  

    @Override  
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {  
        return new ArrayList<>(); // Return an empty list as no ViewManagers are defined  
    }  
}