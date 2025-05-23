import React, { useState, useEffect } from 'react';
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
      {(props) => <ProfileScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
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
    <Stack.Screen name="CallScreen" component={CallScreen} />
  </Stack.Navigator>
);

const MainTabNavigator = ({
  socket,
  setRemotePeerId,
  userPhoneNumber,
  setIsLoggedIn,
  onStartCall
}) => {
  const { isLightMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home')      iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'VoIP') iconName = focused ? 'call' : 'call-outline';
          else if (route.name === 'DashBoard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Profile')   iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isLightMode ? '#007AFF' : '#FFCC00',
        tabBarInactiveTintColor: isLightMode ? '#8e8e93' : '#BBBBBB',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        children={() => (
          <HomeScreen
            socket={socket}
            setRemotePeerId={setRemotePeerId}
            userPhoneNumber={userPhoneNumber}
          />
        )}
      />
      <Tab.Screen
        name="VoIP"
        children={() => (
          <VoIPStack
            socket={socket}
            userPhoneNumber={userPhoneNumber}
            onStartCall={onStartCall}
          />
        )}
      />
      <Tab.Screen
        name="DashBoard"
        component={DashBoardStack}
      />
      <Tab.Screen
        name="Profile"
        children={() => <ProfileStack setIsLoggedIn={setIsLoggedIn} />}
      />
    </Tab.Navigator>
  );
};

const AuthStack = ({ setIsLoggedIn, onLoginSuccess }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {(props) => (
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

  // --- 통화 상태 ---
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callPeer, setCallPeer] = useState({ name: '', number: '', avatar: null });

  // 스트림 받음 시 UI용
  const [remoteStreamExists, setRemoteStreamExists] = useState(false);

  useEffect(() => { checkPermissions(); }, []);

  // 로그인 후 소켓 연결 및 이벤트 바인딩
  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);

    const webSocket = io('http://192.168.0.108:3000');
    webSocket.on('connect', () => {
      webSocket.emit('register-user', { phoneNumber });
    });

    webSocket.on('call', ({ from, number, name, avatar }) => {
      setRemotePeerId(from);
      setCallPeer({ name, number, avatar });
      setCallState('incoming');
      setCallModalVisible(true);
      setIsCaller(false);
    });

    setSocket(webSocket);
  };

  // 로그아웃 cleanup
  useEffect(() => {
    if (!isLoggedIn && socket) {
      socket.disconnect();
      setSocket(null);
      setUserPhoneNumber(null);
      setRemotePeerId(null);
      setIsCaller(false);
      setCallState('idle');
      setCallModalVisible(false);
      setCallPeer({ name: '', number: '', avatar: null });
      setRemoteStreamExists(false);
    }
  }, [isLoggedIn]);

  // 발신
  const handleStartCall = (targetPeerId, peerInfo) => {
    setRemotePeerId(targetPeerId);
    setCallPeer(peerInfo);
    setCallState('outgoing');
    setCallModalVisible(true);
    setIsCaller(true);
    if (socket && userPhoneNumber && targetPeerId) {
      socket.emit('call', {
        to: targetPeerId,
        from: socket.id,
        number: userPhoneNumber,
        name: userPhoneNumber,
        avatar: null
      });
    }
  };

  // 수신 accept: 연결 시작
  const handleAccept = () => setCallState('connecting');

  // 거절/종료
  const handleRejectOrHangup = () => {
    setCallState('ended');
    setCallModalVisible(false);
    setRemotePeerId(null);
    setIsCaller(false);
    setCallPeer({ name: '', number: '', avatar: null });
    setRemoteStreamExists(false);
  };

  // PeerConnection (webrtc signaling/stream 관리)
  useVoIPConnection({
    enabled: callModalVisible && ['connecting', 'active'].includes(callState),
    remotePeerId,
    socket,
    isCaller,
    onRemoteStream: (stream) => {
      setRemoteStreamExists(!!stream);
      setCallState('active');
    },
    onHangup: () => {
      setRemoteStreamExists(false);
      setCallModalVisible(false);
      setCallState('ended');
    }
  });

  return (
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <MainTabNavigator
            socket={socket}
            setRemotePeerId={setRemotePeerId}
            userPhoneNumber={userPhoneNumber}
            setIsLoggedIn={setIsLoggedIn}
            onStartCall={handleStartCall}
          />
        ) : (
          <AuthStack setIsLoggedIn={setIsLoggedIn} onLoginSuccess={onLoginSuccess} />
        )}

        {/* ---- 통화 오버레이 ---- */}
        {callModalVisible && remotePeerId && socket && (
          <CallScreen
            callState={callState}
            peer={callPeer}
            onAccept={handleAccept}
            onReject={handleRejectOrHangup}
            onHangup={handleRejectOrHangup}
            remoteStreamExists={remoteStreamExists}
          />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;