// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   Platform,
//   Image,
//   NativeModules,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { pick } from '@react-native-documents/picker';
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import { useTheme } from '../contexts/ThemeContext';
// import LogoImage from '../assets/Detection.png';

// const HomeScreen = () => {
//   const [resultData, setResultData] = useState(null);
//   const [showUploadButton, setShowUploadButton] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { isLightMode } = useTheme();
//   const navigation = useNavigation();

//   // 네이티브 모듈
//   const { DeepfakeDetector } = NativeModules;

//   // 앱 시작 시 모델 초기화
//   useEffect(() => {
//     if (!DeepfakeDetector || !DeepfakeDetector.initModel) {
//       // iOS 등에서 모듈이 없을 경우
//       console.warn('DeepfakeDetector native module not found.');
//       return;
//     }
//     DeepfakeDetector.initModel().catch((e) => {
//       console.warn('initModel failed:', e);
//       Alert.alert('오류', '모델 초기화에 실패했습니다.');
//     });
//   }, [DeepfakeDetector]);

//   const handleDetect = () => {
//     setShowUploadButton(!showUploadButton);
//   };

//   const requestFilePermissionIfNeeded = async () => {
//     if (Platform.OS !== 'android') return true;
//     if (Platform.Version >= 33) {
//       const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
//       return result === RESULTS.GRANTED;
//     } else {
//       const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
//       return result === RESULTS.GRANTED;
//     }
//   };

//   const handleUpload = async () => {
//     try {
//       setLoading(true);
//       setResultData(null);

//       const permissionGranted = await requestFilePermissionIfNeeded();
//       if (!permissionGranted) {
//         Alert.alert('권한 부족', '파일 접근 권한이 필요합니다.');
//         return;
//       }

//       const [pickResult] = await pick({ mode: 'import' });
//       if (!pickResult) return;

//       if (!DeepfakeDetector || !DeepfakeDetector.detectFromFile) {
//         Alert.alert('오류', '온디바이스 모듈을 사용할 수 없습니다.');
//         return;
//       }

//       // 현재 네이티브 구현은 16kHz mono WAV 기준. 다른 포맷은 안내.
//       const isWav =
//         (pickResult?.mimeType || '').toLowerCase().includes('wav') ||
//         (pickResult?.name || '').toLowerCase().endsWith('.wav');
//       if (!isWav) {
//         Alert.alert('형식 안내', '현재는 WAV 파일만 지원합니다. (16kHz/mono 권장)');
//         return;
//       }

//       // 🔍 온디바이스 추론
//       const res = await DeepfakeDetector.detectFromFile(pickResult.uri);
//       // res: { prob_real: number, result: '진짜 음성' | '가짜 음성' }
//       setResultData(res);
//     } catch (error) {
//       console.error('온디바이스 분석 오류:', error);
//       Alert.alert('오류', '분석 중 문제가 발생했습니다.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setResultData(null);
//   };

//   const handleDetailView = () => {
//     navigation.navigate('DetectDetail', { result: resultData });
//   };

//   const styles = getDynamicStyles(isLightMode);

//   return (
//     <View style={styles.container}>
//       <Image
//         source={LogoImage}
//         style={{ width: 320, height: 320 }}
//         resizeMode="contain"
//       />

//       <TouchableOpacity style={styles.detectButton} onPress={handleDetect}>
//         <Text style={styles.detectButtonText}>DETECT</Text>
//       </TouchableOpacity>

//       {showUploadButton && (
//         <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
//           <Text style={styles.uploadButtonText}>
//             {loading ? '업로드 중...' : 'UPLOAD FILE'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {resultData && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.resultTitle}>📝 예측 결과</Text>
//           <Text style={styles.resultText}>
//             <Text style={styles.resultLabel}>결과: </Text>
//             {resultData.result}
//           </Text>
//           {typeof resultData.prob_real === 'number' && (
//             <Text style={styles.resultText}>
//               <Text style={styles.resultLabel}>Real 확률: </Text>
//               {(resultData.prob_real * 100).toFixed(2)}%
//             </Text>
//           )}

//           <View style={styles.buttonRow}>
//             <TouchableOpacity style={styles.detailButton} onPress={handleDetailView}>
//               <Text style={styles.detailButtonText}>상세보기</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.confirmButton} onPress={handleReset}>
//               <Text style={styles.confirmButtonText}>확인</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// const getDynamicStyles = (isLightMode) =>
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: isLightMode ? '#F8F8F8' : '#121212',
//     },
//     detectButton: {
//       backgroundColor: isLightMode ? '#FFFFFF' : '#1E1E1E',
//       paddingVertical: 15,
//       paddingHorizontal: 40,
//       borderRadius: 5,
//       marginBottom: 20,
//       borderWidth: isLightMode ? 1 : 0,
//       borderColor: '#E0E0E0',
//       shadowColor: '#000',
//       shadowOpacity: 0.1,
//       shadowRadius: 5,
//       elevation: 3,
//     },
//     detectButtonText: {
//       fontSize: 20,
//       fontWeight: 'bold',
//       color: isLightMode ? '#000000' : '#FFFFFF',
//     },
//     uploadButton: {
//       backgroundColor: isLightMode ? '#2196F3' : '#37474F',
//       paddingVertical: 12,
//       paddingHorizontal: 20,
//       borderRadius: 5,
//       marginTop: 10,
//     },
//     uploadButtonText: {
//       fontSize: 16,
//       fontWeight: 'bold',
//       color: '#FFFFFF',
//     },
//     resultContainer: {
//       marginTop: 30,
//       backgroundColor: isLightMode ? '#FAFAFA' : '#1E1E1E',
//       borderRadius: 8,
//       padding: 15,
//       width: '90%',
//       shadowColor: '#000',
//       shadowOpacity: 0.1,
//       shadowRadius: 10,
//       elevation: 3,
//     },
//     resultTitle: {
//       fontSize: 20,
//       fontWeight: 'bold',
//       marginBottom: 10,
//       color: isLightMode ? '#37474F' : '#E0E0E0',
//     },
//     resultText: {
//       fontSize: 16,
//       marginBottom: 5,
//       color: isLightMode ? '#424242' : '#E0E0E0',
//     },
//     resultLabel: {
//       fontWeight: 'bold',
//       color: isLightMode ? '#212121' : '#FFFFFF',
//     },
//     buttonRow: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       marginTop: 20,
//     },
//     detailButton: {
//       backgroundColor: '#2196F3',
//       paddingVertical: 10,
//       paddingHorizontal: 30,
//       borderRadius: 5,
//       marginRight: 10,
//     },
//     detailButtonText: {
//       fontSize: 16,
//       fontWeight: 'bold',
//       color: '#FFFFFF',
//     },
//     confirmButton: {
//       backgroundColor: '#FF5252',
//       paddingVertical: 10,
//       paddingHorizontal: 30,
//       borderRadius: 5,
//     },
//     confirmButtonText: {
//       fontSize: 16,
//       fontWeight: 'bold',
//       color: '#FFFFFF',
//     },
//   });

// export default HomeScreen;

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  NativeModules,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTheme } from '../contexts/ThemeContext';
import LogoImage from '../assets/Detection.png';

/** ===== 팔레트 ===== */
const PALETTE = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  blobLT: 'rgba(255,255,255,0.18)',
  blobRB: 'rgba(0,0,0,0.18)',
  white: '#FFFFFF',
  btnBlue: '#2F84FF',
  success1: '#34D399',
  success2: '#059669',
  danger1: '#FF4D4F',
  danger2: '#C81D25',
  track: 'rgba(255,255,255,0.18)',
};

/** 오디오 이퀄라이저 배경 */
const EqualizerBackground = ({ styles, variant = 'center' }) => {
  const BAR_COUNT = 11;
  const vals = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    vals.forEach((v, idx) => {
      const duration = 640 + (idx % 6) * 70;
      const seq = Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);
      Animated.loop(seq).start();
    });
  }, [vals]);

  const containerStyle = variant === 'center' ? styles.eqCenterContainer : styles.eqBottomContainer;

  return (
    <View pointerEvents="none" style={containerStyle}>
      {vals.map((v, i) => {
        const center = Math.floor(vals.length / 2);
        const d = Math.abs(i - center);
        const base = 0.55 + 0.45 * Math.cos((i / (vals.length - 1)) * Math.PI);
        const scaleY = v.interpolate({ inputRange: [0, 1], outputRange: [base, base + 1.0] });

        let bg = '#6F86FF';
        let opacity = 0.12;
        if (d === 0) { bg = '#4FB2FF'; opacity = 0.35; }
        else if (d === 1) { bg = '#CFE7FF'; opacity = 0.14; }

        return <Animated.View key={i} style={[styles.eqBar, { backgroundColor: bg, opacity, transform: [{ scaleY }] }]} />;
      })}
    </View>
  );
};

const HomeScreen = () => {
  const [resultData, setResultData] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [loading, setLoading] = useState(false);

  // 결과 모달
  const [resultVisible, setResultVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const { isLightMode } = useTheme(); // 기능 유지용
  const navigation = useNavigation();

  // 네이티브 모듈
  const { DeepfakeDetector } = NativeModules;

  // ===== Animations =====
  const logoFloat = useRef(new Animated.Value(0)).current;
  const detectPress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const uploadReveal = useRef(new Animated.Value(0)).current;

  // 모델 초기화 (기존 기능 유지)
  useEffect(() => {
    if (!DeepfakeDetector || !DeepfakeDetector.initModel) {
      console.warn('DeepfakeDetector native module not found.');
      return;
    }
    DeepfakeDetector.initModel().catch((e) => {
      console.warn('initModel failed:', e);
      Alert.alert('오류', '모델 초기화에 실패했습니다.');
    });
  }, [DeepfakeDetector]);

  // 로고 부유
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [logoFloat]);

  // 맥박 링
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handleDetect = () => {
    const next = !showUploadButton;
    setShowUploadButton(next);
    Animated.timing(uploadReveal, {
      toValue: next ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const requestFilePermissionIfNeeded = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const r = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
      return r === RESULTS.GRANTED;
    } else {
      const r = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return r === RESULTS.GRANTED;
    }
  };

  const openResultSheet = () => {
    setResultVisible(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeResultSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setResultVisible(false));
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

      const pickRes = await pick({ mode: 'import' });
      const pickResult = Array.isArray(pickRes) ? pickRes[0] : null;
      if (!pickResult) return;

      if (!DeepfakeDetector || !DeepfakeDetector.detectFromFile) {
        Alert.alert('오류', '온디바이스 모듈을 사용할 수 없습니다.');
        return;
      }

      const isWav =
        (pickResult?.mimeType || '').toLowerCase().includes('wav') ||
        (pickResult?.name || '').toLowerCase().endsWith('.wav');
      if (!isWav) {
        Alert.alert('형식 안내', '현재는 WAV 파일만 지원합니다. (16kHz/mono 권장)');
        return;
      }

      const res = await DeepfakeDetector.detectFromFile(pickResult.uri);
      setResultData(res);
      openResultSheet();
    } catch (e) {
      console.error('온디바이스 분석 오류:', e);
      Alert.alert('오류', '분석 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    closeResultSheet();
    setResultData(null);
  };

  const handleDetailView = () => {
    closeResultSheet();
    navigation.navigate('DetectDetail', { result: resultData });
  };

  const styles = getStyles();

  // Derived animated styles
  const logoTranslateY = logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const pressScale = detectPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const uploadTranslate = uploadReveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const uploadOpacity = uploadReveal;
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });

  // 결과 계산(색/라벨)
  const isReal = (resultData?.result || '').includes('진짜');
  const realPct = typeof resultData?.prob_real === 'number' ? Math.round(resultData.prob_real * 100) : null;
  const verdictColors = isReal ? [PALETTE.success1, PALETTE.success2] : [PALETTE.danger1, PALETTE.danger2];

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <LinearGradient colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, styles.blobLT]} />
        <View style={[styles.blob, styles.blobRB]} />
      </View>

      <EqualizerBackground styles={styles} variant="center" />

      {/* 콘텐츠 */}
      <View style={styles.content}>
        <Animated.View style={[styles.hero, { transform: [{ translateY: logoTranslateY }] }]}>
          <Image source={LogoImage} style={{ width: 220, height: 220 }} resizeMode="contain" />
          <Text style={styles.appTitle}>DeepVoice Detection</Text>
          <Text style={styles.subtitle}>음성 위·변조를 한 눈에 확인하세요</Text>
        </Animated.View>

        <View style={styles.actions}>
          <View style={styles.ringWrap} pointerEvents="none">
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          </View>

          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={() => Animated.timing(detectPress, { toValue: 1, duration: 90, useNativeDriver: true }).start()}
              onPressOut={() => Animated.timing(detectPress, { toValue: 0, duration: 90, useNativeDriver: true }).start()}
              onPress={handleDetect}
              style={styles.detectButton}
            >
              <Text style={styles.detectButtonText}>DETECT</Text>
            </TouchableOpacity>
          </Animated.View>

          {showUploadButton && (
            <Animated.View style={{ transform: [{ translateY: uploadTranslate }], opacity: uploadOpacity }}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
                <Text style={styles.uploadButtonText}>{loading ? '업로드 중...' : 'UPLOAD FILE'}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 결과 모달 */}
      <Modal
        visible={resultVisible}
        transparent
        statusBarTranslucent   // ✅ 상태바 영역까지 덮기
        animationType="none"
        onRequestClose={closeResultSheet}
      >
        {/* 모달이 보일 때 상태바도 어둡게 */}
        <StatusBar translucent backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />

        {/* 전체 디밍 레이어 */}
        <View style={styles.modalRoot}>
          {/* 빈 Pressable: 어디든 탭하면 닫힘 */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeResultSheet} />
          <SafeAreaView pointerEvents="box-none" style={styles.sheetContainer}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }],
                  opacity: sheetAnim,
                },
              ]}
            >
              <View style={styles.handle} />

              {/* 판정 카드 */}
              <LinearGradient colors={verdictColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verdictCard}>
                <Text style={styles.verdictEmoji}>{isReal ? '✅' : '⚠️'}</Text>
                <Text style={styles.verdictText}>{isReal ? '안전한 진짜 음성' : '의심되는 가짜 음성'}</Text>
                {realPct !== null && <Text style={styles.verdictPercent}>{realPct}%</Text>}
              </LinearGradient>

              {/* 보조 정보 + 진행바 */}
              {realPct !== null && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Real 확률</Text>
                    <Text style={styles.infoValue}>{realPct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(0, Math.min(100, realPct))}%`,
                          backgroundColor: isReal ? PALETTE.success1 : PALETTE.danger1,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* 버튼 (기존 기능 유지) */}
              <View style={styles.sheetButtons}>
                <TouchableOpacity style={styles.detailBtn} onPress={handleDetailView}>
                  <Text style={styles.detailBtnText}>상세보기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleReset}>
                  <Text style={styles.confirmBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: PALETTE.g3 },

    /** 배경 블롭 */
    blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
    blobLT: { top: 120, left: -40, backgroundColor: PALETTE.blobLT },
    blobRB: { bottom: -40, right: -60, backgroundColor: PALETTE.blobRB },

    /** 레이아웃 */
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, zIndex: 2 },
    hero: { alignItems: 'center', marginTop: -10, marginBottom: 10 },
    appTitle: { fontSize: 22, fontWeight: '800', color: PALETTE.white, letterSpacing: 0.5 },
    subtitle: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    /** Equalizer */
    eqBottomContainer: {
      position: 'absolute', left: 24, right: 24, bottom: 120, height: 130,
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 0,
    },
    eqCenterContainer: {
      position: 'absolute', left: 28, right: 28, top: '54%', height: 120,
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 0,
    },
    eqBar: { width: 9, height: 110, borderRadius: 6 },

    /** 액션 */
    actions: { marginTop: 18, alignItems: 'center', width: '100%', height: 160, justifyContent: 'center' },
    ringWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
    pulseRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
    detectButton: {
      backgroundColor: PALETTE.btnBlue, paddingVertical: 16, paddingHorizontal: 56, borderRadius: 28,
      shadowColor: '#1EA7FF', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    detectButtonText: { color: PALETTE.white, fontSize: 20, fontWeight: '800', letterSpacing: 1.2 },
    uploadButton: {
      marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
      paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'center',
    },
    uploadButtonText: { fontSize: 15, fontWeight: '700', color: PALETTE.white },

    /** 모달 루트(상태바까지 덮음) */
    modalRoot: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)', // ✅ 화면 전체 어둡게
      justifyContent: 'flex-end',
    },
    sheetContainer: { flex: 1, justifyContent: 'flex-end' },

    /** 바텀시트 */
    sheet: {
      marginHorizontal: 16, marginBottom: 16,
      backgroundColor: 'rgba(16,24,48,0.96)',
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 16,
    },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },

    /** 판정 카드 */
    verdictCard: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
    verdictEmoji: { fontSize: 28, marginBottom: 4 },
    verdictText: { color: PALETTE.white, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    verdictPercent: { color: PALETTE.white, fontSize: 24, fontWeight: '900', marginTop: 2 },

    /** 보조 정보 + 진행바 */
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 6 },
    infoLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' },
    infoValue: { color: PALETTE.white, fontSize: 16, fontWeight: '900' },
    progressTrack: { height: 10, backgroundColor: PALETTE.track, borderRadius: 8, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 8 },

    /** 버튼 */
    sheetButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    detailBtn: { flex: 1, marginRight: 8, backgroundColor: '#4FB2FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    detailBtnText: { color: PALETTE.white, fontWeight: '800' },
    confirmBtn: { flex: 1, marginLeft: 8, backgroundColor: '#7B6CF6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    confirmBtnText: { color: PALETTE.white, fontWeight: '800' },
  });

export default HomeScreen;

