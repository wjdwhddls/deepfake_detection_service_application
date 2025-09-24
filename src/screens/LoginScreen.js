// src/screens/LoginScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Animated, Image, Easing, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SuccessDialog from '../components/SuccessDialog';
import ErrorDialog from '../components/ErrorDialog';
import { api } from '../lib/config';

// 서버 주소: 에뮬레이터용은 10.0.2.2, 실제 기기/배포용은 EC2
// const API_BASE = 'http://10.0.2.2:3000';

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

const LoginScreen = ({ setIsLoggedIn, onLoginSuccess }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 모달 상태
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState('로그인 실패');
  const [errorMsg, setErrorMsg] = useState('문제가 발생했습니다.');

  // 성공 후 처리용 임시 저장
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingPhone, setPendingPhone] = useState(null);

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
        setPendingToken(token);
        setPendingPhone(phone ?? null);
        setSuccessOpen(true);
      } else {
        const msg = toKoreanBackendMessage(response.data) || '서버에서 토큰을 받지 못했습니다.';
        setErrorTitle('로그인 실패');
        setErrorMsg(msg);
        setErrorOpen(true);
      }
    } catch (error) {
      const msg = toKoreanErrorMessage(error);
      setErrorTitle('로그인 실패');
      setErrorMsg(msg);
      setErrorOpen(true);
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
      <LinearGradient
        colors={['#20B2F3', '#5E73F7', '#0F1730']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container} pointerEvents="box-none">
          <View style={styles.header}>
            <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.equalizer} pointerEvents="none">
              {bars.map((v, idx) => {
                const h = v.interpolate({ inputRange: [0, 1], outputRange: [8, 44] });
                return (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.eqBar,
                      { height: h, backgroundColor: idx % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)' },
                    ]}
                  />
                );
              })}
            </View>
          </View>

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
            <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
              <Text style={[styles.linkDim, { textAlign: 'center', marginTop: 8 }]}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 모달 */}
      <SuccessDialog
        visible={successOpen}
        title="로그인 성공"
        message="환영합니다!"
        okText="OK"
        onClose={async () => {
          setSuccessOpen(false);
          try {
            if (pendingToken) {
              await AsyncStorage.setItem('token', pendingToken);
            }
          } finally {
            if (pendingPhone) onLoginSuccess?.(pendingPhone);
            setIsLoggedIn(true);
            setPendingToken(null);
            setPendingPhone(null);
          }
        }}
      />
      <ErrorDialog
        visible={errorOpen}
        title={errorTitle}
        message={errorMsg}
        okText="확인"
        onClose={() => setErrorOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#0A1430' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  header: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 280, height: 126, marginBottom: 12 },
  equalizer: { height: 56, width: '82%', flexDirection: 'row', justifyContent: 'space-between' },
  eqBar: { width: 8, borderRadius: 4 },
  card: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, shadowOpacity: 0, elevation: 0 },
  inputPill: {
    height: 60, borderRadius: 30, backgroundColor: 'rgba(20, 32, 70, 0.95)',
    paddingHorizontal: 18, justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  pillText: { color: '#F2F7FF', fontSize: 17 },
  cta: {
    marginTop: 10, borderRadius: 28, overflow: 'hidden',
    shadowColor: '#1A73E8', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  ctaInner: { height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, fontSize: 16 },
  bottomLinks: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
  linkDim: { color: '#A9C1F6' },
  linkStrong: { color: '#FFFFFF', fontWeight: '800' },
});

export default LoginScreen;