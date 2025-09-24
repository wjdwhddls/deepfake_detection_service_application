import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  callState?: 'outgoing' | 'incoming' | 'connecting' | 'active';
  peer?: { name: string; number: string };
  onAccept?: () => void;
  onReject?: () => void;
  onHangup?: () => void;
  remoteStreamExists?: boolean;
  isInvalidNumber?: boolean;
  isRejected?: boolean;
};

export default function CallScreen({
  callState = 'outgoing',
  peer = { name: 'Unknown', number: '' },
  onAccept,
  onReject,
  onHangup,
  remoteStreamExists = false,
  isInvalidNumber = false,
  isRejected = false,
}: Props) {
  // 상태 텍스트
  const stateText = useMemo(() => {
    if (isInvalidNumber) return '없는 번호입니다';
    if (isRejected) return '상대방이 전화를 거절했습니다';
    if (callState === 'outgoing') return '전화 거는 중...';
    if (callState === 'incoming') return '전화가 왔습니다';
    if (callState === 'connecting') return '연결 중...';
    if (callState === 'active') return '통화 중';
    return '';
  }, [callState, isInvalidNumber, isRejected]);

  // 아바타 이니셜
  const initial =
    peer?.name && peer.name !== 'Unknown' ? String(peer.name).trim().charAt(0) : '·';

  // 퍼지는 링 애니메이션(두 겹)
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (val: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = makeLoop(pulse1, 0);
    const l2 = makeLoop(pulse2, 600);
    l1.start();
    l2.start();
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [pulse1, pulse2]);

  const scale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.33] });
  const opacity1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const scale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const opacity2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });

  // ===== 배경 원(Blob) 애니메이션 =====
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopFloat = (val: Animated.Value, duration = 3800, delay = 0) =>
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

  // Blob1: 왼쪽 상단 블롭 - 약간 위로/오른쪽으로, 조금 더 큰 맥동
  const b1Scale = blob1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const b1TY = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -12, 0] });
  const b1TX = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 8, 0] });
  const b1Opacity = blob1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.30, 0.42, 0.30] });

  // Blob2: 오른쪽 하단 블롭 - 약간 아래로/왼쪽으로, 조금 더 느린 맥동
  const b2Scale = blob2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const b2TY = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, 0] });
  const b2TX = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });
  const b2Opacity = blob2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.26, 0.36, 0.26] });

  // 버튼 렌더링(기능 로직은 그대로 유지)
  let buttons: React.ReactNode = null;
  if (isInvalidNumber || isRejected) {
    buttons = (
      <TouchableOpacity
        style={[styles.circleButton, styles.rejectButton]}
        onPress={onReject}
        activeOpacity={0.9}
      >
        <Icon name="close" size={28} color="#fff" />
      </TouchableOpacity>
    );
  } else if (callState === 'incoming') {
    buttons = (
      <>
        <TouchableOpacity
          style={[styles.circleButton, styles.acceptButton]}
          onPress={onAccept}
          activeOpacity={0.9}
        >
          <Icon name="call" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.circleButton, styles.rejectButton]}
          onPress={onReject}
          activeOpacity={0.9}
        >
          <Icon name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </>
    );
  } else if (callState === 'outgoing') {
    buttons = (
      <TouchableOpacity
        style={[styles.circleButton, styles.rejectButton]}
        onPress={onReject}
        activeOpacity={0.9}
      >
        <Icon name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    );
  } else if (callState === 'connecting' || callState === 'active') {
    buttons = (
      <TouchableOpacity
        style={[styles.circleButton, styles.rejectButton]}
        onPress={onHangup}
        activeOpacity={0.9}
      >
        <Icon name="close" size={28} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* 그라데이션 배경 */}
      <LinearGradient
        colors={['#0ea5e9', '#6366f1', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* 애니메이션 블롭 (pointerEvents="none"으로 터치 간섭 방지) */}
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
        {/* 필요하면 세 번째 블롭도 동일 패턴으로 추가 가능 */}

        {/* 중심 콘텐츠 */}
        <View style={styles.centerArea}>
          {/* 상단 상태 텍스트 */}
          <Text style={styles.timerText}>{stateText}</Text>

          {/* 아바타 + 퍼지는 링 */}
          <View style={styles.avatarWrap}>
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: scale1 }],
                  opacity: opacity1,
                  borderColor: '#FFFFFF',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: scale2 }],
                  opacity: opacity2,
                  borderColor: '#FFFFFF',
                },
              ]}
            />

              {/* 아바타 백플레이트 */}
            <View style={styles.avatarPlate}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          </View>

          {/* 이름/번호 */}
          {peer.name !== 'Unknown' && <Text style={styles.name}>{peer.name}</Text>}
          {!!peer.number && <Text style={styles.number}>{peer.number}</Text>}

          {/* 연결 알림 */}
          {callState === 'active' && (
            <Text style={styles.connectedNote}>상대방 음성이 연결되었습니다</Text>
          )}
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonRow}>{buttons}</View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 112;
const RING_SIZE = AVATAR_SIZE + 20; // 링 기본 지름

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },

  // 장식 블롭
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },

  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // 상단(상태/타이머 역할)
  timerText: {
    fontSize: 14,
    color: '#F3F4F6',
    letterSpacing: 0.5,
    marginBottom: 18,
  },

  // 아바타 + 링
  avatarWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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

  // 이름/번호/상태
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 8,
  },
  number: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 6,
  },
  connectedNote: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 18,
  },

  // 버튼
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
  },
  circleButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  acceptButton: {
    backgroundColor: '#26D7AE', // 트렌드 그린
  },
  rejectButton: {
    backgroundColor: '#FF4D5E', // 트렌드 레드
  },
});