import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

const PasswordChangeScreen = ({ navigation }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = () => {
        if (newPassword === confirmPassword) {
            // 비밀번호 변경 처리 로직을 여기에 추가
            Alert.alert('성공', '비밀번호가 변경되었습니다.');
            navigation.navigate('Login'); // 비밀번호 변경 후 로그인 화면으로 이동
        } else {
            Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.title}>새로운 비밀번호를 입력해 주세요.</Text>

                <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="새로운 비밀번호"
                    secureTextEntry
                    style={styles.input}
                />
                <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="비밀번호를 다시 입력해 주세요"
                    secureTextEntry
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>확인</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    아직 계정이 없으신가요?
                    <Text onPress={() => navigation.navigate('SignUp')} style={styles.link}> 회원가입</Text>
                </Text>

                <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
                    <Text style={styles.footerText}>비밀번호를 잊으셨나요?</Text>
                </TouchableOpacity>
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
        fontSize: 20,
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center',
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

export default PasswordChangeScreen;
