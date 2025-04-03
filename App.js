import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen'; 
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const App = () => {
  const isLoggedIn = false; // 기본 로그인 상태 (여기서는 false로 설정)

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {() => (
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
              })}>
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen 
                name="Chat" 
                component={ChatScreen}  // ChatScreen을 기본 컴포넌트로 사용
                listeners={({ navigation }) => ({
                  tabPress: (e) => {
                    if (!isLoggedIn) { 
                      e.preventDefault(); // 기본 이벤트 방지
                      navigation.navigate('Login'); // 로그인 화면으로 이동
                    }
                  },
                })} 
              />
              <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                listeners={({ navigation }) => ({
                  tabPress: (e) => {
                    if (!isLoggedIn) {
                      e.preventDefault();
                      navigation.navigate('Login'); // 로그인 화면으로 통과
                    }
                  },
                })} 
              />
            </Tab.Navigator>
          )}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;   
