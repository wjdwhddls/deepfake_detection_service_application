// LoginScreen.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from './styles';
import { useNavigation } from '@react-navigation/native'; // 네비게이션 사용

const LoginScreen = ({ setIsLoggedIn }) => { // setIsLoggedIn prop 추가
  const navigation = useNavigation();  // 네비게이션 훅 사용

  const handleLogin = () => {
    // 로그인 처리 로직
    // 로그인 성공 시 아래 코드를 호출하여 로그인 상태를 변경
    setIsLoggedIn(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let’s Catch The Fake!</Text>
      <TextInput style={styles.input} placeholder="이메일" placeholderTextColor="#A9A9A9" />
      <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#A9A9A9" secureTextEntry={true} />
      <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
        <Text style={styles.authButtonText}>로그인</Text>
      </TouchableOpacity>
      <Text style={styles.orText}>OR</Text>
      <TouchableOpacity style={styles.authButton}>
        <Text style={styles.authButtonText}>Sign In with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.naverButton}>
        <Text style={styles.authButtonText}>Log in with Naver</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.footerText}>아직 계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>비밀번호를 잊으셨나요?</Text>
    </View>
  );
};

export default LoginScreen;
