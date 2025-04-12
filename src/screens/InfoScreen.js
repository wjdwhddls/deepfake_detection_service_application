import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext'; // ThemeContext에서 useTheme 훅 가져오기

const InfoScreen = () => {
    const navigation = useNavigation(); // Navigation 훅 사용
    const { isLightMode } = useTheme(); // 현재 테마 정보 가져오기

    return (
        <View style={styles.container(isLightMode)}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title(isLightMode)}>정보</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle(isLightMode)}>사업 취지</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    주저리 주저리{''}
                    어쩌구 저쩌구{''}
                    {'~'.repeat(50)}{''}
                    {'~'.repeat(30)} 이렇게 긍정적 효과를 주기 위해 만들게 되었다.
                </Text>

                <Text style={styles.sectionTitle(isLightMode)}>개발자들</Text>
                <View style={styles.developerContainer}>
                    {developers.map((dev) => (
                        <View key={dev.name} style={styles.developerCard(isLightMode)}>
                            <Icon name={dev.icon} size={40} color={isLightMode ? '#000' : '#FFF'} />
                            <Text style={styles.developerName(isLightMode)}>{dev.name}</Text>
                            <Text style={styles.developerRole(isLightMode)}>{dev.role}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer(isLightMode)}>
                <Text style={styles.footerText(isLightMode)}>© 2024 Company name, All rights reserved.</Text>
                <Text style={styles.footerLink(isLightMode)}>Contact Us</Text>
                <Text style={styles.footerLink(isLightMode)}>Follow us on Instagram</Text>
            </View>
        </View>
    );
};

// 개발자 데이터
const developers = [
    { name: '김찬주', role: '백엔드', icon: 'code-slash' },
    { name: '장사민', role: '프론트엔드', icon: 'laptop' },
    { name: '홍길동', role: '디자이너', icon: 'brush' },
    { name: '고유정', role: 'QA', icon: 'checkmark-circle' },
];

// 스타일 업데이트 (테마를 동적으로 적용)
const styles = {
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
        marginTop: 40,     // 헤더 위 간격 추가
    },
    backButton: {
        marginRight: 10,
    },
    title: (isLightMode) => ({
        fontSize: 24,
        color: isLightMode ? '#000' : '#FFF', // 텍스트 색상
        textAlign: 'center',
        flex: 1,
    }),
    content: {
        flex: 1,
    },
    sectionTitle: (isLightMode) => ({
        fontSize: 18,
        color: isLightMode ? '#000' : '#FFF', // 제목 색상
        marginBottom: 10,
        borderBottomWidth: 1,
        borderColor: '#FFF',
        paddingBottom: 5,
    }),
    sectionContent: (isLightMode) => ({
        color: isLightMode ? '#000' : '#FFF', // 내용 색상
        marginBottom: 20,
    }),
    developerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    developerCard: (isLightMode) => ({
        alignItems: 'center',
        backgroundColor: isLightMode ? '#EEE' : '#1f1f1f', // 카드 배경색
        borderRadius: 10,
        padding: 10,
        flex: 1,
        margin: 5,
    }),
    developerName: (isLightMode) => ({
        color: isLightMode ? '#000' : '#FFF', // 개발자 이름 색상
        fontWeight: 'bold',
        marginTop: 5,
    }),
    developerRole: (isLightMode) => ({
        color: isLightMode ? '#666' : '#A9A9A9', // 개발자 역할 색상
    }),
    footer: (isLightMode) => ({
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: isLightMode ? '#FFF' : '#000', // 푸터 배경색
    }),
    footerText: (isLightMode) => ({
        color: isLightMode ? '#000' : '#FFF', // 푸터 텍스트 색상
    }),
    footerLink: (isLightMode) => ({
        color: isLightMode ? '#000' : '#FFF', // 링크 색상
        marginVertical: 5,
    }),
};

export default InfoScreen;
