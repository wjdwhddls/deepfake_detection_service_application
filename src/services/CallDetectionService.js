// // src/services/CallDetectionService.js  
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';  
// import CallDetectorManager from 'react-native-call-detection';  
// import AudioRecordingService from './AudioRecordingService';  
// import { Platform } from 'react-native';  

// class CallDetectionService {  
//     constructor() {  
//         this.callDetector = null;  
//     }  

//     async requestPermissions() {  
//         try {  
//             let permissionGranted = false;  

//             // Android 권한 요청  
//             if (Platform.OS === 'android') {  
//                 const result = await request(PERMISSIONS.ANDROID.READ_PHONE_STATE);  
//                 if (result === RESULTS.GRANTED) {  
//                     permissionGranted = true;  
//                 } else {  
//                     console.log('READ_PHONE_STATE 권한이 필요합니다.');  
//                 }  
//             } else {  
//                 permissionGranted = true; // iOS에서는 기본적으로 권한이 없음  
//             }  

//             return permissionGranted;  
//         } catch (error) {  
//             console.error('권한 요청 오류:', error);  
//             return false; // 기본적으로 권한 부여 안됨  
//         }  
//     }  

//     async startListening() {  
//         const permissionGranted = await this.requestPermissions();  
        
//         if (!permissionGranted) {  
//             console.log('통화 감지를 시작할 수 없습니다. 권한이 필요합니다.');  
//             return;  
//         }  

//         this.callDetector = new CallDetectorManager(  
//             (event) => {  
//                 if (event === 'Connected') {  
//                     // 통화가 시작되면 녹음 시작  
//                     AudioRecordingService.startRecording();  
//                 } else if (event === 'Disconnected') {  
//                     // 통화가 끝나면 녹음 종료  
//                     AudioRecordingService.stopRecording();  
//                 }  
//             },  
//             true, // 감지할 번호 모드  
//             (error) => {  
//                 console.log(`Error: ${error}`);  
//             }  
//         );  
//     }  

//     stopListening() {  
//         if (this.callDetector) {  
//             this.callDetector.dispose();  
//         }  
//     }  
// }  

// export default new CallDetectionService();  