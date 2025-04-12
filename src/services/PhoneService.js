import { PermissionsAndroid, Platform } from "react-native";  

export const checkPermissions = async (CallScreeningModule) => {  
    if (Platform.OS === 'android') {  
        try {  
            await CallScreeningModule.requestDefaultDialerRole();  
            await CallScreeningModule.requestCallScreeningRole();  

            const permissions = [  
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,  
                PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,  
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,  
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,  
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,  // 파일 읽기 권한 추가  
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE  // 파일 쓰기
            ];  

            const permissionsStatus = await Promise.all(  
                permissions.map(async (permission) => { // 비동기화  
                    console.log(`Requesting permission: ${permission}`);  
                    return await PermissionsAndroid.request(permission, {  
                        title: 'Permission Required',  
                        message: `We need ${permission} permission to proceed.`,  
                        buttonNeutral: 'Ask Me Later',  
                        buttonNegative: 'Cancel',  
                        buttonPositive: 'OK',  
                    });  
                })  
            );  

            permissionsStatus.forEach((status, index) => {  
                if (status === PermissionsAndroid.RESULTS.GRANTED) {  
                    console.log(`${permissions[index]} granted`);  
                } else {  
                    console.warn(`${permissions[index]} denied`);  
                }  
            });  

        } catch (error) {  
            console.error('Permission request failed', error);  
        }  
    }  
}