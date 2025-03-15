import React, { useState } from 'react';  
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';  
import { pick } from '@react-native-documents/picker';  
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';  
import Header from '../components/Header';  
import WaveAnimation from '../components/WaveAnimation';  
import Button from '../components/Button';  

const LandingPage = () => {  
  const [showUploadButton, setShowUploadButton] = useState(false);  

  const handleDetect = () => {  
    setShowUploadButton((prev) => !prev);  
    console.log('Detect Pressed');  
  };  

  const handleUpload = async () => {  
    try {  
      let permissionGranted = false;  

      // 안드로이드 권한 요청  
      if (Platform.OS === 'android') {  
        if (Platform.Version >= 33) {  
          // 안드로이드 13+ (예: READ_MEDIA_AUDIO 권한)  
          const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);  
          if (result === RESULTS.GRANTED) {  
            permissionGranted = true;  
          }  
        } else {  
          // 안드로이드 12 이하 (READ_EXTERNAL_STORAGE 권한)  
          const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);  
          if (result === RESULTS.GRANTED) {  
            permissionGranted = true;  
          }  
        }  
      } else {  
        // iOS/기타 플랫폼은 별도 권한 요청이 필요 없거나 다르게 처리  
        permissionGranted = true;  
      }  

      if (!permissionGranted) {  
        console.log('파일 읽기 권한이 없습니다.');  
        return;  
      }  

      // 권한 허용 후, 파일 선택 (mode: 'import'는 가져오기 모드)  
      const [pickResult] = await pick({ mode: 'import' });  
      console.log('Selected file info:', pickResult);  

      // 이후 pickResult를 가지고 서버 업로드 로직 등 추가 처리  
    } catch (error) {  
      // 사용자가 취소했거나, 그 외 에러 발생  
      console.error('File picking error:', error);  
      Alert.alert('오류', '파일 선택 중 오류가 발생했습니다.');  
    }  
  };  

  return (  
    <View style={styles.container}>  
      <Header />  
      <WaveAnimation />  
      <Button title="DETECT" onPress={handleDetect} />  
      {showUploadButton && (  
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>  
          <Text style={styles.uploadButtonText}>UPLOAD FILE</Text>  
        </TouchableOpacity>  
      )}  
    </View>  
  );  
};  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#000',  
    alignItems: 'center',  
    justifyContent: 'center',  
  },  
  uploadButton: {  
    marginTop: 20,  
    padding: 10,  
    backgroundColor: '#fff',  
    borderRadius: 5,  
  },  
  uploadButtonText: {  
    color: '#000',  
    fontWeight: 'bold',  
  },  
});  

export default LandingPage;  