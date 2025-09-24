import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const C = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  white: '#FFFFFF',
};

// ⛔ 기존 로직 유지
const PasswordRecoveryScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  // 실제 이메일 목록 (예시) — 기존 그대로
  const registeredEmails = ['example1@test.com', 'example2@test.com'];

  const handleRecoverPassword = () => {
    if (registeredEmails.includes(email)) {
      navigation.navigate('PasswordChange');
    } else {
      Alert.alert('아이디 오류', '아이디가 존재하지 않습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 배경 그라디언트 */}
      <LinearGradient
        colors={[C.g1, C.g2, C.g3]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 🔵 블롭 3개: 우상(작고 밝음) + 좌하(크고 어두움) + 상단보조(아주 옅음) */}
      <View style={[styles.blob, styles.blobTR]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobLB]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobCT]} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>로그인에 문제가 있나요?</Text>
          <Text style={styles.subtitle}>사용하시는 Email을 입력하여 주세요.</Text>

          {/* 입력 pill */}
          <View style={styles.inputPill}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력해 주세요"
              placeholderTextColor="#8FB2E8"
              keyboardType="email-address"
              textAlign="center"
              style={styles.inputText}
              returnKeyType="done"
            />
          </View>

          {/* 버튼: 그라디언트 */}
          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleRecoverPassword}>
            <LinearGradient
              colors={['#0AA7F6', '#2E7BFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaInner}
            >
              <Text style={styles.ctaText}>확인</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 푸터 링크 (기존 라우팅 그대로) */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              아직 계정이 없으신가요?
              <Text onPress={() => navigation.navigate('SignUp')} style={styles.link}> 회원가입</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ====================== styles ====================== */
const { width: W, height: H } = Dimensions.get('window');
const MAX = Math.max(W, H);

// ✨ 블롭 크기/위치: 로그인/회원가입/비번변경과 다르게 조정
const TR_SIZE = MAX * 0.60;   // 우상단: 작고 밝은 보조
const LB_SIZE = MAX * 1.05;   // 좌하단: 크게 깔아줌
const CT_SIZE = MAX * 0.55;   // 상단 오른쪽: 아주 옅은 보조 블롭

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1430' },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 공통 블롭
  blob: { position: 'absolute', borderRadius: 9999 },

  // 우상단(밝은 시안): 작고 위/오른쪽으로 더 치우침
  blobTR: {
    width: TR_SIZE,
    height: TR_SIZE,
    top: -TR_SIZE * 0.28,
    right: -TR_SIZE * 0.22,
    backgroundColor: 'rgba(255,255,255,0.20)', // 로그인보다 살짝 연함
  },

  // 좌하단(어두운 인디고): 크게, 살짝 왼쪽/아래로
  blobLB: {
    width: LB_SIZE,
    height: LB_SIZE,
    left: -LB_SIZE * 0.22,
    bottom: -LB_SIZE * 0.18,
    backgroundColor: 'rgba(0,0,0,0.22)', // 기존보다 약간 진하게
  },

  // 상단 오른쪽 보조 블롭: 아주 옅게 겹쳐 깊이감
  blobCT: {
    width: CT_SIZE,
    height: CT_SIZE,
    top: MAX * 0.08,
    right: -CT_SIZE * 0.10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  lockIcon: { fontSize: 60, marginBottom: 14 },
  title: {
    fontSize: 24,
    color: C.white,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: { color: '#BBD0FF', marginBottom: 18, textAlign: 'center' },

  inputPill: {
    height: 58,
    width: '100%',
    borderRadius: 30,
    backgroundColor: 'rgba(20, 32, 70, 0.95)',
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  inputText: { color: '#F2F7FF', fontSize: 16.5 },

  cta: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 4,
  },
  ctaInner: { height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, fontSize: 16 },

  footer: { alignItems: 'center', marginTop: 16 },
  footerText: { color: '#A9C1F6', fontSize: 15, textAlign: 'center', marginTop: 2 },
  link: { color: '#FFFFFF', fontWeight: '800' },
});

export default PasswordRecoveryScreen;
