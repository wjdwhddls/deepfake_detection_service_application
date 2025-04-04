import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // 올바른 import

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('male'); // 성별 상태 추가

  const handleSignUp = () => {
    // 회원가입 로직 추가 필요
    console.log('회원가입 진행:', { name, email, password, confirmPassword, gender });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let’s Catch The Fake!</Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        placeholderTextColor="#A9A9A9"
        value={name}
        onChangeText={setName}
      />
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
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        placeholderTextColor="#A9A9A9"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      
      <Text style={styles.genderLabel}>성별</Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="남" value="male" />
        <Picker.Item label="여" value="female" />
      </Picker>

      <TouchableOpacity style={styles.registerButton} onPress={handleSignUp}>
        <Text style={styles.registerButtonText}>회원 가입</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>
        이미 계정이 있으신가요? <Text onPress={() => navigation.navigate('Login')} style={styles.linkText}>로그인</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 60,
    width: '100%',
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#222',
    color: '#FFF',
    marginBottom: 15,
    fontSize: 16,
  },
  genderLabel: {
    color: '#FFF',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#222',
    color: '#FFF',
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
  },
  registerButton: {
    height: 55,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#DB4437',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  footerText: {
    color: '#A9A9A9',
    textAlign: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#DB4437',
  },
});

export default SignUpScreen;
