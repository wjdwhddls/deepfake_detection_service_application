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
  blobLT: 'rgba(255,255,255,0.18)',
  blobRB: 'rgba(0,0,0,0.18)',
  white: '#FFFFFF',
};

const { width: W, height: H } = Dimensions.get('window');
const MAX = Math.max(W, H);

// 🔄 블롭 크기/위치만 변경
const BLOB_LT_SIZE = MAX * 0.72;  // (이전: 0.9) 조금 더 작게
const BLOB_RB_SIZE = MAX * 1.10;  // (이전: 0.85) 더 크게

const PasswordChangeScreen = ({ navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🔒 기존 로직 유지
  const handleSubmit = () => {
    if (newPassword === confirmPassword) {
      Alert.alert('성공', '비밀번호가 변경되었습니다.');
      navigation.navigate('Login');
    } else {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
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
      {/* 블롭 2개 (크기/위치만 변경) */}
      <View style={[styles.blob, styles.blobLT]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobRB]} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>새로운 비밀번호를 입력해 주세요.</Text>

          {/* 입력 pill */}
          <View style={styles.inputPill}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새로운 비밀번호"
              placeholderTextColor="#8FB2E8"
              secureTextEntry
              style={styles.inputText}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputPill}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호를 다시 입력해 주세요"
              placeholderTextColor="#8FB2E8"
              secureTextEntry
              style={styles.inputText}
              returnKeyType="done"
            />
          </View>

          {/* 확인 버튼: 그라디언트 */}
          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleSubmit}>
            <LinearGradient
              colors={['#0AA7F6', '#2E7BFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaInner}
            >
              <Text style={styles.ctaText}>확인</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ====================== styles ====================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1430' },

  // 블롭 공통
  blob: { position: 'absolute', borderRadius: 9999 },

  // ⬆️ 좌상단: 더 작고 위쪽으로, 왼쪽은 조금 더 빼서 포커스 상승
  blobLT: {
    width: BLOB_LT_SIZE,
    height: BLOB_LT_SIZE,
    top: -BLOB_LT_SIZE * 0.35,     // (이전: 0.25) 더 위로
    left: -BLOB_LT_SIZE * 0.28,    // (이전: 0.15) 더 바깥쪽
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ⬇️ 우하단: 더 크게, 오른쪽/아래로 더 빼서 깊이감
  blobRB: {
    width: BLOB_RB_SIZE,
    height: BLOB_RB_SIZE,
    right: -BLOB_RB_SIZE * 0.38,   // (이전: 0.2) 더 바깥쪽
    bottom: -BLOB_RB_SIZE * 0.22,  // (이전: 0.25) 살짝 위로
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },

  lockIcon: { fontSize: 60, marginBottom: 12, textAlign: 'center' },
  title: {
    fontSize: 20,
    color: C.white,
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '900',
  },

  // 입력 pill
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
  inputText: {
    color: '#F2F7FF',
    fontSize: 16.5,
  },

  // CTA 버튼
  cta: {
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

export default PasswordChangeScreen;
