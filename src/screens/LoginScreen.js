import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import styles from './styles';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Let’s Catch The Fake!</Text>
        
        <TextInput style={styles.input} placeholder="이메일" placeholderTextColor="#A9A9A9" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#A9A9A9" secureTextEntry={true} />
        
        <Text style={styles.orText}>OR</Text>
        
        <TouchableOpacity style={styles.authButton}>
          <Text style={styles.authButtonText}>Sign In with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authButton}>
          <Text style={styles.authButtonText}>Log in with Naver</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>아직 계정이 없으신가요? 회원가입</Text>
        <Text style={styles.footerText}>비밀번호를 잊으셨나요? 비밀번호 찾기</Text>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
