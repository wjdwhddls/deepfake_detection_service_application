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
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

// 유틸
const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

// 그리드 상수
const KEYS_GAP = 14;           // 키 간 간격(열/행 간)
const CARD_SIDE_PADDING = 12;  // 카드 좌우 패딩
const COLS = 3;
const ROWS = 4;

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
  { k: '*', letters: '' },
  { k: '0', letters: '+' }, // 길게 누르면 + 입력
  { k: '#', letters: '' },
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
  safeBg: isLight ? '#000' : '#000',
  cardBg: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.08)',
  border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)',
  text: isLight ? '#111827' : '#FFFFFF',
  placeholder: isLight ? '#6B7280' : '#9CA3AF',
  keyBg: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)',
  ripple: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)',
});

const CALL_BG_COLORS = ['#0ea5e9', '#6366f1', '#111827'];
const ANIMATE_BLOBS = true;

const getStyles = (t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.safeBg },
    screen: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      // width는 런타임에서 주입(반응형)
      paddingVertical: 16,
      paddingHorizontal: CARD_SIDE_PADDING,
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
        android: { elevation: 0.1 },
      }),
    },
    display: {
      position: 'relative',
      // minHeight는 동적으로 주입
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 56, // 아이콘 버튼 영역 확보
      paddingLeft: 16,
      marginBottom: 8,
    },
    displayText: {
      color: t.text,
      // fontSize는 동적으로 주입
      letterSpacing: 1.1,
      textAlign: 'center',
    },
    placeholder: { color: t.placeholder, opacity: 0.8 },
    iconBtn: {
      position: 'absolute',
      right: 8,
      top: '50%',
      // width/height/borderRadius/marginTop은 동적으로 주입
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.keyBg,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconBtnPressed: { transform: [{ scale: 0.97 }] },
    iconText: { color: '#FCA5A5' /* fontSize는 동적으로 주입 */ },
    keys: {
      alignSelf: 'center',
      paddingTop: 6,
    },
    row: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    key: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.keyBg,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden', // 안드로이드 리플 클리핑
    },
    keyPressed: { transform: [{ scale: 0.97 }] },
    digit: { color: t.text /* fontSize는 동적으로 주입 */, fontWeight: '700', lineHeight: undefined },
    letters: { color: t.text, opacity: 0.6 /* fontSize는 동적으로 주입 */, letterSpacing: 1.4, marginTop: 6 },
    bottom: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    callBtn: {
      // 크기는 런타임에서 주입(반응형)
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 36,
      overflow: 'hidden',
    },
    callBtnGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 36 },
    callBtnPressed: { transform: [{ scale: 0.96 }], opacity: 0.95 },
    callIcon: { color: '#fff' /* fontSize는 동적으로 주입 */ },
    blob: { position: 'absolute', borderRadius: 999 },
  });

export default function Dialer({ onStartCall }) {
  const { isLightMode } = useTheme();
  const t = useMemo(() => getThemeTokens(isLightMode), [isLightMode]);
  const styles = useMemo(() => getStyles(t), [t]);

  // 창 크기 기반 반응형 치수
  const { width: W, height: H } = useWindowDimensions();
  const shortest = Math.min(W, H);
  const isTablet = shortest >= 600;
  const AR = H / W; // 화면 비율(>1: 세로로 김)

  // 카드 너비: 폰은 최대 440, 태블릿은 최대 640. 화면 여백 32 유지.
  const CARD_W = useMemo(() => {
    const margin = 32;
    const maxW = isTablet ? 640 : 440;
    return Math.min(maxW, W - margin);
  }, [W, isTablet]);

  // 키 크기 계산(가로/세로 제약 모두 고려)
  const KEY_SIZE = useMemo(() => {
    // 가로 제한: 카드 내부 3열 + 2 간격이 딱 맞게
    const innerW = CARD_W - CARD_SIDE_PADDING * 2;
    const keyW = Math.floor((innerW - 2 * KEYS_GAP) / 3);

    // 세로 제한: 화면 높이의 일정 비율 내에서 4행 + 3 간격이 들어가도록
    // 세로가 긴(AR↑) 기기에는 조금 더 크게, 짧은(AR↓) 기기에는 조금 작게 배분
    const gridShare = clamp(0.40 + (AR - 1.7) * 0.06, 0.34, isTablet ? 0.52 : 0.46);
    const targetGridH = H * gridShare;
    const keyH = Math.floor((targetGridH - (ROWS - 1) * KEYS_GAP) / ROWS);

    // 상한/하한
    const upper = isTablet ? 110 : 92;
    const lower = 48; // 너무 작아지지 않도록 가독 하한
    return clamp(Math.min(keyW, keyH), lower, upper);
  }, [CARD_W, H, AR, isTablet]);

  // 키 그리드 총 너비(정확히 3개 + 2개 간격)
  const KEY_GRID_W = useMemo(() => KEY_SIZE * 3 + KEYS_GAP * 2, [KEY_SIZE]);

  // 통화 버튼(키 크기에 비례)
  const CALL_BTN_SIZE = Math.round(clamp(KEY_SIZE * 0.85, 42, isTablet ? 88 : 78));

  // 표시창/아이콘/폰트 동적 스케일
  const DISPLAY_MIN_H = Math.round(clamp(KEY_SIZE * 1.0, 56, 96));
  const DISPLAY_FS = Math.round(clamp(KEY_SIZE * 0.46, 22, 34));
  const ICON_BTN_SIZE = Math.round(clamp(KEY_SIZE * 0.66, 36, 54));
  const ICON_FS = Math.round(clamp(KEY_SIZE * 0.28, 18, 22));
  const DIGIT_FS = Math.round(clamp(KEY_SIZE * 0.38, 20, 32));
  const LETTER_FS = Math.round(clamp(KEY_SIZE * 0.16, 9, 13));
  const CALL_ICON_FS = Math.round(clamp(KEY_SIZE * 0.30, 20, 28));

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

  const blob1Style = ANIMATE_BLOBS
    ? { transform: [{ translateX: b1TX }, { translateY: b1TY }, { scale: b1Scale }], opacity: b1Opacity }
    : { opacity: 0.35 };
  const blob2Style = ANIMATE_BLOBS
    ? { transform: [{ translateX: b2TX }, { translateY: b2TY }, { scale: b2Scale }], opacity: b2Opacity }
    : { opacity: 0.30 };

  // 3×4 행 구성
  const rows = useMemo(() => {
    const out = [];
    for (let r = 0; r < ROWS; r++) {
      out.push(KEYS.slice(r * COLS, r * COLS + COLS));
    }
    return out;
  }, []);

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
          { top: 120, left: -40, width: 220, height: 220, backgroundColor: 'rgba(34,211,238,0.35)' },
          blob1Style,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          { bottom: 140, right: -60, width: 280, height: 280, backgroundColor: 'rgba(167,139,250,0.30)' },
          blob2Style,
        ]}
      />

      <View style={styles.screen}>
        {/* 카드(반응형 너비 적용) */}
        <View style={[styles.card, { width: CARD_W }]}>
          {/* 표시창 */}
          <View style={[styles.display, { minHeight: DISPLAY_MIN_H }]}>
            <Text
              style={[styles.displayText, { fontSize: DISPLAY_FS }, !value && styles.placeholder]}
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
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
                {
                  width: ICON_BTN_SIZE,
                  height: ICON_BTN_SIZE,
                  borderRadius: ICON_BTN_SIZE / 2,
                  marginTop: -ICON_BTN_SIZE / 2, // 수직 중앙 정렬
                },
              ]}
            >
              <Text style={[styles.iconText, { fontSize: ICON_FS }]}>⌫</Text>
            </Pressable>
          </View>

          {/* 키패드 3x4 — 고정 레이아웃, 동적 스케일 */}
          <View style={[styles.keys, { width: KEY_GRID_W }]}>
            {rows.map((rowKeys, rIdx) => (
              <View
                key={`row-${rIdx}`}
                style={[
                  styles.row,
                  {
                    width: KEY_GRID_W,
                    marginBottom: rIdx === ROWS - 1 ? 0 : KEYS_GAP,
                  },
                ]}
              >
                {rowKeys.map(({ k, letters }, cIdx) => {
                  const isZero = k === '0';
                  const isLastCol = cIdx === COLS - 1;
                  const hasLetters = typeof letters === 'string' && letters.trim().length > 0;

                  return (
                    <Pressable
                      key={k}
                      accessibilityRole="button"
                      accessibilityLabel={`${k}${hasLetters ? ' ' + letters : ''}`}
                      onPress={() => append(k)}
                      onLongPress={() => isZero && append('+')}
                      delayLongPress={450}
                      android_ripple={{ color: t.ripple, borderless: true }}
                      style={({ pressed }) => [
                        styles.key,
                        pressed && styles.keyPressed,
                        {
                          width: KEY_SIZE,
                          height: KEY_SIZE,
                          borderRadius: KEY_SIZE / 2,
                          marginRight: isLastCol ? 0 : KEYS_GAP,
                        },
                      ]}
                    >
                      <Text style={[styles.digit, { fontSize: DIGIT_FS, lineHeight: DIGIT_FS + 2 }]}>{k}</Text>
                      {hasLetters ? <Text style={[styles.letters, { fontSize: LETTER_FS }]}>{letters}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* 통화 버튼(키 크기에 맞춰 반응형) */}
          <View style={styles.bottom}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="전화 걸기"
              onPress={onCall}
              android_ripple={{ color: t.ripple, borderless: true }}
              style={({ pressed }) => [
                styles.callBtn,
                { width: CALL_BTN_SIZE, height: CALL_BTN_SIZE, borderRadius: CALL_BTN_SIZE / 2 },
                pressed && styles.callBtnPressed,
              ]}
            >
              <LinearGradient
                colors={['#34D399', '#10B981']}
                style={[styles.callBtnGradient, { borderRadius: CALL_BTN_SIZE / 2 }]}
              />
              <Text style={[styles.callIcon, { fontSize: CALL_ICON_FS }]}>📞</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}