import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 추가

const LoginScreen = ({ setIsLoggedIn,  onLoginSuccess }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password; // 비번은 일반적으로 trim하지 않습니다

    console.log('로그인 요청 값:', { user_id: trimmedEmail, user_pw: trimmedPassword });

    try {
      const response = await axios.post('http://192.168.219.73:3000/api/auth/signin', {
        user_id: trimmedEmail,
        user_pw: trimmedPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500,
      });

      console.log('[서버 응답]', {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });

      // 헤더 키 대소문자 주의 (서버 설정에 따라 다름)
      const token = response.data?.data?.accessToken || response.data?.accessToken;

      if (token) {
        console.log('[토큰 수신]', token);

        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem('token', token); // 토큰 저장
        setIsLoggedIn(true);
        onLoginSuccess(response.data.data.phoneNumber);
        navigation.navigate('Home');
        Alert.alert('로그인 성공', '환영합니다!');
      } else {
        const msg = response.data?.message || 
              (typeof response.data === 'string' ? response.data : '') ||
              '서버에서 토큰을 받지 못했습니다.';
        console.error('토큰 미수신, 응답:', response.data);
        Alert.alert('로그인 실패', msg);
      }

    } catch (error) {
      console.error('[로그인 에러]', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        },
      });

      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          // 상세한 오류 메시지 대신 일반 메시지로 처리
          Alert.alert('로그인 실패', `서버 오류 (${status}): ${data.message || '알 수 없는 오류'}`);
        }
      } else if (error.request) {
        console.error('요청 전송 실패 - 요청 객체:', error.request);
        Alert.alert('로그인 실패', '서버에 연결할 수 없습니다. 네트워크를 확인하세요.');
      } else {
        Alert.alert('로그인 실패', `클라이언트 오류: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's Catch The Fake!</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor="#A9A9A9"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#A9A9A9"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
        <Text style={styles.authButtonText}>로그인</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.authButtonText}>Sign In with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.naverButton}>
        <Text style={styles.naverButtonText}>Log in with Naver</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.footerText}>아직 계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
        <Text style={styles.footerText}>비밀번호를 잊으셨나요?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 20,
  },
  authButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButton: {
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  naverButton: {
    height: 50,
    backgroundColor: '#39B54A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  naverButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#A9A9A9',
    marginBottom: 15,
  },
  footerText: {
    textAlign: 'center',
    color: '#A9A9A9',
    marginVertical: 5,
  },
});

export default LoginScreen;
