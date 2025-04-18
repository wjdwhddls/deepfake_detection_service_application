import React, { useState , useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './src/screens/HomeScreen';
import DashBoardScreen from './src/screens/DashBoardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import InfoScreen from './src/screens/InfoScreen';
import FAQScreen from './src/screens/FAQScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';

import { checkPermissions } from './src/services/PhoneService'
import { NativeModules } from 'react-native'

const {CallScreeningModule}=NativeModules

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';  // useTheme 훅을 추가
import PasswordRecoveryScreen from './src/screens/PasswordRecoveryScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import LogoutScreen from './src/screens/LogoutScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

// 네비게이터 선언

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 대시보드 스택 네비게이터
const DashBoardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashBoardMain" component={DashBoardScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
};

// 프로필 스택 네비게이터
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Info" component={InfoScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Logout" component={LogoutScreen} />
    </Stack.Navigator>
  );
};

// 메인 탭 네비게이터
const MainTabNavigator = () => {
  const { isLightMode } = useTheme();  // 현재 테마 상태 가져오기

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'DashBoard') {
            iconName = focused ? 'chatbubbles' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#b0b0b0',
        tabBarStyle: { backgroundColor: '#333333' },
      })}
    >
      {/* HomeScreen에 현재 테마 값을 props로 전달 */}
      <Tab.Screen 
        name="Home" 
        children={() => <HomeScreen theme={isLightMode ? 'light' : 'dark'} />} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="DashBoard" 
        component={DashBoardStack} // 대시보드 스택 연결
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack} 
        options={{ headerShown: false }} 
      />
    </Tab.Navigator>
  );
};

// 인증 스택 네비게이터
const AuthStack = ({ setIsLoggedIn }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
      <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {  
    const requestPermissions = async () => {  
      try {  
        const result = await checkPermissions(CallScreeningModule);   
        if (result) {  
          console.log("Permissions granted!");  
        } else {  
          alert("Permissions were denied!");  
        }  
      } catch (error) {  
        console.error("An error occurred during permission request:", error);  
      }  
    };  
  
    requestPermissions();  
  }, []);  
  return (
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <MainTabNavigator />
        ) : (
          <AuthStack setIsLoggedIn={setIsLoggedIn} />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
