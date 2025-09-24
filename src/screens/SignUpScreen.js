// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Image
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const API_BASE = 'http://ec2-43-203-141-45.ap-northeast-2.compute.amazonaws.com';
// const API_BASE = 'http://10.0.2.2:3000';

const C = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  white: '#FFFFFF',
};

const UserGenderEnum = { MAN: 'MAN', WOMAN: 'WOMAN' };

const { width: W, height: H } = Dimensions.get('window');
const MAX = Math.max(W, H);

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(UserGenderEnum.MAN);
  const [tel, setTel] = useState('');
  const [loading, setLoading] = useState(false);

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

    try {
      const response = await axios.post(`${API_BASE}/api/users/`, requestData);
      if (response.status === 201) {
        Alert.alert('회원가입 성공!', '계정이 성공적으로 생성되었습니다!');
        navigation.navigate('Login');
      } else {
        const msg =
          typeof response.data === 'string' ? response.data :
          (Array.isArray(response.data) ? response.data.join(', ') :
          (response.data?.message || '회원가입 중 오류가 발생했습니다.'));
        Alert.alert('회원가입 실패', msg);
      }
    } catch (err) {
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