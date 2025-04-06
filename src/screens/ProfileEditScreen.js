import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext'; // useTheme 훅 import 추가

const ProfileEditScreen = () => {
    const navigation = useNavigation(); // Navigation 훅 사용
    const { isLightMode } = useTheme(); // 현재 테마 정보 가져오기

    return (
        <View style={styles.container(isLightMode)}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title(isLightMode)}>프로필 수정</Text>
            </View>

            <View style={styles.separator} /> {/* 헤더와 입력 필드 간의 간격 추가 */}

            <TextInput
                style={styles.input(isLightMode)}
                placeholder="닉네임"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input(isLightMode)}
                placeholder="이메일"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input(isLightMode)}
                placeholder="비밀번호"
                placeholderTextColor="#b0b0b0"
                secureTextEntry
            />
            <TextInput
                style={styles.input(isLightMode)}
                placeholder="비밀번호 재입력"
                placeholderTextColor="#b0b0b0"
                secureTextEntry
            />
            <TextInput
                style={styles.input(isLightMode)}
                placeholder="개인 전화번호"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input(isLightMode)}
                placeholder="성별"
                placeholderTextColor="#b0b0b0"
            />
            <TouchableOpacity style={styles.button(isLightMode)}>
                <Text style={styles.buttonText}>수정하기</Text>
            </TouchableOpacity>
        </View>
    );
};

// 스타일 업데이트 (테마를 동적으로 적용)
const styles = StyleSheet.create({
    container: (isLightMode) => ({
        flex: 1,
        backgroundColor: isLightMode ? '#FFF' : '#000', // 배경색
        padding: 20,
    }),
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // 왼쪽 정렬
        marginBottom: 30, // 헤더와 내용 간격 추가
        marginTop: 40, // 헤더 위 간격 추가
    },
    backButton: {
        marginRight: 10,
    },
    title: (isLightMode) => ({
        fontSize: 24,
        color: isLightMode ? '#000' : '#FFF', // 제목 색상
        textAlign: 'center',
        flex: 1,
    }),
    separator: {
        height: 30, // 헤더와 입력 필드 간의 간격을 위한 뷰
    },
    input: (isLightMode) => ({
        height: 50,
        borderColor: isLightMode ? '#007BFF' : '#ccc', // 라이트 모드에서 경계선 색상 변경
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 30, // 텍스트 박스 간격
        color: isLightMode ? '#000' : '#fff', // 입력 텍스트 색상
        backgroundColor: isLightMode ? '#FFF' : '#333', // 입력 필드 배경색
    }),
    button: (isLightMode) => ({
        backgroundColor: '#007BFF',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileEditScreen;
