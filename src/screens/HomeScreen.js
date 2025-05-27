import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LogoImage from '../assets/Detection.png'; // 로고 이미지 경로 추가

const HomeScreen = ({ socket, setRemotePeerId, userPhoneNumber }) => {
  const [resultData, setResultData] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { isLightMode } = useTheme();
  const navigation = useNavigation();
  console.log('[HomeScreen] userPhoneNumber:', userPhoneNumber);

  const handleDetect = () => {
    setShowUploadButton(!showUploadButton);
    console.log('Detect Button Pressed');
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setResultData(null);

      let permissionGranted = false;
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
          if (result === RESULTS.GRANTED) permissionGranted = true;
        } else {
          const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
          if (result === RESULTS.GRANTED) permissionGranted = true;
        }
      } else {
        permissionGranted = true;
      }

      if (!permissionGranted) {
        Alert.alert('권한 부족', '파일 접근 권한이 필요합니다.');
        return;
      }

      const [pickResult] = await pick({ mode: 'import' });
      if (!pickResult) {
        console.log('파일 선택 취소');
        return;
      }

      console.log('선택된 파일 정보:', pickResult);

      const formData = new FormData();
      formData.append('file', {
        uri: pickResult.uri,
        name: pickResult.name || 'uploaded_file',
        type: pickResult.mimeType || 'application/octet-stream',
      });

      const serverUrl = Platform.OS === 'android'
        ? 'http://10.0.2.2:3000/files/upload'
        : 'http://127.0.0.1:3000/files/upload';

      const response = await axios.post(serverUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverData = response.data;
      setResultData(serverData);
      console.log('서버 응답:', serverData);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
      if (error.response) console.error('서버 오류 응답:', error.response.data);
      else if (error.request) console.error('서버 응답 없음:', error.request);
      else console.error('요청 설정 오류:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResultData(null);
  };

  const handleDetailView = () => {
    navigation.navigate('DetectDetail', { result: resultData });
  };

  const dynamicStyles = getDynamicStyles(isLightMode);

  return (
    <View style={dynamicStyles.container}>
      {/* 로고 이미지 */}
      <Image
        source={LogoImage}
        style={{ width: 320, height: 320 }}
        resizeMode="contain"
      />

      {/* Detect 버튼 */}
      <TouchableOpacity style={dynamicStyles.detectButton} onPress={handleDetect}>
        <Text style={dynamicStyles.detectButtonText}>DETECT</Text>
      </TouchableOpacity>

      {/* Upload 버튼 */}
      {showUploadButton && (
        <TouchableOpacity style={dynamicStyles.uploadButton} onPress={handleUpload}>
          <Text style={dynamicStyles.uploadButtonText}>
            {loading ? '업로드 중...' : 'UPLOAD FILE'}
          </Text>
        </TouchableOpacity>
      )}

      {/* 결과 화면 */}
      {resultData && (
        <View style={dynamicStyles.resultContainer}>
          <Text style={dynamicStyles.resultTitle}>📝 예측 결과</Text>
          <Text style={dynamicStyles.resultText}>
            <Text style={dynamicStyles.resultLabel}>결과: </Text>
            {resultData.result}
          </Text>

          <View style={dynamicStyles.buttonRow}>
            <TouchableOpacity style={dynamicStyles.detailButton} onPress={handleDetailView}>
              <Text style={dynamicStyles.detailButtonText}>상세보기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.confirmButton} onPress={handleReset}>
              <Text style={dynamicStyles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const getDynamicStyles = (isLightMode) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isLightMode ? '#F8F8F8' : '#121212',
  },
  detectButton: {
    backgroundColor: isLightMode ? '#FFFFFF' : '#1E1E1E',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: isLightMode ? 1 : 0,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  detectButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isLightMode ? '#000000' : '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: isLightMode ? '#2196F3' : '#37474F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  phoneInput: {
    borderColor: isLightMode ? '#E0E0E0' : '#444',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    width: '80%',
    marginTop: 15,
    color: isLightMode ? '#000' : '#FFF',
  },
  callButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 10,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultContainer: {
    marginTop: 30,
    backgroundColor: isLightMode ? '#FAFAFA' : '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: isLightMode ? '#37474F' : '#E0E0E0',
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
    color: isLightMode ? '#424242' : '#E0E0E0',
  },
  resultLabel: {
    fontWeight: 'bold',
    color: isLightMode ? '#212121' : '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  detailButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginRight: 10,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
