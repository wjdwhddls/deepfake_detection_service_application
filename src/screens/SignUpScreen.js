// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { api } from '../lib/config';

const C = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  white: '#FFFFFF',
};

const UserGenderEnum = { MAN: 'MAN', WOMAN: 'WOMAN' };
const { width: W, height: H } = Dimensions.get('window');
const MAX = Math.max(W, H);

// 서버 정규식과 맞춤(대/소문자+숫자+특수문자, 8~20자)
const PW_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
// 닉네임 정규식
const NAME_REGEX = /^[0-9a-zA-Z가-힣]+$/;
// 전화번호 정규식
const TEL_REGEX = /^010-\d{4}-\d{4}$/;
// 간단 이메일 체크(서버에서도 검증함)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(UserGenderEnum.MAN);
  const [tel, setTel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const username = name.trim();
    const user_id = email.trim().toLowerCase();
    const user_pw = password.trim();
    const confirm = confirmPassword.trim();
    const telTrim = tel.trim();

    // 빈값
    if (!username || !user_id || !user_pw || !confirm || !telTrim) {
      Alert.alert('오류', '모든 필드를 입력하세요.');
      return;
    }
    // 이메일
    if (!EMAIL_REGEX.test(user_id)) {
      Alert.alert('오류', '이메일 형식이 올바르지 않습니다.');
      return;
    }
    // 비밀번호 일치
    if (user_pw !== confirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    // 비밀번호 규칙(8~20자)
    if (!PW_REGEX.test(user_pw)) {
      Alert.alert(
        '오류',
        '비밀번호는 8~20자이며 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.'
      );
      return;
    }
    // 닉네임 규칙
    if (!NAME_REGEX.test(username) || username.length < 2 || username.length > 20) {
      Alert.alert('오류', '닉네임은 2~20자의 한글/영문/숫자만 사용할 수 있습니다.');
      return;
    }
    // 전화번호 형식
    if (!TEL_REGEX.test(telTrim)) {
      Alert.alert('오류', "핸드폰 번호는 '010-xxxx-xxxx' 형식으로 입력해 주세요.");
      return;
    }

    setLoading(true);

    // 서버 DTO와 필드명/값 정확히 일치
    const requestData = {
      user_id,
      user_pw,
      username,
      gender,       // 'MAN' | 'WOMAN'
      tel: telTrim, // '010-1234-5678'
      role: 'USER', // UserRole.USER
    };

    try {
      const res = await api.post('/api/users', requestData);

      if (res.status === 201 || res.data?.success) {
        Alert.alert('회원가입 성공!', '계정이 성공적으로 생성되었습니다!');
        navigation.navigate('Login');
      } else {
        const msg =
          typeof res.data === 'string'
            ? res.data
            : Array.isArray(res.data)
            ? res.data.join(', ')
            : res.data?.message || '회원가입 중 오류가 발생했습니다.';
        Alert.alert('회원가입 실패', msg);
      }
    } catch (err) {
      const msg =
        err?.friendlyMessage ||
        (err?.response?.data &&
          (Array.isArray(err.response.data)
            ? err.response.data.join(', ')
            : typeof err.response.data === 'object'
            ? Object.values(err.response.data).join(', ')
            : String(err.response.data))) ||
        err?.message ||
        '회원가입 중 오류가 발생했습니다.';
      Alert.alert('회원가입 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[C.g1, C.g2, C.g3]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 우상단/좌하단 블롭 */}
      <View style={styles.blobTRWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}
          style={styles.blobTR}
        />
      </View>
      <View style={styles.blobLBWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.28)']}
          start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}
          style={styles.blobLB}
        />
      </View>
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.diagBand}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="이름" placeholderTextColor="#8FB2E8"
              value={name}
              onChangeText={(t) => setName(t.trim())} // ← 즉시 trim
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="이메일" placeholderTextColor="#8FB2E8"
              value={email}
              onChangeText={(t) => setEmail(t.trim())} // ← 즉시 trim
              keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="비밀번호" placeholderTextColor="#8FB2E8"
              secureTextEntry
              value={password}
              onChangeText={(t) => setPassword(t.replace(/\s+/g, ''))} // ← 모든 공백 제거
              returnKeyType="next"
              autoComplete="password-new" maxLength={20}
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="비밀번호 확인" placeholderTextColor="#8FB2E8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(t) => setConfirmPassword(t.replace(/\s+/g, ''))} // ← 모든 공백 제거
              returnKeyType="next"
              autoComplete="password-new" maxLength={20}
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="전화번호 (010-xxxx-xxxx)" placeholderTextColor="#8FB2E8"
              value={tel}
              onChangeText={(t) => setTel(t.trim())} // ← 즉시 trim
              keyboardType="phone-pad" returnKeyType="done"
              autoComplete="tel"
            />
          </View>

          <Text style={styles.genderLabel}>성별</Text>
          <View style={styles.genderSegment}>
            <TouchableOpacity
              onPress={() => setGender(UserGenderEnum.MAN)}
              activeOpacity={0.9}
              style={[styles.segmentBtn, gender === UserGenderEnum.MAN && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, gender === UserGenderEnum.MAN && styles.segmentTextActive]}>남</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender(UserGenderEnum.WOMAN)}
              activeOpacity={0.9}
              style={[styles.segmentBtn, gender === UserGenderEnum.WOMAN && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, gender === UserGenderEnum.WOMAN && styles.segmentTextActive]}>여</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleSignUp} disabled={loading}>
            <LinearGradient colors={['#0AA7F6', '#2E7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaInner}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>회원 가입</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            이미 계정이 있으신가요?
            <Text onPress={() => navigation.navigate('Login')} style={styles.linkText}> 로그인</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1430' },
  container: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  logo: { width: 300, height: 200, alignSelf: 'center' },

  blobTRWrap: {
    position: 'absolute',
    top: -MAX * 0.18,
    right: -MAX * 0.12,
    width: MAX * 0.85,
    height: MAX * 0.85,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blobTR: { flex: 1, borderRadius: 9999 },

  blobLBWrap: {
    position: 'absolute',
    bottom: -MAX * 0.22,
    left: -MAX * 0.18,
    width: MAX * 0.95,
    height: MAX * 0.95,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blobLB: { flex: 1, borderRadius: 9999 },

  diagBand: {
    position: 'absolute',
    width: MAX * 1.2,
    height: MAX * 0.28,
    top: MAX * 0.35,
    left: -MAX * 0.1,
    transform: [{ rotate: '-18deg' }],
    borderRadius: 40,
  },

  inputPill: {
    height: 58,
    borderRadius: 30,
    backgroundColor: 'rgba(20, 32, 70, 0.95)',
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  inputText: { color: '#F2F7FF', fontSize: 16.5 },

  genderLabel: { color: C.white, fontSize: 15, marginTop: 4, marginBottom: 8, marginLeft: 2, opacity: 0.9 },

  genderSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 32, 70, 0.7)',
    borderRadius: 28,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  segmentBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  segmentText: { color: '#BBD0FF', fontWeight: '700' },
  segmentTextActive: { color: C.white },

  cta: {
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

  footerText: { color: '#A9C1F6', textAlign: 'center', marginTop: 14 },
  linkText: { color: '#FFFFFF', fontWeight: '800' },
});

export default SignUpScreen;