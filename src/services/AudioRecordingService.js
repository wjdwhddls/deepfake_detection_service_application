import { AudioRecorder, AudioUtils } from 'react-native-audio';  

class AudioRecordingService {  
    async startRecording() {  
        const audioPath = `${AudioUtils.DocumentDirectoryPath}/recording.m4a`; // 파일 확장자를 .m4a로 변경  
        await AudioRecorder.prepareRecordingAtPath(audioPath, {  
            SampleRate: 44100, // Sample rate를 일반적인 44100으로 변경  
            Channels: 1,  
            AudioQuality: 'High',  
            AudioEncoding: 'm4a', // 인코딩 형식을 m4a로 변경  
        });  
        await AudioRecorder.startRecording();  
        console.log('Recording started...');  
    }  

    async stopRecording() {  
        await AudioRecorder.stopRecording();  
        console.log('Recording stopped...');  
        // 여기서 추가로 파일 저장 또는 업로드 작업 가능  
    }  
}  

export default new AudioRecordingService();  