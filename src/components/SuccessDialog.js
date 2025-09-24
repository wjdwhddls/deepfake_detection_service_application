import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const C = { white:'#FFFFFF' };

export default function SuccessDialog({
  visible,
  title = '로그인 성공',
  message = '환영합니다!',
  okText = '확인',
  onClose,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} presentationStyle="overFullScreen">
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* 라이트 배경용 블롭 */}
          <View style={[s.blob, s.blobLT]} />
          <View style={[s.blob, s.blobRB]} />

          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <TouchableOpacity style={s.cta} activeOpacity={0.9} onPress={onClose}>
            <LinearGradient colors={['#0AA7F6','#2E7BFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.ctaInner}>
              <Text style={s.ctaText}>{okText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    // 🔹 배경 어둡게 제거
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    // 기존 다크카드 대신 살짝 투명한 라이트 카드 느낌
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  blob: { position: 'absolute', borderRadius: 9999 },
  blobLT: { width: 200, height: 200, top: -60, left: -40, backgroundColor: 'rgba(32,178,243,0.10)' },
  blobRB: { width: 240, height: 240, bottom: -80, right: -70, backgroundColor: 'rgba(94,115,247,0.10)' },

  title: { color: '#0F1730', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  message: { color: '#2B3A59', fontSize: 16, marginBottom: 18 },
  cta: { alignSelf: 'flex-end', borderRadius: 14, overflow: 'hidden' },
  ctaInner: { paddingVertical: 12, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: C.white, fontWeight: '900', letterSpacing: 0.5, fontSize: 15 },
});
