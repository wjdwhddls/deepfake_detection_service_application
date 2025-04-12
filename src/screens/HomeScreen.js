// ./src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';

const HomeScreen = ({ theme }) => { // theme prop 추가
  const [showUploadButton, setShowUploadButton] = useState(false);

  const handleDetect = () => {
    setShowUploadButton((prev) => !prev);
    console.log('Detect Pressed');
  };

  const handleUpload = async () => {
    try {
      let permissionGranted = false;

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

      const [pickResult] = await pick({ mode: 'import' });
      if (!pickResult) {
        console.log('파일 선택이 취소되었습니다.');
        return;
      }
      console.log('Selected file info:', pickResult);

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
        console.error('Error response data:', error.response.data);
        Alert.alert('오류', `서버 응답: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('Request made but no response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      Alert.alert('오류', '파일 선택 또는 업로드 중 오류가 발생했습니다.');
    }
  };

  // 테마에 따른 스타일 동적 적용
  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity style={dynamicStyles.detectButton} onPress={handleDetect}>
        <Text style={dynamicStyles.detectButtonText}>DETECT</Text>
      </TouchableOpacity>
      {showUploadButton && (
        <TouchableOpacity style={dynamicStyles.uploadButton} onPress={handleUpload}>
          <Text style={dynamicStyles.uploadButtonText}>UPLOAD FILE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 테마에 따른 스타일 정의
const getDynamicStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#000' : '#FFF',
    },
    uploadButton: {
      marginTop: 20,
      padding: 10,
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFF',
      borderRadius: 5,
      borderWidth: theme === 'dark' ? 0 : 1,
      borderColor: theme === 'dark' ? 'transparent' : '#000',
    },
    uploadButtonText: {
      color: theme === 'dark' ? '#FFF' : '#000',
      fontWeight: 'bold',
    },
    detectButton: {
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFF',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 30,
      marginBottom: 20,
      borderWidth: theme === 'dark' ? 0 : 1,
      borderColor: theme === 'dark' ? 'transparent' : '#000',
    },
    detectButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#FFF' : '#000',
    },
  });
};

export default HomeScreen;