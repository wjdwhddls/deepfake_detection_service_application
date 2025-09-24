// App.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, NativeModules, NativeEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import io from 'socket.io-client';

import { checkPermissions } from './src/services/PhoneService';
import HomeScreen from './src/screens/HomeScreen';
import DashBoardScreen from './src/screens/DashBoardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import InfoScreen from './src/screens/InfoScreen';
import FAQScreen from './src/screens/FAQScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import PasswordRecoveryScreen from './src/screens/PasswordRecoveryScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import LogoutScreen from './src/screens/LogoutScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ResultScreen from './src/screens/ResultScreen';
import VoIPScreen from './src/screens/VoIPScreen';
import CallScreen from './src/screens/CallScreen';
import InCallScreen from './src/screens/InCallScreen';
import WarningScreen from './src/screens/WarningScreen';
import useVoIPConnection from './src/services/useVoIPConnection';

const { DeepfakeDetector } = NativeModules || {};
const deepfakeEvents = DeepfakeDetector ? new NativeEventEmitter(DeepfakeDetector) : null;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashBoardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashBoardMain" component={DashBoardScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
  </Stack.Navigator>
);

const ProfileStack = ({ setIsLoggedIn }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain">
      {props => <ProfileScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    <Stack.Screen name="Info" component={InfoScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="Logout" component={LogoutScreen} />
  </Stack.Navigator>
);

const DetectStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DetectMain" component={HomeScreen} />
    <Stack.Screen name="DetectDetail" component={ResultScreen} />
  </Stack.Navigator>
);

const VoIPStack = ({ socket, userPhoneNumber, onStartCall }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VoIPScreen">
      {props => (
        <VoIPScreen
          {...props}
          socket={socket}
          userPhoneNumber={userPhoneNumber}
          onStartCall={onStartCall}
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

const MainTabNavigator = ({ socket, userPhoneNumber, setIsLoggedIn, onStartCall }) => {
  const { isLightMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'VoIP') iconName = focused ? 'call' : 'call-outline';
          else if (route.name === 'DashBoard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isLightMode ? '#007AFF' : '#FFCC00',
        tabBarInactiveTintColor: isLightMode ? '#8e8e93' : '#BBBBBB',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DetectStack} />
      <Tab.Screen name="VoIP">
        {() => <VoIPStack socket={socket} userPhoneNumber={userPhoneNumber} onStartCall={onStartCall} />}
      </Tab.Screen>
      <Tab.Screen name="DashBoard" component={DashBoardStack} />
      <Tab.Screen name="Profile">
        {() => <ProfileStack setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const AuthStack = ({ setIsLoggedIn, onLoginSuccess }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {props => (
        <LoginScreen
          {...props}
          setIsLoggedIn={setIsLoggedIn}
          onLoginSuccess={onLoginSuccess}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
    <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
  </Stack.Navigator>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);
  const [callState, setCallState] = useState('idle'); // 'idle' | 'incoming' | 'outgoing' | 'active' | 'ended'
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callPeer, setCallPeer] = useState({ name: '', number: '' });
  const [remoteStreamExists, setRemoteStreamExists] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remoteAudioTrackId, setRemoteAudioTrackId] = useState(null);

  // 연속 판정/지연용 ref
  const fakeStreakRef = useRef(0);
  const realStreakRef = useRef(0);
  const warningDelayRef = useRef(null);

  useEffect(() => { checkPermissions(); }, []);

  // 모델 1회 로드
  useEffect(() => {
    (async () => {
      try {
        if (DeepfakeDetector?.initModel) {
          await DeepfakeDetector.initModel();
          console.log('[App] Deepfake model initialized');
        } else {
          console.log('[App] DeepfakeDetector native module not found');
        }
      } catch (e) {
        console.warn('[App] Deepfake model init failed:', e?.message || e);
      }
    })();
  }, []);

  // DeepfakeVerdict 이벤트로 경고 제어 (연속 판정 기반)
  useEffect(() => {
    if (!deepfakeEvents) return;

    const onVerdict = (p) => {
      // p: { prob_real, decision: 'real'|'fake', windowMs, timestamp }
      if (!callModalVisible || callState !== 'active' || isCaller) return; // 수신자 + 통화중

      if (p.decision === 'fake') {
        fakeStreakRef.current += 1;
        realStreakRef.current = 0;

        // 첫 fake 즉시 알림 원하면 아래 주석 해제하여 지연 표시
        // if (!showWarning && !warningDelayRef.current) {
        //   warningDelayRef.current = setTimeout(() => {
        //     setShowWarning(true);
        //     warningDelayRef.current = null;
        //   }, 1000);
        // }

        if (fakeStreakRef.current >= 2) { // 2회 연속 fake → 경고 ON
          setShowWarning(true);
        }
      } else {
        realStreakRef.current += 1;
        fakeStreakRef.current = 0;

        // 3회 연속 real → 경고 OFF (히스테리시스)
        if (realStreakRef.current >= 3 && showWarning) {
          setShowWarning(false);
        }

        if (warningDelayRef.current) {
          clearTimeout(warningDelayRef.current);
          warningDelayRef.current = null;
        }
      }
    };

    const sub = deepfakeEvents.addListener('DeepfakeVerdict', onVerdict);
    return () => {
      sub.remove();
      if (warningDelayRef.current) {
        clearTimeout(warningDelayRef.current);
        warningDelayRef.current = null;
      }
    };
  }, [callModalVisible, callState, isCaller, showWarning]);

  const resetVerdictState = () => {
    fakeStreakRef.current = 0;
    realStreakRef.current = 0;
    if (warningDelayRef.current) {
      clearTimeout(warningDelayRef.current);
      warningDelayRef.current = null;
    }
  };

  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);

    const webSocket = io('http://10.0.2.2:3000');
    webSocket.on('connect', () => {
      console.log('[Socket] Connected');
      webSocket.emit('register-user', { phoneNumber });
    });
    webSocket.on('call', ({ from, number, name }) => {
      console.log('[Socket] Received call from:', from);
      setRemotePeerId(from);
      setCallPeer({ name, number });
      setCallState('incoming');
      setCallModalVisible(true);
      setIsCaller(false);
    });
    webSocket.on('call-ack', ({ toSocketId }) => {
      console.log('[Socket] Received call-ack with toSocketId:', toSocketId);
      setRemotePeerId(toSocketId);
    });
    webSocket.on('call-ended', () => {
      handleRejectOrHangup();
    });
    setSocket(webSocket);

    // 로그인 직후 1회: 플레이백 캡처 권한 요청 (Android 10+)
    (async () => {
      try {
        await DeepfakeDetector?.requestPlaybackCapture?.();
        console.log('[Deepfake] playback capture granted (or ignored on unsupported devices)');
      } catch (e) {
        console.warn('[Deepfake] capture request failed:', e?.message || e);
      }
    })();
  };

  // 로그아웃/세션종료 시 정리
  useEffect(() => {
    if (!isLoggedIn && socket) {
      socket.disconnect();
      setSocket(null);
      setUserPhoneNumber(null);
      setRemotePeerId(null);
      setIsCaller(false);
      setCallState('idle');
      setCallModalVisible(false);
      setCallPeer({ name: '', number: '' });
      setRemoteStreamExists(false);
      setRemoteAudioTrackId(null);
      setShowWarning(false);
      resetVerdictState();
      try { DeepfakeDetector?.stopStreamMonitor?.(); } catch {}
    }
  }, [isLoggedIn]);

  const handleStartCall = (targetPhoneNumber, peerInfo) => {
    setCallPeer(peerInfo);
    setCallState('outgoing');
    setCallModalVisible(true);
    setIsCaller(true);

    if (socket?.connected && userPhoneNumber && targetPhoneNumber) {
      console.log('[Socket] Emitting call to:', targetPhoneNumber);
      socket.emit('call', {
        to: targetPhoneNumber,
        from: userPhoneNumber,
        number: userPhoneNumber,
        name: userPhoneNumber,
      });
    }
  };

  const handleRejectOrHangup = () => {
    if (socket && remotePeerId) {
      socket.emit('hangup', { to: remotePeerId, from: userPhoneNumber });
    }
    setCallState('ended');
    setCallModalVisible(false);
    setRemotePeerId(null);
    setIsCaller(false);
    setCallPeer({ name: '', number: '' });
    setRemoteStreamExists(false);
    setRemoteAudioTrackId(null);
    setShowWarning(false);
    resetVerdictState();
    try { DeepfakeDetector?.stopStreamMonitor?.(); } catch (e) {
      console.warn('[App] stopStreamMonitor error:', e?.message || e);
    }
  };

  // WebRTC 연결 훅
  const { acceptCall } = useVoIPConnection({
    enabled: callModalVisible && !!remotePeerId && (isCaller || callState === 'active'),
    remotePeerId,
    socket,
    isCaller,
    onRemoteStream: (stream) => {
      if (stream) {
        console.log('[VoIP] Remote stream received');
        setRemoteStreamExists(true);
        setCallState('active');
        const audioTrack = stream.getAudioTracks?.()[0];
        if (audioTrack?.id) {
          setRemoteAudioTrackId(audioTrack.id);
          console.log('[VoIP] Remote audio track id:', audioTrack.id);
        } else {
          setRemoteAudioTrackId(null);
        }
      }
    },
    onHangup: handleRejectOrHangup,
  });

  const handleAccept = () => {
    console.log('[App] Accept button pressed');
    setCallState('active');
    acceptCall();
  };

  // 통화 active + 원격 트랙 확보되면 실시간 모니터 시작/정지 (App.js에서만 관리)
  useEffect(() => {
    const canStart =
      callState === 'active' &&
      callModalVisible &&
      remoteAudioTrackId &&
      DeepfakeDetector?.startStreamMonitor;

    if (canStart) {
      (async () => {
        try {
          console.log('[App] startStreamMonitor:', remoteAudioTrackId);
          await DeepfakeDetector.startStreamMonitor(remoteAudioTrackId, { windowMs: 2000 });
        } catch (e) {
          console.warn('[App] startStreamMonitor failed:', e?.message || e);
        }
      })();
    }

    return () => {
      if (DeepfakeDetector?.stopStreamMonitor) {
        try { DeepfakeDetector.stopStreamMonitor(); } catch (e) {
          console.warn('[App] stopStreamMonitor (cleanup) failed:', e?.message || e);
        }
      }
    };
  }, [callState, callModalVisible, remoteAudioTrackId]);

  const handleWarningClose = () => setShowWarning(false);

  return (
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <MainTabNavigator
            socket={socket}
            userPhoneNumber={userPhoneNumber}
            setIsLoggedIn={setIsLoggedIn}
            onStartCall={handleStartCall}
          />
        ) : (
          <AuthStack setIsLoggedIn={setIsLoggedIn} onLoginSuccess={onLoginSuccess} />
        )}

        <Modal visible={callModalVisible} animationType="slide" transparent={false}>
          {callState === 'active' && callPeer?.number ? (
            <>
              <InCallScreen peer={callPeer} onHangup={handleRejectOrHangup} />
              <WarningScreen
                visible={showWarning}
                onClose={handleWarningClose}
                onHangup={handleRejectOrHangup}
              />
            </>
          ) : (
            <CallScreen
              callState={callState}
              peer={callPeer}
              onAccept={handleAccept}
              onReject={handleRejectOrHangup}
              onHangup={handleRejectOrHangup}
              remoteStreamExists={remoteStreamExists}
            />
          )}
        </Modal>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
