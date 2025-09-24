// WarningScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Linking,
  Modal,
  Platform,
} from 'react-native';

export default function WarningScreen({ visible, onClose }) {
  // 애니메이션 값은 useRef로 고정 생성
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([300, 200, 300]);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      // 외부에서 닫힐 때 다음 오픈을 위해 초기화
      opacity.setValue(0);
      translateY.setValue(-60);
    }
  }, [visible, opacity, translateY]);

  const handleClose = () => {
    // 사라짐 애니메이션 후 onClose 호출
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -60, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose?.();
    });
  };

  const contactOptions = [
    { label: '경찰청 피싱수사계 (02-3150-2787)', phone: 'tel:0231502787' },
    { label: '긴급 신고 (112)', phone: 'tel:112' },
    { label: '전기통신금융사기 제보 (1566-1188)', phone: 'tel:15661188' },
  ];

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Failed to open:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose} // Android 백 버튼
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.banner, { transform: [{ translateY }], opacity }]}>
          {/* 닫기(X) 버튼 */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="경고 닫기"
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>⚠️ 딥보이스 의심 전화입니다</Text>

          {contactOptions.map((option, idx) => (
            <TouchableOpacity key={idx} style={styles.button} onPress={() => openLink(option.phone)}>
              <Text style={styles.buttonText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 반투명 오버레이(모달 배경)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingTop: Platform.select({ ios: 48, android: 24 }),
    alignItems: 'center',
  },

  // 경고 배너
  banner: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: '#FF5252',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    position: 'relative',
  },

  // 닫기 버튼
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 5,
    alignSelf: 'stretch',
  },

  buttonText: {
    color: '#FF5252',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});