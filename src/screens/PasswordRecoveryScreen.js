import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

const PasswordRecoveryScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    
    // 실제 이메일 목록 (예시)
    const registeredEmails = ['example1@test.com', 'example2@test.com']; // 예시 이메일 리스트

    const handleRecoverPassword = () => {
        // 이메일이 목록에 있는지 확인
        if (registeredEmails.includes(email)) {
            navigation.navigate('PasswordChange'); // 비밀번호 변경 화면으로 이동
        } else {
            Alert.alert('아이디 오류', '아이디가 존재하지 않습니다.'); // 아이디가 존재하지 않는 경우 경고
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.title}>로그인에 문제가 있나요?</Text>
                <Text style={styles.subtitle}>사용하시는 Email을 입력하여 주세요.</Text>

                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="이메일을 입력해 주세요"
                    keyboardType="email-address"
                    style={styles.input}
                    textAlign="center"
                />

                <TouchableOpacity style={styles.button} onPress={handleRecoverPassword}>
                    <Text style={styles.buttonText}>확인</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    아직 계정이 없으신가요? 
                    <Text onPress={() => navigation.navigate('SignUp')} style={styles.link}> 회원가입</Text>
                </Text>
                <Text style={styles.footerText}>
                    비밀번호를 잊으셨나요? 
                    <Text onPress={() => navigation.navigate('PasswordRecovery')} style={styles.link}> 비밀번호 찾기</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // 배경 색상
        justifyContent: 'center',
        padding: 20,
    },
    innerContainer: {
        backgroundColor: '#1e1e1e', // 내부 컨테이너 배경 색상
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    lockIcon: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#FFF',
        marginBottom: 10,
    },
    subtitle: {
        color: '#A9A9A9',
        marginBottom: 20,
    },
    input: {
        height: 50,
        width: '100%',
        borderRadius: 10,
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF', // 버튼 배경 색상
        borderRadius: 10,
        padding: 15,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#A9A9A9',
        fontSize: 16,
    },
    link: {
        color: '#007AFF', // 링크 색상
    },
});

export default PasswordRecoveryScreen;
