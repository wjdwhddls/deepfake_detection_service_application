// src/screens/HomeScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image, NativeModules,
  Animated, Easing, Modal, Pressable, SafeAreaView, StatusBar, BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { pick } from '@react-native-documents/picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import LogoImage from '../assets/Detection.png';

const PALETTE = { /* ...동일, 생략 가능... */ g1:'#20B2F3', g2:'#5E73F7', g3:'#0F1730', white:'#fff' };

function verdictFromProb(probReal){/* ...동일... */}

const { DeepfakeDetector } = NativeModules;

const HomeScreen = () => {
  const [resultData, setResultData] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const detectPress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const uploadReveal = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  // ✅ 모델 초기화: 1회만, 실패 시에도 재시도 루프 없음
  const initOnceRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (initOnceRef.current) return;
      if (!DeepfakeDetector?.initModel) return;
      try {
        await DeepfakeDetector.initModel();
        if (mounted) initOnceRef.current = true;
      } catch (e) {
        console.warn('initModel failed:', e?.message || e);
        Alert.alert('오류', '모델 초기화에 실패했습니다.');
      }
    };
    boot();
    return () => { mounted = false; };
  }, []);

  // ✅ 화면 포커스 될 때 UI/세션 리셋
  useFocusEffect(
    React.useCallback(() => {
      setResultData(null); setLoading(false); setShowUploadButton(false);
      try { DeepfakeDetector?.resetSession?.(); } catch {}
      const sub = BackHandler.addEventListener('hardwareBackPress', () => { setLoading(false); setResultData(null); return false; });
      return () => sub.remove();
    }, [])
  );

  // 애니메이션 루프들 (동일)
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(logoFloat,{toValue:1,duration:1800,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),
      Animated.timing(logoFloat,{toValue:0,duration:1800,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),
    ])).start();
  }, [logoFloat]);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1,duration:1400,easing:Easing.out(Easing.quad),useNativeDriver:true}),
      Animated.timing(pulse,{toValue:0,duration:0,useNativeDriver:true}),
    ])).start();
  }, [pulse]);

  const requestFilePermissionIfNeeded = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) return (await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO)) === RESULTS.GRANTED;
    return (await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE)) === RESULTS.GRANTED;
  };

  const handleDetect = () => {
    const next = !showUploadButton;
    setShowUploadButton(next);
    Animated.timing(uploadReveal,{toValue: next ? 1 : 0, duration:380, easing:Easing.out(Easing.quad), useNativeDriver:true}).start();
  };

  const openResultSheet = () => {
    setResultVisible(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim,{toValue:1,duration:320,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  };
  const closeResultSheet = () => {
    Animated.timing(sheetAnim,{toValue:0,duration:220,easing:Easing.in(Easing.cubic),useNativeDriver:true})
      .start(() => setResultVisible(false));
  };

  const handleUpload = async () => {
    try {
      setLoading(true); setResultData(null);
      const permissionGranted = await requestFilePermissionIfNeeded();
      if (!permissionGranted) { Alert.alert('권한 부족','파일 접근 권한이 필요합니다.'); return; }

      const picked = await pick({ mode: 'import' });
      const pickResult = Array.isArray(picked) ? picked[0] : null;
      if (!pickResult) return;

      if (!DeepfakeDetector?.detectFromFile) { Alert.alert('오류','온디바이스 모듈을 사용할 수 없습니다.'); return; }

      const isWav = (pickResult?.mimeType || '').toLowerCase().includes('wav') ||
                    (pickResult?.name || '').toLowerCase().endsWith('.wav');
      if (!isWav) { Alert.alert('형식 안내','현재는 WAV 파일만 지원합니다. (16kHz/mono 권장)'); return; }

      // ✅ 매번 새로운 캐시 파일로 복사 후 분석
      const cachedPath = `${RNFS.CachesDirectoryPath}/upload-${Date.now()}.wav`;
      await RNFS.copyFile(pickResult.uri, cachedPath);
      const fileUri = Platform.OS === 'android' ? `file://${cachedPath}` : cachedPath;

      const res = await DeepfakeDetector.detectFromFile(fileUri);
      setResultData(res);
      openResultSheet();
    } catch (e) {
      console.error('온디바이스 분석 오류:', e);
      Alert.alert('오류','분석 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
      setShowUploadButton(true);
    }
  };

  const handleDetailView = () => { closeResultSheet(); navigation.navigate('DetectDetail', { result: resultData }); };
  const handleReset = () => { closeResultSheet(); setResultData(null); setLoading(false); setShowUploadButton(true); try{DeepfakeDetector?.resetSession?.();}catch{} };

  // ... 렌더 부분(애니메이션/모달/스타일)은 기존 개선 버전 유지 ...
  // (여기서는 길이상 생략했지만, 너가 올려준 개선된 UI/모달/Equalizer 코드 그대로 쓰면 됩니다)
  return (/* 기존 렌더 그대로 */);
};

export default HomeScreen;