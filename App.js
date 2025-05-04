import React, { useState, useEffect, useRef } from 'react';  
import { View, Button, StyleSheet } from 'react-native';  
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
import PasswordRecoveryScreen from './src/screens/PasswordRecoveryScreen';  
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';  
import LogoutScreen from './src/screens/LogoutScreen';  
import PostDetailScreen from './src/screens/PostDetailScreen';  
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';  
import { mediaDevices, RTCPeerConnection, RTCView } from 'react-native-webrtc';  
import io from 'socket.io-client';  
import { PermissionsAndroid, NativeModules } from 'react-native';  
import { checkPermissions } from './src/services/PhoneService';  

const Tab = createBottomTabNavigator();  
const Stack = createStackNavigator();  
const { CallScreeningModule } = NativeModules;  

// Peer Connection Configuration  
const peerConnectionConfig = {  
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],  
};  

// 대시보드 스택 네비게이터  
const DashBoardStack = () => (  
    <Stack.Navigator screenOptions={{ headerShown: false }}>  
        <Stack.Screen name="DashBoardMain" component={DashBoardScreen} />  
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />  
    </Stack.Navigator>  
);  

// 프로필 스택 네비게이터  
const ProfileStack = () => (  
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

// 메인 탭 네비게이터  
const MainTabNavigator = () => {  
    const { isLightMode } = useTheme();  

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
            <Tab.Screen   
                name="Home"   
                children={() => <HomeScreen theme={isLightMode ? 'light' : 'dark'} />}   
                options={{ headerShown: false }}   
            />  
            <Tab.Screen   
                name="DashBoard"   
                component={DashBoardStack}   
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
const AuthStack = ({ setIsLoggedIn }) => (  
    <Stack.Navigator screenOptions={{ headerShown: false }}>  
        <Stack.Screen name="Login">  
            {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}  
        </Stack.Screen>  
        <Stack.Screen name="SignUp" component={SignUpScreen} />  
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />  
        <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />  
    </Stack.Navigator>  
);  

// VoIP 통화 기능  
const VoIPCall = ({ remotePeerId }) => {  
    const [localStream, setLocalStream] = useState(null);  
    const [remoteStream, setRemoteStream] = useState(null);  
    const peerConnection = useRef(new RTCPeerConnection(peerConnectionConfig));  

    useEffect(() => {  
        const getUserMedia = async () => {  
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);  
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {  
                const stream = await mediaDevices.getUserMedia({ audio: true });  
                setLocalStream(stream);  
                stream.getTracks().forEach(track => {  
                    peerConnection.current.addTrack(track, stream);  
                });  
            }  
        };  

        getUserMedia();  

        const socket = io('http://172.30.1.73:3000');  

        socket.on('offer', async (data) => {  
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));  
            const answer = await peerConnection.current.createAnswer();  
            await peerConnection.current.setLocalDescription(answer);  
            socket.emit('answer', { answer, to: data.from });  
        });  

        socket.on('answer', (data) => {  
            peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));  
        });  

        peerConnection.current.onicecandidate = (event) => {  
            if (event.candidate) {  
                socket.emit('ice', { candidate: event.candidate, to: remotePeerId });  
            }  
        };  

        peerConnection.current.ontrack = (event) => {  
            setRemoteStream(event.streams[0]);  
        };  

        return () => {  
            peerConnection.current.close();  
            localStream?.getTracks().forEach(track => track.stop());  
        };  
    }, []);  

    const startCall = () => {  
        socket.emit('call', { to: remotePeerId });  
    };  

    return (  
        <View style={styles.callContainer}>  
            <Button title="전화 걸기" onPress={startCall} />  
            {remoteStream && (  
                <RTCView  
                    streamURL={remoteStream.toURL()}  
                    style={styles.remoteVideo}  
                    objectFit='cover'  
                    mirror={true}  
                />  
            )}  
            {localStream && (  
                <RTCView  
                    streamURL={localStream.toURL()}  
                    style={styles.localVideo}  
                    objectFit='cover'  
                    mirror={true}  
                />  
            )}  
        </View>  
    );  
};  

const App = () => {  
    const [isLoggedIn, setIsLoggedIn] = useState(true);  

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
                {/* VoIP 통화 컴포넌트를 넣고, 필요한 원격 피어 ID를 넘깁니다. */}  
                {/* <VoIPCall remotePeerId="REMOTE_PEER_ID" />  */}  
            </NavigationContainer>  
        </ThemeProvider>  
    );  
};  

const styles = StyleSheet.create({  
    callContainer: {  
        flex: 1,  
        justifyContent: 'center',  
        alignItems: 'center',  
    },  
    remoteVideo: {  
        width: '100%',  
        height: '100%',  
    },  
    localVideo: {  
        width: 100,  
        height: 100,  
        position: 'absolute',  
        bottom: 20,  
        right: 20,  
        borderRadius: 10,  
    },  
});  

export default App;
