import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  NativeModules,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTheme } from '../contexts/ThemeContext';
import LogoImage from '../assets/Detection.png';
import RNFS from 'react-native-fs'; // ✅ 새로 추가: 캐시로 복사해 매번 새로운 경로 사용

const HomeScreen = () => {
  const [resultData, setResultData] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLightMode } = useTheme();
  const navigation = useNavigation();

  // 네이티브 모듈
  const { DeepfakeDetector } = NativeModules;

  // ✅ 모델 초기화: 1회만, 중복 방지
  const initOnceRef = useRef(false);
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (initOnceRef.current) return; // 이미 초기화했으면 스킵
      if (!DeepfakeDetector?.initModel) {
        console.warn('DeepfakeDetector native module not found.');
        return;
      }
      try {
        await DeepfakeDetector.initModel();
        if (mounted) initOnceRef.current = true;
      } catch (e) {
        console.warn('initModel failed:', e);
        Alert.alert('오류', '모델 초기화에 실패했습니다.');
      }
    };

    boot();
    return () => { mounted = false; };
  }, []); // 👈 의존성 제거(재초기화 방지)

  // ✅ 화면 포커스될 때마다 상태/세션 초기화
  useFocusEffect(
    React.useCallback(() => {
      // UI 상태 초기화
      setResultData(null);
      setLoading(false);
      setShowUploadButton(false);

      // 네이티브 세션 초기화(있으면)
      try {
        if (DeepfakeDetector?.resetSession) {
          DeepfakeDetector.resetSession();
        } else if (DeepfakeDetector?.clear) {
          DeepfakeDetector.clear();
        }
      } catch (e) {
        console.log('reset session skipped:', e);
      }

      const onBack = () => {
        // 뒤로가기 시 진행중 상태 정리
        setLoading(false);
        setResultData(null);
        return false; // 기본 뒤로가기 동작 유지
      };

      // 🔁 RN 0.7x: addEventListener가 subscription을 반환 → cleanup에서 remove() 호출
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBack);

      return () => {
        backSub?.remove();
      };
    }, [])
  );

  const handleDetect = () => {
    setShowUploadButton(!showUploadButton);
  };

  const requestFilePermissionIfNeeded = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
      return result === RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return result === RESULTS.GRANTED;
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setResultData(null);

      const permissionGranted = await requestFilePermissionIfNeeded();
      if (!permissionGranted) {
        Alert.alert('권한 부족', '파일 접근 권한이 필요합니다.');
        return;
      }

      const [pickResult] = await pick({ mode: 'import' });
      if (!pickResult) return;

      if (!DeepfakeDetector || !DeepfakeDetector.detectFromFile) {
        Alert.alert('오류', '온디바이스 모듈을 사용할 수 없습니다.');
        return;
      }

      // 현재 네이티브 구현은 16kHz mono WAV 기준. 다른 포맷은 안내.
      const isWav =
        (pickResult?.mimeType || '').toLowerCase().includes('wav') ||
        (pickResult?.name || '').toLowerCase().endsWith('.wav');
      if (!isWav) {
        Alert.alert('형식 안내', '현재는 WAV 파일만 지원합니다. (16kHz/mono 권장)');
        return;
      }

      // ✅ 같은 URI 캐시 오판정 방지: 매번 새로운 캐시 경로로 복사 후 전달
      const ext = (pickResult?.name || '').toLowerCase().endsWith('.wav') ? '.wav' : '.wav';
      const cachedPath = `${RNFS.CachesDirectoryPath}/upload-${Date.now()}${ext}`;
      await RNFS.copyFile(pickResult.uri, cachedPath);

      // 🔍 온디바이스 추론(파일 스킴 포함)
      const fileUri = Platform.OS === 'android' ? `file://${cachedPath}` : cachedPath;
      const res = await DeepfakeDetector.detectFromFile(fileUri);
      // res: { prob_real: number, result: '진짜 음성' | '가짜 음성' }
      setResultData(res);
    } catch (error) {
      console.error('온디바이스 분석 오류:', error);
      Alert.alert('오류', '분석 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
      // 업로드 버튼은 계속 보이게 유지 → 바로 다음 업로드 가능
      setShowUploadButton(true);
    }
  };

  const handleReset = () => {
    setResultData(null);
    setLoading(false);
    setShowUploadButton(true); // 결과 닫고 곧바로 새 업로드 유도
    try { DeepfakeDetector?.resetSession?.(); } catch {}
  };

  const handleDetailView = () => {
    navigation.navigate('DetectDetail', { result: resultData });
  };

  const styles = getDynamicStyles(isLightMode);

  return (
    <View style={styles.container}>
      <Image
        source={LogoImage}
        style={{ width: 320, height: 320 }}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.detectButton} onPress={handleDetect}>
        <Text style={styles.detectButtonText}>DETECT</Text>
      </TouchableOpacity>

      {showUploadButton && (
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
          <Text style={styles.uploadButtonText}>
            {loading ? '업로드 중...' : 'UPLOAD FILE'}
          </Text>
        </TouchableOpacity>
      )}

      {resultData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📝 예측 결과</Text>
          <Text style={styles.resultText}>
            <Text style={styles.resultLabel}>결과: </Text>
            {resultData.result}
          </Text>
          {typeof resultData.prob_real === 'number' && (
            <Text style={styles.resultText}>
              <Text style={styles.resultLabel}>Real 확률: </Text>
              {(resultData.prob_real * 100).toFixed(2)}%
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.detailButton} onPress={handleDetailView}>
              <Text style={styles.detailButtonText}>상세보기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleReset}>
              <Text style={styles.confirmButtonText}>확인</Text>
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