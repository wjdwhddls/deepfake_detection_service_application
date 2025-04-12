import React, { useState , useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
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
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Chat') {
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
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
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

// 프로필 스택과 알림 설정을 포함하는 스택 내비게이터
const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} /> 
    </Stack.Navigator>
  );
};

// 로그인 및 회원가입 스택 내비게이터
const AuthStack = ({ setIsLoggedIn }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 기본적으로 로그인 상태를 false로 설정합니다.

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
    <NavigationContainer>
      {isLoggedIn ? (
        <MainTabNavigator /> // 로그인된 경우 탭 내비게이터를 렌더링
      ) : (
        <AuthStack setIsLoggedIn={setIsLoggedIn} /> // 로그인하지 않은 경우 로그인 스택을 렌더링
      )}
    </NavigationContainer>
  );
};

export default App;
