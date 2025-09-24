import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import InCallManager from 'react-native-incall-manager';
import LinearGradient from 'react-native-linear-gradient';

export default function InCallScreen({ peer, onHangup }) {
  const displayName = peer?.name || peer?.number || '상대방';
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const secsRemain = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${secsRemain}`;
  };

  const toggleMute = () => {
    try {
      const newMute = !muted;
      setMuted(newMute);
      InCallManager.setMicrophoneMute(newMute);
    } catch (error) {
      console.error('음소거 오류:', error);
    }
  };

  const toggleSpeaker = () => {
    try {
      const newSpeaker = !speakerOn;
      setSpeakerOn(newSpeaker);
      InCallManager.setSpeakerphoneOn(newSpeaker);
    } catch (error) {
      console.error('스피커 오류:', error);
    }
  };

  // 아바타 이니셜
  const initial = String(displayName).trim().charAt(0) || '·';

  // 퍼지는 링 애니메이션(두 겹)
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    const l1 = loop(pulse1, 0);
    const l2 = loop(pulse2, 600);
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, [pulse1, pulse2]);

  const scale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.33] });
  const opacity1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const scale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] });
  const opacity2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });

  // ===== 배경 블롭 애니메이션 =====
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [blob1, blob2]);

  // Blob1: 좌상단 - 살짝 위/오른쪽 + 맥동
  const b1Scale = blob1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const b1TY = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -12, 0] });
  const b1TX = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 8, 0] });
  const b1Opacity = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.30, 0.42, 0.30] });

  // Blob2: 우하단 - 살짝 아래/왼쪽 + 맥동
  const b2Scale = blob2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const b2TY = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, 0] });
  const b2TX = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });
  const b2Opacity = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.26, 0.36, 0.26] });

  return (
    <LinearGradient
      colors={['#0ea5e9', '#6366f1', '#111827']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* 장식 블롭(배경) - 애니메이션 적용 */}
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
            transform: [{ translateX: b1TX }, { translateY: b1TY }, { scale: b1Scale }],
            opacity: b1Opacity,
          },
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
            transform: [{ translateX: b2TX }, { translateY: b2TY }, { scale: b2Scale }],
            opacity: b2Opacity,
          },
        ]}
      />
      {/* <Animated.View ... 세 번째 블롭도 동일 패턴으로 추가 가능 /> */}

      {/* 중앙 스택: 아바타/링 + 이름/타이머 (순서 교체됨) */}
      <View style={styles.centerStack}>
        {/* 1) 아바타 + 퍼지는 링 (위) */}
        <View style={styles.centerArea}>
          <View style={styles.avatarWrap}>
            <Animated.View
              style={[
                styles.ring,
                { borderColor: 'white', transform: [{ scale: scale1 }], opacity: opacity1 },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                { borderColor: 'white', transform: [{ scale: scale2 }], opacity: opacity2 },
              ]}
            />
            <View style={styles.avatarPlate}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          </View>
        </View>

        {/* 2) 이름/타이머 (아래) */}
        <View style={styles.topArea}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
        </View>
      </View>

      {/* 하단: 버튼 3개 (스피커 • 종료 • 음소거) */}
      <View style={styles.buttonRow}>
        {/* 스피커 */}
        <TouchableOpacity
          style={[styles.circleButton, styles.glassButton, speakerOn && styles.activeButton]}
          onPress={toggleSpeaker}
          activeOpacity={0.9}
        >
          <Icon name="volume-high" size={26} color={speakerOn ? '#26D7AE' : '#E5E7EB'} />
          <Text style={[styles.label, speakerOn && styles.activeLabel]}>스피커</Text>
        </TouchableOpacity>

        {/* 종료 */}
        <TouchableOpacity
          style={[styles.circleButton, styles.hangupButton]}
          onPress={onHangup}
          activeOpacity={0.9}
        >
          <Icon name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        {/* 음소거 */}
        <TouchableOpacity
          style={[styles.circleButton, styles.glassButton, muted && styles.activeButton]}
          onPress={toggleMute}
          activeOpacity={0.9}
        >
          <Icon name={muted ? 'mic-off' : 'mic'} size={26} color={muted ? '#FF4D5E' : '#E5E7EB'} />
          <Text style={[styles.label, muted && styles.activeLabel]}>음소거</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const AVATAR_SIZE = 112;
const RING_SIZE = AVATAR_SIZE + 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 그라데이션 미적용 시 대비용
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // 중앙 스택: 가운데로 모은 상단/중앙 콘텐츠
  centerStack: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // 장식 블롭
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },

  // 아래쪽(텍스트) — 위로부터 간격
  topArea: {
    alignItems: 'center',
    marginTop: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  timer: {
    fontSize: 14,
    color: '#F3F4F6',
    letterSpacing: 0.5,
    marginTop: 6,
  },

  // 중앙(아바타)
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  avatarWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  avatarPlate: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#F3F4F6',
  },

  // 하단 버튼(고정)
  buttonRow: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
  },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  activeButton: {
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  hangupButton: {
    backgroundColor: '#FF4D5E',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  label: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 6,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});