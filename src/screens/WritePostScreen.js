import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, SafeAreaView,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../lib/config';

const PALETTE = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  white: '#FFFFFF',
};

/** ✅ 한글 폰트 이름(파일명이 다르면 여기만 바꾸면 됨) */
const K_FONT = {
  regular: Platform.select({
    ios: 'NotoSansKR-Regular',
    android: 'NotoSansKR-Regular',
    default: 'NotoSansKR-Regular',
  }),
  bold: Platform.select({
    ios: 'NotoSansKR-Bold',
    android: 'NotoSansKR-Bold',
    default: 'NotoSansKR-Bold',
  }),
};

export default function WritePostScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const disabled = useMemo(() => !title.trim() || !text.trim(), [title, text]);

  const onSubmit = async () => {
    if (disabled) {
      Alert.alert('입력 필요', '제목과 내용을 모두 입력해 주세요.');
      return;
    }
    try {
      setSaving(true);
      await api.post('/api/dashboard', { title: title.trim(), contents: text.trim() });
      navigation.goBack();
    } catch (err) {
      Alert.alert('등록 실패', err?.friendlyMessage || '게시글 등록 중 문제가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const TOP_PAD = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 12;

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.g3 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: TOP_PAD, paddingBottom: 120 }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>새 글</Text>

            {/* 화면 크기에 맞춰 크게 차지 */}
            <View style={styles.card}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="제목을 입력하세요"
                placeholderTextColor="rgba(255,255,255,0.65)"
                style={styles.input}
                maxLength={100}
                returnKeyType="next"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect
                // 안드로이드 IME 안정 옵션
                {...(Platform.OS === 'android' ? { textBreakStrategy: 'simple', disableFullscreenUI: true } : {})}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>내용</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="내용을 입력하세요"
                placeholderTextColor="rgba(255,255,255,0.65)"
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect
                // 안드로이드 IME 안정 옵션
                {...(Platform.OS === 'android' ? { textBreakStrategy: 'simple', disableFullscreenUI: true } : {})}
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => navigation.goBack()}
                  disabled={saving}
                >
                  <Text style={styles.btnText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, disabled && { opacity: 0.6 }]}
                  onPress={onSubmit}
                  disabled={saving || disabled}
                >
                  {saving
                    ? <ActivityIndicator color={PALETTE.white} />
                    : <Text style={styles.btnText}>완료</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    color: PALETTE.white,
    fontSize: 28,
    fontWeight: '900',
    alignSelf: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
    fontFamily: K_FONT.bold,                 // ✅ 한글 폰트
    includeFontPadding: false,               // (Android) 텍스트 위아래 여백 줄이기
  },
  card: {
    backgroundColor: 'rgba(16,24,48,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,

    // 화면을 넓게 사용
    minHeight: 480,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 16,
    fontFamily: K_FONT.bold,                 // ✅ 한글 폰트
    includeFontPadding: false,
  },
  input: {
    color: PALETTE.white,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: K_FONT.regular,              // ✅ 한글 폰트
    includeFontPadding: false,
  },
  textarea: {
    height: 300, // 좀 더 넓게
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    backgroundColor: '#4FB2FF',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 13,
  },
  cancelBtn: {
    backgroundColor: '#7B6CF6',
  },
  btnText: {
    color: PALETTE.white,
    fontWeight: '900',
    letterSpacing: 0.2,
    fontFamily: K_FONT.bold,                 // ✅ 한글 폰트
    includeFontPadding: false,
  },
});