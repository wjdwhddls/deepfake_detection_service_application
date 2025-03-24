import React, { useState } from 'react';  
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';  
import { pick } from '@react-native-documents/picker';  
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';  
import axios from 'axios';  
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
          const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);  
          if (result === RESULTS.GRANTED) {  
            permissionGranted = true;  
          }  
        } else {  
          const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);  
          if (result === RESULTS.GRANTED) {  
            permissionGranted = true;  
          }  
        }  
      } else {  
        permissionGranted = true;  
      }  

      if (!permissionGranted) {  
        console.log('파일 읽기 권한이 없습니다.');  
        return;  
      }  

      // 파일 선택  
      const [pickResult] = await pick({ mode: 'import' });  
      if (!pickResult) {  
        console.log('파일 선택이 취소되었습니다.');  
        return;  
      }  
      console.log('Selected file info:', pickResult);  

      // 서버에 파일 업로드하기  
      const formData = new FormData();  
      formData.append('file', {  
        uri: pickResult.uri,  
        name: pickResult.name || 'uploaded_file',  
        type: pickResult.mimeType || 'application/octet-stream',  
      });  
      console.log("Prepared FormData:", formData);  

      const response = await axios.post('http://10.0.2.2:3000/files/upload', formData, {  
        headers: {  
          'Content-Type': 'multipart/form-data',  
        },  
      });  

      const jsonResponse = response.data;  
      Alert.alert('결과', `서버 응답: ${JSON.stringify(jsonResponse.result)}`);  
        
    } catch (error) {  
      console.error('File picking or upload error:', error);  
      if (error.response) {  
        // 서버에서 응답이 있는 경우  
        console.error('Error response data:', error.response.data);  
        Alert.alert('오류', `서버 응답: ${JSON.stringify(error.response.data)}`);  
      } else if (error.request) {  
        // 서버로 요청이 이루어졌으나 응답이 없을 경우  
        console.error('Request made but no response received:', error.request);  
      } else {  
        // 요청 설정 중 발생한 오류  
        console.error('Error setting up request:', error.message);  
      }  
      Alert.alert('오류', '파일 선택 또는 업로드 중 오류가 발생했습니다.');  
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

