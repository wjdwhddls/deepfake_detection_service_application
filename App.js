import React, { useState, useEffect } from 'react';
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
import useVoIPConnection from './src/services/useVoIPConnection';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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

const MainTabNavigator = ({ socket, setRemotePeerId, userPhoneNumber, setIsLoggedIn, onStartCall }) => {
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="VoIP">
        {() => <VoIPStack socket={socket} userPhoneNumber={userPhoneNumber} onStartCall={onStartCall} />}
      </Tab.Screen>
      <Tab.Screen name="DashBoard" component={DashBoardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

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

  useEffect(() => { checkPermissions(); }, []);

  const onLoginSuccess = (phoneNumber) => {
    setUserPhoneNumber(phoneNumber);
    setIsLoggedIn(true);
    const webSocket = io('http://192.168.0.34:3000');
    webSocket.on('connect', () => {
      webSocket.emit('register-user', { phoneNumber });
    });
    webSocket.on('call', ({ from, number, name }) => {
      setRemotePeerId(from);
      setCallPeer({ name, number });
      setCallState('incoming');
      setCallModalVisible(true);
      setIsCaller(false);
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
    }
  }, [isLoggedIn]);

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
      });
    }
  };

  const handleAccept = () => setCallState('connecting');

  const handleRejectOrHangup = () => {
    if (socket && remotePeerId) {
      socket.emit('hangup', { to: remotePeerId, from: socket.id });
    }
    setCallState('ended');
    setCallModalVisible(false);
    setRemotePeerId(null);
    setIsCaller(false);
    setCallPeer({ name: '', number: '' });
    setRemoteStreamExists(false);
  };

  useVoIPConnection({
    enabled: callModalVisible && ['connecting', 'active'].includes(callState),
    remotePeerId,
    socket,
    isCaller,
    onRemoteStream: (stream) => {
      setRemoteStreamExists(!!stream);
      setCallState('active');
    },
    onHangup: () => handleRejectOrHangup(),
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
          <LoginScreen setIsLoggedIn={setIsLoggedIn} onLoginSuccess={onLoginSuccess} />
        )}

        {/* CallScreen 모달 */}
        <Modal visible={callModalVisible} animationType="slide" transparent={false}>
          <CallScreen
            callState={callState}
            peer={callPeer}
            onAccept={handleAccept}
            onReject={handleRejectOrHangup}
            onHangup={handleRejectOrHangup}
            remoteStreamExists={remoteStreamExists}
          />
        </Modal>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
