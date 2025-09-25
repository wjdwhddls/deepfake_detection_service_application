// src/screens/LoginScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Animated, Image, Easing, Alert, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/config';

// // 서버 주소: 에뮬레이터용은 10.0.2.2, 실제 기기/배포용은 EC2
// // const API_BASE = 'http://10.0.2.2:3000';

/* ====================== 에러 메시지 한글 변환 유틸 ====================== */
const toKoreanBackendMessage = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.join(', ');
  if (typeof data === 'object') return data.message ?? Object.values(data).join(', ');
  return null;
};

const toKoreanErrorMessage = (error) => {
  if (error?.response) {
    const { status, data } = error.response;
    const raw =
      typeof data === 'string' ? data :
        (Array.isArray(data) ? data.join(', ') :
          (data?.message || null));

    const dict = {
      'Invalid credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'User not found': '해당 계정을 찾을 수 없습니다.',
      'Password mismatch': '비밀번호가 올바르지 않습니다.',
      'Account locked': '계정이 잠겼습니다. 관리자에게 문의하세요.',
      'Too many requests': '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.',
    };
    const mapped = raw && dict[raw] ? dict[raw] : raw;

    switch (status) {
      case 400: return mapped || '요청 형식이 올바르지 않습니다.';
      case 401: return mapped || '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 403: return mapped || '접근 권한이 없습니다.';
      case 404: return mapped || '요청한 리소스를 찾을 수 없습니다.';
      case 409: return mapped || '이미 존재하는 정보가 있습니다.';
      case 422: return mapped || '입력값을 다시 확인해 주세요.';
      case 429: return mapped || '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
      case 500: return mapped || '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      case 502:
      case 503:
      case 504: return '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
      default: return mapped || `오류가 발생했습니다. (코드 ${status})`;
    }
  }
  if (error?.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.';
  }
  if (typeof error?.message === 'string' && error.message.includes('Network Error')) {
    return '네트워크 오류입니다. 인터넷 연결을 확인해 주세요.';
  }
  return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};
/* ===================================================================== */

// ✅ 화면 크기 기반 블롭 사이즈/위치
const { width: W, height: H } = Dimensions.get('window');
const BLOB_LT_SIZE = Math.max(W, H) * 0.9;   // 좌상단 큰 원
const BLOB_RB_SIZE = Math.max(W, H) * 0.85;  // 우하단 큰 원

const LoginScreen = ({ setIsLoggedIn, onLoginSuccess }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ✅ 로그인 처리 (Alert로 성공/실패 표시) — 로직 그대로 유지
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    try {
      const response = await api.post(
        `/api/auth/signin`,
        { user_id: trimmedEmail, user_pw: trimmedPassword },
        { headers: { 'Content-Type': 'application/json' }, validateStatus: (s) => s < 500 }
      );

      const token = response.data?.data?.accessToken || response.data?.accessToken;
      const phone = response.data?.data?.phoneNumber;

      if (token) {
        await AsyncStorage.setItem('token', token);
        setIsLoggedIn(true);
        onLoginSuccess?.(phone);
        Alert.alert('로그인 성공', '환영합니다!');
      } else {
        const msg = toKoreanBackendMessage(response.data) || '서버에서 토큰을 받지 못했습니다.';
        Alert.alert('로그인 실패', msg);
      }
    } catch (error) {
      const msg = toKoreanErrorMessage(error);
      Alert.alert('로그인 실패', msg);
    }
  };

  // 이퀄라이저 애니메이션
  const barCount = 18;
  const bars = useMemo(() => Array.from({ length: barCount }, () => new Animated.Value(0)), []);
  useEffect(() => {
    bars.forEach((v) => {
      const loop = () => {
        Animated.timing(v, {
          toValue: Math.random(),
          duration: 400 + Math.random() * 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }).start(loop);
      };
      loop();
    });
  }, [bars]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ✅ 배경: 홈과 통일 (위→아래 어두워짐) */}
      <LinearGradient
        colors={['#20B2F3', '#5E73F7', '#0F1730']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* ✅ 큰 원(블롭) 2개: 좌상단 밝게 / 우하단 어둡게 */}
      <View style={[styles.blob, styles.blobLT]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobRB]} pointerEvents="none" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container} pointerEvents="box-none">
          {/* 상단: 로고 + 이퀄라이저 */}
          <View style={styles.header}>
            <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.equalizer} pointerEvents="none">
              {bars.map((v, idx) => {
                const h = v.interpolate({ inputRange: [0, 1], outputRange: [10, 72] }); // ↑ 더 높게
                return (
                  <View key={idx} style={styles.eqItem}>
                    {/* 글로우 */}
                    <Animated.View style={[styles.eqGlow, { height: Animated.add(h, 14) }]} />
                    {/* 막대 */}
                    <Animated.View
                      style={[
                        styles.eqBar,
                        {
                          height: h,
                          backgroundColor: idx % 2 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.9)',
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* 카드 제거 + 입력 박스 크게 */}
          <View style={styles.card}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.pillText}
                placeholder="E-mail"
                placeholderTextColor="#8FB2E8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputPill}>
              <TextInput
                style={styles.pillText}
                placeholder="Password"
                placeholderTextColor="#8FB2E8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleLogin}>
              <LinearGradient
                colors={['#0AA7F6', '#2E7BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaInner}
              >
                <Text style={styles.ctaText}>로그인</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomLinks}>
              <Text style={styles.linkDim}>계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkStrong}>회원가입</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomLinks}>
              <Text style={styles.linkDim}>비밀번호를 잊으셨나요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
                <Text style={styles.linkStrong}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ====================== styles ====================== */
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#0A1430' },

  // ✅ 블롭 공통
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobLT: {
    width: BLOB_LT_SIZE,
    height: BLOB_LT_SIZE,
    top: -BLOB_LT_SIZE * 0.25,
    left: -BLOB_LT_SIZE * 0.15,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  blobRB: {
    width: BLOB_RB_SIZE,
    height: BLOB_RB_SIZE,
    bottom: -BLOB_RB_SIZE * 0.25,
    right: -BLOB_RB_SIZE * 0.2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },

  // 로고와 이퀄라이저 간격을 좁혀 임팩트 강화
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 500, height: 280 },

  // 이퀄라이저를 더 크게/가깝게
  equalizer: {
    height: 72,
    width: '88%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 8,
  },

  // 각 막대 컨테이너(그림자/글로우용)
  eqItem: {
    width: 10,                // 막대 두께 ↑
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,      // 간격 ↑
    position: 'relative',
  },
  eqBar: { width: '100%', borderRadius: 6 }, // 둥글기 강화
  eqGlow: {
    position: 'absolute',
    bottom: -4,
    width: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(46,123,255,0.22)',
    shadowColor: '#2E7BFF',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  /* 🔹 카드 상자 비주얼 제거 */
  card: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    shadowOpacity: 0,
    elevation: 0,
  },

  /* 🔹 입력 박스 크게 */
  inputPill: {
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(20, 32, 70, 0.95)',
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pillText: {
    color: '#F2F7FF',
    fontSize: 17,
  },

  cta: {
    marginTop: 10,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaInner: { height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, fontSize: 16 },

  bottomLinks: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
  linkDim: { color: '#A9C1F6' },
  linkStrong: { color: '#FFFFFF', fontWeight: '800' },
});

export default LoginScreen;