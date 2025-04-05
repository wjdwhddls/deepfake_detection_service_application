import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const InfoScreen = () => {
    const navigation = useNavigation(); // Navigation 훅 사용

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>정보</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>사업 취지</Text>
                <Text style={styles.sectionContent}>
                    주저리 주저리{''}
                    어쩌구 저쩌구{''}
                    {'~'.repeat(50)}{''}
                    {'~'.repeat(30)} 이렇게 긍정적 효과를 주기 위해 만들게 되었다.
                </Text>

                <Text style={styles.sectionTitle}>개발자들</Text>
                <View style={styles.developerContainer}>
                    {developers.map((dev) => (
                        <View key={dev.name} style={styles.developerCard}>
                            <Icon name={dev.icon} size={40} color="#000" />
                            <Text style={styles.developerName}>{dev.name}</Text>
                            <Text style={styles.developerRole}>{dev.role}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2024 Company name, All rights reserved.</Text>
                <Text style={styles.footerLink}>Contact Us</Text>
                <Text style={styles.footerLink}>Follow us on Instagram</Text>
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
    content: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#FFF',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderColor: '#FFF',
        paddingBottom: 5,
    },
    sectionContent: {
        color: '#FFF',
        marginBottom: 20,
    },
    developerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    developerCard: {
        alignItems: 'center',
        backgroundColor: '#1f1f1f',
        borderRadius: 10,
        padding: 10,
        flex: 1,
        margin: 5,
    },
    developerName: {
        color: '#000',
        fontWeight: 'bold',
        marginTop: 5,
    },
    developerRole: {
        color: '#666',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#000',
    },
    footerText: {
        color: '#FFF',
    },
    footerLink: {
        color: '#FFF',
        marginVertical: 5,
    },
});

export default InfoScreen;
