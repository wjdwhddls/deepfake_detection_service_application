import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';  // useTheme 훅 import

const LogoutScreen = () => {
    const navigation = useNavigation();
    const { isLightMode } = useTheme();  // 현재 테마 정보 가져오기

    const handleLogout = () => {
        // 로그아웃 후 로그인 화면으로 이동
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container(isLightMode)}>
            <View style={styles.header}>
                <Text style={styles.title(isLightMode)}>로그아웃 확인</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.instructions(isLightMode)}>
                    정말 로그아웃 하시겠습니까?
                </Text>
                <TouchableOpacity 
                    style={styles.logoutButton(isLightMode)} 
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText(isLightMode)}>로그아웃</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 스타일 정의
const styles = StyleSheet.create({
    container: (isLightMode) => ({
        flex: 1,
        backgroundColor: isLightMode ? '#FFF' : '#000',  // 배경 색상
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: (isLightMode) => ({
        fontSize: 24,
        fontWeight: 'bold',
        color: isLightMode ? '#000' : '#FFF',  // 제목 색상
    }),
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    instructions: (isLightMode) => ({
        fontSize: 18,
        color: isLightMode ? '#000' : '#FFF',
        textAlign: 'center',
        marginBottom: 20,
    }),
    logoutButton: (isLightMode) => ({
        backgroundColor: isLightMode ? '#FF6347' : '#FF4500',  // 버튼 색상
        padding: 15,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
        marginBottom: 10,
    }),
    logoutButtonText: (isLightMode) => ({
        color: '#FFF',  // 버튼 텍스트 색상
        fontSize: 18,
        fontWeight: 'bold',
    }),
    cancelButton: {
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

export default LogoutScreen;
