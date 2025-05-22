import { PermissionsAndroid, Platform } from "react-native";  

export const checkPermissions = async () => {  
    if (Platform.OS === 'android') {  
        try {  
            // 기본 다이얼러 역할 요청  
            //await CallScreeningModule.requestDefaultDialerRole();  
            // 통화 차단 역할 요청  
            //await CallScreeningModule.requestCallScreeningRole();  

            // 요청할 권한 목록  
            const permissions = [  
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,  // 전화 기록 읽기 권한  
                PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,  // 전화 받기 권한  
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,  // 전화 상태 읽기 권한  
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,  // 전화 걸기 권한  
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,  // 외부 저장소 읽기 권한  
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,  // 외부 저장소 쓰기 권한  
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,  // 오디오 녹음 권한  
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
            ];  

            // 각 권한의 상태 확인 후 요청  
            for (const permission of permissions) {  
                const granted = await PermissionsAndroid.check(permission);  // 권한 상태 확인  
                if (!granted) {  // 권한이 허용되지 않은 경우  
                    console.log(`권한 요청 중: ${permission}`);  
                    const status = await PermissionsAndroid.request(permission, {  
                        title: '권한 필요',  
                        message: `${permission} 권한이 필요합니다.`,  
                        buttonNeutral: '나중에 물어보기',  
                        buttonNegative: '취소',  
                        buttonPositive: '허용',  
                    });  
                    if (status === PermissionsAndroid.RESULTS.GRANTED) {  // 권한이 허용된 경우  
                        console.log(`${permission} 권한이 허용되었습니다.`);  
                    } else {  // 권한이 거부된 경우  
                        console.warn(`${permission} 권한이 거부되었습니다.`);  
                    }  
                } else {  // 권한이 이미 허용된 경우  
                    console.log(`${permission} 권한이 이미 허용되었습니다.`);  
                }  
            }  

        } catch (error) {  
            console.error('권한 요청 중 오류 발생', error);  
        }  
    }  
}  