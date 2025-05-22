import React, { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import io from 'socket.io-client';

// 권한 체크 함수 (import 필요)
import { checkPermissions } from './src/services/PhoneService';

// screens
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

import CallScreen from './src/screens/CallScreen';
import VoIPCall from './src/services/VoIPCall';

// 탭/스택 선언
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
const DashBoardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashBoardMain" component={DashBoardScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
  </Stack.Navigator>
);

// Profile Stack
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

// Detect Stack
const DetectStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DetectMain" component={HomeScreen} />
    <Stack.Screen name="DetectDetail" component={ResultScreen} />
  </Stack.Navigator>
);

// MainTabNavigator
const MainTabNavigator = ({ socket, setRemotePeerId, userPhoneNumber, setIsLoggedIn }) => {
  const { isLightMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName =
            route.name === 'Home'
              ? focused
                ? 'shield-checkmark'
                : 'shield-checkmark-outline'
              : route.name === 'DashBoard'
              ? focused
                ? 'chatbubbles'
                : 'chatbubble-outline'
              : focused
              ? 'person'
              : 'person-outline';
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
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="DashBoard"
        component={DashBoardStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        children={() => <ProfileStack setIsLoggedIn={setIsLoggedIn} />}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack
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
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);

  // 앱 시작 시 권한 체크
  useEffect(() => {
    checkPermissions(); // 반드시 호출
  }, []);

  // 안전하게 기존 소켓 연결 해제
  useEffect(() => {
    if (!isLoggedIn && socket) {
      try {
        socket.disconnect();
        setSocket(null);
        setUserPhoneNumber(null);
        setRemotePeerId(null);
      } catch (e) {
        console.log('[소켓 정리중 오류]', e);
      }
    }
    // eslint-disable-next-line
  }, [isLoggedIn]);

  // 로그인 성공 시, 소켓 연결 및 이벤트 등록
  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);

    if (socket) {
      try {
        socket.disconnect();
      } catch (e) {}
    }

    const webSocket = io('http://192.168.0.223:3000', {
      transports: ['websocket'],
      forceNew: true, // 항상 새로운 연결 강제
    });

    webSocket.on('connect', () => {
      webSocket.emit('register-user', { phoneNumber });
    });
    webSocket.on('call', ({ from }) => {
      if (from !== phoneNumber) setRemotePeerId(from); // 자기 자신 방지
    });
    webSocket.on('disconnect', () => {
      console.log('소켓 disconnected.');
    });
    webSocket.on('connect_error', (err) => {
      Alert.alert('소켓 연결 오류', err?.message ?? '서버 연결 실패');
    });

    setSocket(webSocket);
  };

  // VoIPCall hangup 핸들러
  const handleHangup = () => {
    setRemotePeerId(null);
  };

  return (
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <MainTabNavigator
            socket={socket}
            setRemotePeerId={setRemotePeerId}
            userPhoneNumber={userPhoneNumber}
            setIsLoggedIn={setIsLoggedIn}
          />
        ) : (
          <AuthStack setIsLoggedIn={setIsLoggedIn} onLoginSuccess={onLoginSuccess} />
        )}

        {/* remotePeerId와 전화번호 모두 체크 (내가 아닌 상대방 연결시에만) */}
        {remotePeerId && socket && remotePeerId !== userPhoneNumber && (
          <VoIPCall
            remotePeerId={remotePeerId}
            socket={socket}
            onHangup={handleHangup}
          />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;