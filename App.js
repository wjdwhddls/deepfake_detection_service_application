import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import io from 'socket.io-client';

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

import VoIPScreen from './src/screens/VoIPScreen';
import CallScreen from './src/screens/CallScreen';
import VoIPCall from './src/services/VoIPCall';

// Stack 선언
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

// VoIP Stack - socket과 userPhoneNumber를 props로 직접 전달!
const VoIPStack = ({ socket, userPhoneNumber }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VoIPScreen">
      {props => (
        <VoIPScreen
          {...props}
          socket={socket}
          userPhoneNumber={userPhoneNumber}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="CallScreen" component={CallScreen} />
  </Stack.Navigator>
);

// MainTabNavigator - VoIPStack에 socket과 userPhoneNumber를 모두 props로 전달!
const MainTabNavigator = ({
  socket,
  setRemotePeerId,
  userPhoneNumber,
  setIsLoggedIn,
}) => {
  const { isLightMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'VoIP') {
            iconName = focused ? 'call' : 'call-outline';
          } else if (route.name === 'DashBoard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
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
        name="VoIP"
        children={() => (
          <VoIPStack
            socket={socket}
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

  // 전화를 받은 쪽에서 isCaller를 false로 전달
  const [voipIncoming, setVoipIncoming] = useState(false);

  // 앱 최초 실행 시 권한 요청(마이크 등)
  useEffect(() => {
    checkPermissions();
  }, []);

  // 로그인 성공 시 소켓 연결
  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);

    const webSocket = io('http://192.168.0.223:3000'); // ※ 실제 서버 주소로 변경 필요

    webSocket.on('connect', () => {
      webSocket.emit('register-user', { phoneNumber });
    });

    webSocket.on('call', ({ from }) => {
      setRemotePeerId(from);
      setVoipIncoming(true); // 수신측임을 플래그!
    });

    setSocket(webSocket);
  };

  // 로그아웃/앱 종료시 소켓 정리
  useEffect(() => {
    if (!isLoggedIn && socket) {
      socket.disconnect();
      setSocket(null);
      setUserPhoneNumber(null);
      setRemotePeerId(null);
      setVoipIncoming(false);
    }
  }, [isLoggedIn]);

  // 통화 종료 후 리셋 핸들러
  const handleHangup = () => {
    setRemotePeerId(null);
    setVoipIncoming(false);
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

        {/* remotePeerId가 생겼을 때만 VoIPCall 모달 표시
            수신측(isCaller=false)로 동작 */}
        {remotePeerId && socket && (
          <VoIPCall 
            remotePeerId={remotePeerId} 
            socket={socket} 
            onHangup={handleHangup}
            isCaller={false} // 전화받는 쪽(수신자)에서는 isCaller를 false로
          />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;