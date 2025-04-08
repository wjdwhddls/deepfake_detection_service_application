// ./src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axios from 'axios';
import Animated, { Easing } from 'react-native-reanimated';

const HomeScreen = ({ theme }) => {
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const animationValue = new Animated.Value(0); // 수정된 부분

  useEffect(() => {
    const animate = () => {
      animationValue.setValue(0);
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(animate);
    };
    animate();
  }, [animationValue]);

  const handleDetect = () => {
    setShowUploadButton((prev) => !prev);
  };

  const handleUpload = async () => {
    try {
      setIsLoading(true);
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
        Alert.alert('권한 오류', '파일 읽기 권한이 없습니다.');
        return;
      }

      const [pickResult] = await pick({ mode: 'import' });
      if (!pickResult) {
        Alert.alert('파일 선택 오류', '파일 선택이 취소되었습니다.');
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: pickResult.uri,
        name: pickResult.name || 'uploaded_file',
        type: pickResult.mimeType || 'application/octet-stream',
      });

      const response = await axios.post('http://10.0.2.2:3000/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const jsonResponse = response.data;
      Alert.alert('결과', `서버 응답: ${JSON.stringify(jsonResponse.result)}`);
    } catch (error) {
      console.error('파일 선택 또는 업로드 오류:', error);
      Alert.alert('오류', '파일 선택 또는 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={dynamicStyles.container}>
      <Animated.View style={[dynamicStyles.waveContainer, {
        transform: [{
          translateY: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 30],
          }),
        }],
      }]}>
        <View style={dynamicStyles.wave}>
          <View style={[dynamicStyles.waveLine, { backgroundColor: '#FF3D3D' }]} />
          <View style={[dynamicStyles.waveLine, { backgroundColor: '#FFD700' }]} />
          <View style={[dynamicStyles.waveLine, { backgroundColor: '#1E90FF' }]} />
          <View style={[dynamicStyles.waveLine, { backgroundColor: '#3CB371' }]} />
          <View style={[dynamicStyles.waveLine, { backgroundColor: '#9370DB' }]} />
        </View>
      </Animated.View>

      <TouchableOpacity style={dynamicStyles.detectButton} onPress={handleDetect}>
        <Text style={dynamicStyles.detectButtonText}>DETECT</Text>
      </TouchableOpacity>
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
    waveContainer: {
      position: 'absolute',
      top: '30%',
      width: '100%',
      alignItems: 'center',
    },
    wave: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      height: 60,
      overflow: 'hidden',
    },
    waveLine: {
      width: 10,
      height: '100%',
      borderRadius: 5,
    },
    detectButton: {
      marginTop: 30,
      padding: 20,
      backgroundColor: theme === 'dark' ? '#6200EA' : '#007BFF',
      borderRadius: 10,
    },
    detectButtonText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 20,
    },
  });
};

export default HomeScreen;
