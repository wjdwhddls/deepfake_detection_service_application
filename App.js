import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-native';
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
  const [callState, setCallState] = useState('idle');
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callPeer, setCallPeer] = useState({ name: '', number: '' });
  const [remoteStreamExists, setRemoteStreamExists] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const warningTimer = useRef(null);

  useEffect(() => { checkPermissions(); }, []);

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
      setShowWarning(false);
      if (warningTimer.current) clearTimeout(warningTimer.current);
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
    setShowWarning(false);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  // 5초 후 수신자에만 WarningScreen 표시
  useEffect(() => {
    if (!isCaller && callState === 'active' && callModalVisible) {
      if (warningTimer.current) clearTimeout(warningTimer.current);
      warningTimer.current = setTimeout(() => setShowWarning(true), 5000);
    } else {
      setShowWarning(false);
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
        warningTimer.current = null;
      }
    }
    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [isCaller, callState, callModalVisible]);

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
      }
    },
    onHangup: handleRejectOrHangup,
  });

  const handleAccept = () => {
    console.log('[App] Accept button pressed');
    setCallState('active');
    acceptCall();
  };

  // WarningScreen에서도 종료할 수 있도록
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
              {/* WarningScreen은 InCallScreen 위에 겹쳐서 띄움 */}
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