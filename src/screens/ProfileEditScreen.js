import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileEditScreen = () => {
    const navigation = useNavigation(); // Navigation 훅 사용

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>프로필 수정</Text>
            </View>

            <View style={styles.separator} /> {/* 헤더와 입력 필드 간의 간격 추가 */}

            <TextInput
                style={styles.input}
                placeholder="닉네임"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#b0b0b0"
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="비밀번호 재입력"
                placeholderTextColor="#b0b0b0"
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="개인 전화번호"
                placeholderTextColor="#b0b0b0"
            />
            <TextInput
                style={styles.input}
                placeholder="성별"
                placeholderTextColor="#b0b0b0"
            />
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>수정하기</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // 왼쪽 정렬
        marginBottom: 30, // 헤더와 내용 간격 추가
        marginTop: 40,     // 헤더 위 간격 추가
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        flex: 1,
    },
    separator: {
        height: 30, // 헤더와 입력 필드 간의 간격을 위한 뷰
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 30, // 텍스트 박스 간격
        color: '#fff',
        backgroundColor: '#333',
    },
    button: {
        backgroundColor: '#007BFF',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ProfileEditScreen;
