import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('male'); // 성별 상태 추가

  const handleSignUp = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("오류", "모든 필드를 입력하세요."); // 빈 필드에 대한 경고
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다."); // 비밀번호 불일치 검사
      return;
    }

    console.log('회원가입 진행:', { name, email, password, confirmPassword, gender });
    // 회원가입 로직 추가 필요
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
      <View style={styles.genderContainer}>
        <TouchableOpacity style={styles.genderOption} onPress={() => setGender('male')}>
          <Text style={styles.genderText}>남</Text>
          {gender === 'male' && <View style={styles.radioButtonChecked} />}
          {gender !== 'male' && <View style={styles.radioButton} />}
        </TouchableOpacity>

        <View style={styles.genderSpacer} /> {/* Space between gender options */}

        <TouchableOpacity style={styles.genderOption} onPress={() => setGender('female')}>
          <Text style={styles.genderText}>여</Text>
          {gender === 'female' && <View style={styles.radioButtonChecked} />}
          {gender !== 'female' && <View style={styles.radioButton} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.registerButton} onPress={handleSignUp}>
        <Text style={styles.registerButtonText}>회원 가입</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        이미 계정이 있으신가요? 
        <Text onPress={() => navigation.navigate('Login')} style={styles.linkText}> 로그인</Text>
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
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  genderText: {
    color: '#FFF',
    marginRight: 10,
  },
  genderSpacer: {
    width: 10,  // Space between options
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: '#A9A9A9',
    borderWidth: 1,
    backgroundColor: '#222',
  },
  radioButtonChecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: '#A9A9A9',
    borderWidth: 1,
    backgroundColor: '#007AFF', // 체크 시 색상
  },
  registerButton: {
    height: 55,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
  },
});

export default SignUpScreen;
