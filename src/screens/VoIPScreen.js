// Dialer.js
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Vibration,
  Platform,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const KEY_SIZE = Math.min(86, Math.max(72, SCREEN_W * 0.24)); // 화면에 맞춘 유동 크기

const KEYS = [
  { k: '1', letters: '' },
  { k: '2', letters: 'ABC' },
  { k: '3', letters: 'DEF' },
  { k: '4', letters: 'GHI' },
  { k: '5', letters: 'JKL' },
  { k: '6', letters: 'MNO' },
  { k: '7', letters: 'PQRS' },
  { k: '8', letters: 'TUV' },
  { k: '9', letters: 'WXYZ' },
  { k: '*', letters: ' ' },
  { k: '0', letters: '+' }, // 길게 누르면 + 입력
  { k: '#', letters: ' ' },
];

// 한국 번호 포맷터
function formatPhoneNumber(number) {
  const onlyNumber = String(number).replace(/[^0-9]/g, '');
  if (onlyNumber.length === 11 && onlyNumber.startsWith('01')) {
    return onlyNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 10 && onlyNumber.startsWith('02')) {
    return onlyNumber.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 10) {
    return onlyNumber.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 9) {
    return onlyNumber.replace(/(\d{2,3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return onlyNumber;
}

// 화면 표시용 마스크(숫자만 대상, 3-4-4)
function formatMask000_0000_0000(digits) {
  const nums = digits.replace(/\D/g, '');
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return nums.slice(0, 3) + '-' + nums.slice(3);
  return nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7, 11);
}

// 테마 토큰(배경은 CallScreen 고정값 사용)
const getThemeTokens = (isLight) => ({
  safeBg: isLight ? '#000' : '#000', // 그라데이션 아래쪽 베이스(보이지 않음)
  cardBg: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.08)',
  border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)',
  text: isLight ? '#111827' : '#FFFFFF',
  placeholder: isLight ? '#6B7280' : '#9CA3AF',
  keyBg: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)',
  ripple: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)',
});

const CALL_BG_COLORS = ['#0ea5e9', '#6366f1', '#111827']; // CallScreen과 동일
const ANIMATE_BLOBS = true; // 애니메이션 끄고 싶으면 false

const getStyles = (t) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.safeBg,
    },
    screen: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 440,
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        android: {
          elevation: 0.1,
        },
      }),
    },
    display: {
      position: 'relative',
      minHeight: 64,
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 56,
      paddingLeft: 16,
      marginBottom: 8,
    },
    displayText: {
      color: t.text,
      fontSize: 28,
      letterSpacing: 1.1,
      textAlign: 'center',
    },
    placeholder: {
      color: t.placeholder,
      opacity: 0.8,
    },
    iconBtn: {
      position: 'absolute',
      right: 8,
      top: '50%',
      marginTop: -22,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.keyBg,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconBtnPressed: {
      transform: [{ scale: 0.97 }],
    },
    iconText: {
      color: '#FCA5A5',
      fontSize: 20,
    },
    keys: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 14,
      paddingHorizontal: 12,
      paddingTop: 6,
    },
    key: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.keyBg,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden', // 안드로이드 리플 클리핑
    },
    keyPressed: {
      transform: [{ scale: 0.97 }],
    },
    digit: {
      color: t.text,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 28,
    },
    letters: {
      color: t.text,
      opacity: 0.6,
      fontSize: 11,
      letterSpacing: 1.4,
      marginTop: 6,
    },
    bottom: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    callBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    callBtnGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 36,
    },
    callBtnPressed: {
      transform: [{ scale: 0.96 }],
      opacity: 0.95,
    },
    callIcon: {
      fontSize: 24,
      color: '#fff',
    },

    // CallScreen 배경 블롭
    blob: {
      position: 'absolute',
      borderRadius: 999,
    },
  });

export default function Dialer({ onStartCall }) {
  const { isLightMode } = useTheme();
  const t = useMemo(() => getThemeTokens(isLightMode), [isLightMode]);
  const styles = useMemo(() => getStyles(t), [t]);

  // 입력 상태
  const [value, setValue] = useState('');

  // 화면 표기 값
  const displayValue = useMemo(() => {
    if (/^\d+$/.test(value)) return formatMask000_0000_0000(value);
    return value || '';
  }, [value]);

  const append = useCallback((ch) => {
    setValue((v) => v + ch);
    Vibration.vibrate(10);
  }, []);
  const backspace = useCallback(() => {
    setValue((v) => (v ? v.slice(0, -1) : v));
    Vibration.vibrate(8);
  }, []);
  const clearAll = useCallback(() => {
    setValue('');
    Vibration.vibrate([10, 20, 60]);
  }, []);

  // 통화 실행
  const onCall = useCallback(async () => {
    if (!value) return;
    if (typeof onStartCall === 'function') {
      const formattedNumber = formatPhoneNumber(value);
      if (formattedNumber) {
        try {
          onStartCall(formattedNumber, { name: '' });
        } catch (e) {
          console.warn('onStartCall failed:', e);
        }
      }
      return;
    }
    const tel = value.replace(/[^\d+#*]/g, '');
    const url = `tel:${tel}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (e) {
      console.warn('Failed to open dialer:', e);
    }
  }, [value, onStartCall]);

  // ===== CallScreen과 동일한 블롭 애니메이션 =====
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ANIMATE_BLOBS) return;

    const loopFloat = (val, duration = 3800, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = loopFloat(blob1, 3800, 0);
    const a2 = loopFloat(blob2, 4400, 300);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [blob1, blob2]);

  const b1Scale = blob1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const b1TY = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -12, 0] });
  const b1TX = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 8, 0] });
  const b1Opacity = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.30, 0.42, 0.30] });

  const b2Scale = blob2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const b2TY = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, 0] });
  const b2TX = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });
  const b2Opacity = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.26, 0.36, 0.26] });

  // 애니메이션을 끄면 초기 상태로 고정
  const blob1Style = ANIMATE_BLOBS
    ? { transform: [{ translateX: b1TX }, { translateY: b1TY }, { scale: b1Scale }], opacity: b1Opacity }
    : { opacity: 0.35 };
  const blob2Style = ANIMATE_BLOBS
    ? { transform: [{ translateX: b2TX }, { translateY: b2TY }, { scale: b2Scale }], opacity: b2Opacity }
    : { opacity: 0.30 };

  return (
    <SafeAreaView style={styles.safe}>
      {/* CallScreen 그라데이션 배경 */}
      <LinearGradient
        colors={CALL_BG_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* CallScreen 배경 블롭 2개 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            top: 120,
            left: -40,
            width: 220,
            height: 220,
            backgroundColor: 'rgba(34,211,238,0.35)',
          },
          blob1Style,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            bottom: 140,
            right: -60,
            width: 280,
            height: 280,
            backgroundColor: 'rgba(167,139,250,0.30)',
          },
          blob2Style,
        ]}
      />

      <View style={styles.screen}>
        {/* 카드(Blur 없음) */}
        <View style={styles.card}>
          {/* 표시창 */}
          <View style={styles.display}>
            <Text
              style={[styles.displayText, !value && styles.placeholder]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {displayValue}
            </Text>

            {/* 백스페이스(짧게: 1글자 삭제 / 길게: 전체 삭제) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="지우기"
              hitSlop={10}
              onPress={backspace}
              onLongPress={clearAll}
              delayLongPress={600}
              android_ripple={{ color: t.ripple, borderless: true }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Text style={styles.iconText}>⌫</Text>
            </Pressable>
          </View>

          {/* 키패드 3x4 */}
          <View style={styles.keys}>
            {KEYS.map(({ k, letters }) => {
              const isZero = k === '0';
              return (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  accessibilityLabel={`${k}${letters ? ' ' + letters : ''}`}
                  onPress={() => append(k)}
                  onLongPress={() => isZero && append('+')}
                  delayLongPress={450}
                  android_ripple={{ color: t.ripple, borderless: true }}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && styles.keyPressed,
                    { width: KEY_SIZE, height: KEY_SIZE, borderRadius: KEY_SIZE / 2 },
                  ]}
                >
                  <Text style={styles.digit}>{k}</Text>
                  {letters ? <Text style={styles.letters}>{letters}</Text> : null}
                </Pressable>
              );
            })}
          </View>

          {/* 통화 버튼(그라데이션 유지) */}
          <View style={styles.bottom}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="전화 걸기"
              onPress={onCall}
              android_ripple={{ color: t.ripple, borderless: true }}
              style={({ pressed }) => [styles.callBtn, pressed && styles.callBtnPressed]}
            >
              <LinearGradient colors={['#34D399', '#10B981']} style={styles.callBtnGradient} />
              <Text style={styles.callIcon}>📞</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}