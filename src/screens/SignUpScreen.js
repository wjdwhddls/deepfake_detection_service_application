import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Image
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const C = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  blobLT: 'rgba(255,255,255,0.18)',   // 유지(팔레트 통일)
  blobRB: 'rgba(0,0,0,0.18)',         // 유지(팔레트 통일)
  white: '#FFFFFF',
  btnBlue: '#2F84FF',
};

const UserGenderEnum = { MAN: 'MAN', WOMAN: 'WOMAN' };

const { width: W, height: H } = Dimensions.get('window');
const MAX = Math.max(W, H);

// 반응형 로고 크기 (원하면 고정값 유지 가능)
const LOGO_W = Math.min(W * 0.6, 340);
const LOGO_H = LOGO_W * (90 / 200); // Detection.png (200x90) 기준 비율

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(UserGenderEnum.MAN);
  const [tel, setTel] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== 기존 회원가입 로직: 그대로 =====
  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword || !tel) {
      Alert.alert('오류', '모든 필드를 입력하세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    const requestData = {
      user_id: email,
      user_pw: password,
      username: name,
      gender,
      tel,
      role: 'USER',
    };

    console.log('전송할 데이터:', requestData);

    try {
      const response = await axios.post('http://10.0.2.2:3000/api/users/', requestData);
      console.log('서버 응답:', response.data);
      if (response.status === 201) {
        Alert.alert('회원가입 성공!', '계정이 성공적으로 생성되었습니다!');
        navigation.navigate('Login');
      }
    } catch (err) {
      console.error('회원가입 요청 에러 발생:', err);
      let message = '회원가입 중 오류가 발생했습니다.';
      if (err.response) {
        if (typeof err.response.data === 'string') message = err.response.data;
        else if (Array.isArray(err.response.data)) message = err.response.data.join(', ');
        else if (typeof err.response.data === 'object' && err.response.data !== null)
          message = Object.values(err.response.data).join(', ');
      } else if (err.request) {
        message = '서버에 연결할 수 없습니다.';
      }
      Alert.alert('회원가입 실패', message);
    } finally {
      setLoading(false);
    }
  };
  // ======================================

  return (
    <SafeAreaView style={styles.safe}>
      {/* 기본 그라디언트(로그인과 동일 팔레트) */}
      <LinearGradient
        colors={[C.g1, C.g2, C.g3]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 🔵 회원가입만의 배경 변주: 우상단 블롭(시안 계열) */}
      <View style={styles.blobTRWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}
          style={styles.blobTR}
        />
      </View>

      {/* 🟣 좌하단 블롭(인디고 계열, 살짝 더 진하게) */}
      <View style={styles.blobLBWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.28)']}
          start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}
          style={styles.blobLB}
        />
      </View>

      {/* ／ 대각선 라이트 밴드 (살짝 강조) */}
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.diagBand}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          {/* 로고 */}
          <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />

          {/* 입력 필드 */}
          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="이름" placeholderTextColor="#8FB2E8"
              value={name} onChangeText={setName} returnKeyType="next"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="이메일" placeholderTextColor="#8FB2E8"
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="비밀번호" placeholderTextColor="#8FB2E8"
              secureTextEntry value={password} onChangeText={setPassword} returnKeyType="next"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="비밀번호 확인" placeholderTextColor="#8FB2E8"
              secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} returnKeyType="next"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.inputText}
              placeholder="전화번호 (010-xxxx-xxxx)" placeholderTextColor="#8FB2E8"
              value={tel} onChangeText={setTel} keyboardType="phone-pad" returnKeyType="done"
            />
          </View>

          {/* 성별 세그먼트 */}
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

          {/* 가입 버튼 */}
          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleSignUp}>
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

/* ====================== styles ====================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1430' },

  container: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },

  // 로고 (반응형)
  logo: {
    width: 300,
    height: 200,
    alignSelf: 'center',
  },

  // ==== 회원가입만의 배경 블롭/요소들 ====
  blobTRWrap: {
    position: 'absolute',
    top: -MAX * 0.18,
    right: -MAX * 0.12,
    width: MAX * 0.85,
    height: MAX * 0.85,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blobTR: {
    flex: 1,
    borderRadius: 9999,
  },

  blobLBWrap: {
    position: 'absolute',
    bottom: -MAX * 0.22,
    left: -MAX * 0.18,
    width: MAX * 0.95,
    height: MAX * 0.95,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blobLB: {
    flex: 1,
    borderRadius: 9999,
  },

  ring: {
    position: 'absolute',
    width: MAX * 0.75,
    height: MAX * 0.75,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    top: MAX * 0.12,
    left: -MAX * 0.15,
    transform: [{ rotate: '12deg' }],
  },

  diagBand: {
    position: 'absolute',
    width: MAX * 1.2,
    height: MAX * 0.28,
    top: MAX * 0.35,
    left: -MAX * 0.1,
    transform: [{ rotate: '-18deg' }],
    borderRadius: 40,
  },

  // ==== 입력 / 세그먼트 / 버튼 ====
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
