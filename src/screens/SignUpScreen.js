import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

// 성별 Enum 정의
const UserGenderEnum = {
    MAN: 'MAN',
    WOMAN: 'WOMAN',
};

const SignUpScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState(UserGenderEnum.MAN);
    const [tel, setTel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        // 모든 필드 유효성 검사
        if (!name || !email || !password || !confirmPassword || !tel) {
            Alert.alert("오류", "모든 필드를 입력하세요.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);

        // 요청 데이터 로그
        const requestData = {
            user_id: email,
            user_pw: password,
            username: name,
            gender,
            tel,
            role: 'USER',
        };

        console.log("전송할 데이터:", requestData); // Log the request data
        
        try {
            // API 요청 (URL을 올바르게 설정)
            const response = await axios.post('http://192.168.0.108:3000/api/users/', requestData);

            console.log("서버 응답:", response.data); // 서버 응답 확인

            // 성공적인 가입
            if (response.status === 201) {
                Alert.alert('회원가입 성공!', '계정이 성공적으로 생성되었습니다!');
                navigation.navigate('Login');
            }
        } catch (err) {
            console.error("회원가입 요청 에러 발생:", err); // 에러 로그 출력

            let message = '회원가입 중 오류가 발생했습니다.'; // 기본 오류 메시지

            if (err.response) {
                console.log("서버 오류 데이터:", err.response.data); // 서버 오류 로깅
                console.log("상태 코드:", err.response.status); // 상태 코드 로깅

                // 에러 응답 처리
                if (typeof err.response.data === 'string') {
                    message = err.response.data; // 문자열인 경우
                } else if (Array.isArray(err.response.data)) {
                    message = err.response.data.join(", "); // 배열인 경우
                } else if (typeof err.response.data === 'object' && err.response.data !== null) {
                    // 객체인 경우 메시지 추출
                    message = Object.values(err.response.data).join(", "); // 객체의 모든 값 결합
                }
            } else if (err.request) {
                message = '서버에 연결할 수 없습니다.';
            }

            Alert.alert('회원가입 실패', message); // 알림 표시
        } finally {
            setLoading(false);
        }
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
                keyboardType="email-address"
                autoCapitalize="none"
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
            <TextInput
                style={styles.input}
                placeholder="전화번호 (010-xxxx-xxxx)"
                placeholderTextColor="#A9A9A9"
                value={tel}
                onChangeText={setTel}
                keyboardType="phone-pad"
            />
            <Text style={styles.genderLabel}>성별</Text>
            <View style={styles.genderContainer}>
                <TouchableOpacity style={styles.genderOption} onPress={() => setGender(UserGenderEnum.MAN)}>
                    <Text style={styles.genderText}>남</Text>
                    {gender === UserGenderEnum.MAN && <View style={styles.radioButtonChecked} />}
                    {gender !== UserGenderEnum.MAN && <View style={styles.radioButton} />}
                </TouchableOpacity>
                <View style={styles.genderSpacer} />
                <TouchableOpacity style={styles.genderOption} onPress={() => setGender(UserGenderEnum.WOMAN)}>
                    <Text style={styles.genderText}>여</Text>
                    {gender === UserGenderEnum.WOMAN && <View style={styles.radioButtonChecked} />}
                    {gender !== UserGenderEnum.WOMAN && <View style={styles.radioButton} />}
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.registerButton} onPress={handleSignUp}>
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.registerButtonText}>회원 가입</Text>
                )}
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
        width: 10,
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
        backgroundColor: '#007AFF',
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
