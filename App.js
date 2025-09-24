// App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, TouchableOpacity, View, StyleSheet, NativeModules, NativeEventEmitter,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import io from 'socket.io-client';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { checkPermissions } from './src/services/PhoneService';
import { SERVER_URL } from './src/lib/config';

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

const PALETTE = {
  g1: '#20B2F3', g2: '#5E73F7', g3: '#0F1730',
  surface: 'rgba(16,24,48,0.92)', surface2: 'rgba(31,54,108,0.92)',
  outline: 'rgba(255,255,255,0.12)', active: '#4FB2FF',
  inactive: 'rgba(255,255,255,0.60)', white: '#FFFFFF',
};

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

const Noop = () => null;

const MainTabNavigator = ({ socket, userPhoneNumber, setIsLoggedIn, onStartCall }) => (
  <Tab.Navigator
    screenOptions={({ route, navigation }) => ({
      headerShown: false,
      tabBarHideOnKeyboard: true,
      sceneContainerStyle: { backgroundColor: PALETTE.g3 },
      tabBarStyle: {
        position: 'absolute', left: 12, right: 12, bottom: 12, height: 70,
        paddingBottom: 8, paddingTop: 6, borderTopWidth: 0, backgroundColor: 'transparent',
        elevation: 16, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 }, borderRadius: 18, overflow: 'visible',
      },
      tabBarBackground: () => (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={[PALETTE.surface, PALETTE.surface2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={{
            position: 'absolute', left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth,
            backgroundColor: PALETTE.outline, borderTopLeftRadius: 18, borderTopRightRadius: 18,
          }}/>
        </View>
      ),
      tabBarActiveTintColor: PALETTE.active,
      tabBarInactiveTintColor: PALETTE.inactive,
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      tabBarIcon: ({ focused, color }) => {
        if (route.name === 'Action') return null;
        let iconName = 'home-outline';
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'VoIP') iconName = focused ? 'call' : 'call-outline';
        else if (route.name === 'DashBoard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Icon name={iconName} size={22} color={color} />;
      },
      tabBarButton: (props) => {
        if (route.name !== 'Action') return <TouchableOpacity {...props} />;
        return (
          <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', top: -30 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Home')}
              style={{
                width: 66, height: 66, borderRadius: 33,
                shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 }, elevation: 16,
                borderWidth: 1, borderColor: PALETTE.outline, overflow: 'hidden',
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <LinearGradient
                colors={[PALETTE.g1, PALETTE.g2]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: 33, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="mic" size={28} color={PALETTE.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={DetectStack} />
    <Tab.Screen name="VoIP">
      {() => <VoIPStack socket={socket} userPhoneNumber={userPhoneNumber} onStartCall={onStartCall} />}
    </Tab.Screen>
    <Tab.Screen
      name="Action"
      component={Noop}
      options={{ tabBarLabel: '' }}
      listeners={({ navigation }) => ({
        tabPress: (e) => { e.preventDefault(); navigation.navigate('Home'); },
      })}
    />
    <Tab.Screen name="DashBoard" component={DashBoardStack} />
    <Tab.Screen name="Profile">
      {() => <ProfileStack setIsLoggedIn={setIsLoggedIn} />}
    </Tab.Screen>
  </Tab.Navigator>
);

const AuthStack = ({ setIsLoggedIn, onLoginSuccess }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {props => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} onLoginSuccess={onLoginSuccess} />}
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
  const [callState, setCallState] = useState('idle');
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callPeer, setCallPeer] = useState({ name: '', number: '' });
  const [remoteStreamExists, setRemoteStreamExists] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remoteAudioTrackId, setRemoteAudioTrackId] = useState(null);

  const fakeStreakRef = useRef(0);
  const realStreakRef = useRef(0);
  const warningDelayRef = useRef(null);

  useEffect(() => { checkPermissions(); }, []);

  // 앱 레벨에서 1회 모델 로드 (실패해도 앱은 계속)
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

  // 이벤트로 경고 제어
  useEffect(() => {
    if (!deepfakeEvents) return;
    const onVerdict = (p) => {
      if (!callModalVisible || callState !== 'active' || isCaller) return;
      if (p.decision === 'fake') {
        fakeStreakRef.current += 1; realStreakRef.current = 0;
        if (fakeStreakRef.current >= 2) setShowWarning(true);
      } else {
        realStreakRef.current += 1; fakeStreakRef.current = 0;
        if (realStreakRef.current >= 3 && showWarning) setShowWarning(false);
        if (warningDelayRef.current) { clearTimeout(warningDelayRef.current); warningDelayRef.current = null; }
      }
    };
    const sub = deepfakeEvents.addListener('DeepfakeVerdict', onVerdict);
    return () => { sub.remove(); if (warningDelayRef.current) { clearTimeout(warningDelayRef.current); warningDelayRef.current = null; } };
  }, [callModalVisible, callState, isCaller, showWarning]);

  const resetVerdictState = () => {
    fakeStreakRef.current = 0; realStreakRef.current = 0;
    if (warningDelayRef.current) { clearTimeout(warningDelayRef.current); warningDelayRef.current = null; }
  };

  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);

    // ✅ 충돌 해결: 환경에 따라 자동 선택
    const webSocket = io(SERVER_URL);
    webSocket.on('connect', () => {
      console.log('[Socket] Connected');
      webSocket.emit('register-user', { phoneNumber });
    });
    webSocket.on('call', ({ from, number, name }) => {
      setRemotePeerId(from);
      setCallPeer({ name, number });
      setCallState('incoming');
      setCallModalVisible(true);
      setIsCaller(false);
    });
    webSocket.on('call-ack', ({ toSocketId }) => {
      setRemotePeerId(toSocketId);
    });
    webSocket.on('call-ended', () => {
      handleRejectOrHangup();
    });
    setSocket(webSocket);

    (async () => {
      try {
        await DeepfakeDetector?.requestPlaybackCapture?.();
      } catch (e) {
        console.warn('[Deepfake] capture request failed:', e?.message || e);
      }
    })();
  };

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
      socket.emit('call', { to: targetPhoneNumber, from: userPhoneNumber, number: userPhoneNumber, name: userPhoneNumber });
    }
  };

  const handleRejectOrHangup = () => {
    if (socket && remotePeerId) socket.emit('hangup', { to: remotePeerId, from: userPhoneNumber });
    setCallState('ended'); setCallModalVisible(false); setRemotePeerId(null); setIsCaller(false);
    setCallPeer({ name: '', number: '' }); setRemoteStreamExists(false); setRemoteAudioTrackId(null); setShowWarning(false);
    resetVerdictState();
    try { DeepfakeDetector?.stopStreamMonitor?.(); } catch (e) { console.warn('[App] stopStreamMonitor error:', e?.message || e); }
  };

  const { acceptCall } = useVoIPConnection({
    enabled: callModalVisible && !!remotePeerId && (isCaller || callState === 'active'),
    remotePeerId, socket, isCaller, onRemoteStream: (stream) => {
      if (stream) {
        setRemoteStreamExists(true);
        setCallState('active');
        const audioTrack = stream.getAudioTracks?.()[0];
        setRemoteAudioTrackId(audioTrack?.id ?? null);
      }
    },
    onHangup: handleRejectOrHangup,
  });

  const handleAccept = () => { setCallState('active'); acceptCall(); };

  useEffect(() => {
    const canStart = callState === 'active' && callModalVisible && remoteAudioTrackId && DeepfakeDetector?.startStreamMonitor;
    if (canStart) {
      (async () => {
        try { await DeepfakeDetector.startStreamMonitor(remoteAudioTrackId, { windowMs: 2000 }); }
        catch (e) { console.warn('[App] startStreamMonitor failed:', e?.message || e); }
      })();
    }
    return () => { try { DeepfakeDetector?.stopStreamMonitor?.(); } catch (e) {} };
  }, [callState, callModalVisible, remoteAudioTrackId]);

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
          {callState === 'active' && !!callPeer?.number ? (
            <>
              <InCallScreen peer={callPeer} onHangup={handleRejectOrHangup} />
              <WarningScreen visible={showWarning} onClose={() => setShowWarning(false)} onHangup={handleRejectOrHangup} />
            </>
          ) : (
            <CallScreen
              callState={callState} peer={callPeer}
              onAccept={handleAccept} onReject={handleRejectOrHangup} onHangup={handleRejectOrHangup}
              remoteStreamExists={remoteStreamExists}
            />
          )}
        </Modal>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;