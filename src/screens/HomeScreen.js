import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // React Navigation 사용
import { pick } from '@react-native-documents/picker'; // 파일 선택을 위한 모듈
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'; // 권한 요청 모듈
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext'; // 경로 주의!


const HomeScreen = ({ socket, setRemotePeerId, userPhoneNumber }) => {
  const [resultData, setResultData] = useState(null); // 서버 결과 저장
  const [showUploadButton, setShowUploadButton] = useState(false); // Upload 버튼 표시 여부
  const [loading, setLoading] = useState(false); // 로딩 중인 상태 관리
  const [phoneNumber, setPhoneNumber] = useState(''); // 전화번호 입력
  const { isLightMode } = useTheme();
  const navigation = useNavigation(); // 네비게이터 훅
  console.log('[HomeScreen] userPhoneNumber:', userPhoneNumber);

  const handleDetect = () => {
    setShowUploadButton(!showUploadButton); // Detect 버튼 눌렀을 때 Upload 버튼 토글
    console.log('Detect Button Pressed');
  };

  const handleUpload = async () => {
    try {
      setLoading(true); // 업로드 중 상태 활성화
      setResultData(null); // 이전 결과 초기화

      // --- 권한 요청 ---
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
        permissionGranted = true; // iOS는 권한 요청 필요 없음
      }

      if (!permissionGranted) {
        Alert.alert('권한 부족', '파일 접근 권한이 필요합니다.');
        return;
      }

      // --- 파일 선택 ---
      const [pickResult] = await pick({ mode: 'import' }); // 파일 선택
      if (!pickResult) {
        console.log('파일 선택 취소');
        return;
      }

      console.log('선택된 파일 정보:', pickResult);

      // --- 서버로 파일 업로드 ---
      const formData = new FormData();
      formData.append('file', {
        uri: pickResult.uri,
        name: pickResult.name || 'uploaded_file',
        type: pickResult.mimeType || 'application/octet-stream',
      });

      console.log('FormData 전송 준비 완료');

      const serverUrl =
        Platform.OS === 'android'
          ? 'http://10.0.2.2:3000/files/upload'
          : 'http://127.0.0.1:3000/files/upload';

      const response = await axios.post(serverUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // --- 결과 저장 ---
      const serverData = response.data;
      setResultData(serverData);
      console.log('서버 응답:', serverData);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);

      if (error.response) {
        console.error('서버 오류 응답:', error.response.data);
      } else if (error.request) {
        console.error('서버 응답 없음:', error.request);
      } else {
        console.error('요청 설정 오류:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResultData(null); // 결과 삭제
  };

  const handleDetailView = () => {
    navigation.navigate('DetectDetail', { result: resultData }); // ResultScreen으로 네비게이션, 결과 전달
  };

  const handleCall = () => {
    if (!phoneNumber) return Alert.alert('전화번호 입력!');
    if (!socket) return Alert.alert('소켓 연결 필요!');
    if (!userPhoneNumber) return Alert.alert('내 전화번호 정보 필요!');
    socket.emit('call', { to: phoneNumber.trim(), from: userPhoneNumber });
    // remotePeerId 직접 세팅 X!
    Alert.alert('발신', `${phoneNumber} 번호로 VOIP 전화 요청`);
  };

  const dynamicStyles = getDynamicStyles(isLightMode); // 동적 스타일 적용

  return (
    <View style={dynamicStyles.container}>
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

      {/* 전화번호 입력란과 CALL 버튼 */}
      {showUploadButton && (
        <>
          <TextInput
            style={dynamicStyles.phoneInput}
            placeholder="전화번호 입력"
            keyboardType="numeric"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity style={dynamicStyles.callButton} onPress={handleCall}>
            <Text style={dynamicStyles.callButtonText}>CALL</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 결과 화면 */}
      {resultData && (
        <View style={dynamicStyles.resultContainer}>
          <Text style={dynamicStyles.resultTitle}>📝 예측 결과</Text>
          <Text style={dynamicStyles.resultText}>
            <Text style={dynamicStyles.resultLabel}>결과: </Text>
            {resultData.result}
          </Text>

          {/* 버튼들 */}
          <View style={dynamicStyles.buttonRow}>
            <TouchableOpacity
              style={dynamicStyles.detailButton}
              onPress={handleDetailView}
            >
              <Text style={dynamicStyles.detailButtonText}>상세보기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.confirmButton}
              onPress={handleReset}
            >
              <Text style={dynamicStyles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const getDynamicStyles = (isLightMode) =>
  StyleSheet.create({
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