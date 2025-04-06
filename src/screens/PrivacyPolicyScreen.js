import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext'; // useTheme 훅 import 추가

const PrivacyPolicyScreen = ({ navigation }) => {
    const { isLightMode } = useTheme(); // 현재 테마 정보 가져오기

    return (
        <View style={styles.container(isLightMode)}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title(isLightMode)}>개인정보 처리방침</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle(isLightMode)}>1. 수집하는 데이터 유형</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    우리는 사용자의 개인정보 보호를 최우선으로 생각합니다. 회원가입 시 다음과 같은 정보를 수집합니다:
                </Text>
                <Text style={styles.listItem(isLightMode)}>• 닉네임</Text>
                <Text style={styles.listItem(isLightMode)}>• 이메일</Text>
                <Text style={styles.listItem(isLightMode)}>• 비밀번호</Text>
                <Text style={styles.listItem(isLightMode)}>• 성별</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    이러한 정보는 사용자의 식별 및 서비스 제공을 위해 필요합니다. 또한, 사용자 간 소통을 위한 게시판 기능을 제공합니다.
                </Text>

                <Text style={styles.sectionTitle(isLightMode)}>2. 개인 데이터의 사용</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    수집된 개인 데이터는 다음과 같은 용도로 사용됩니다:
                </Text>
                <Text style={styles.listItem(isLightMode)}>• 사용자 간 소통을 위한 게시판 운영</Text>
                <Text style={styles.listItem(isLightMode)}>• 통화 내용 요청 추가 시 필요 데이터 활용</Text>

                <Text style={styles.sectionTitle(isLightMode)}>3. 개인 데이터의 공개</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    우리는 사용자의 개인 데이터를 제3자와 공유하지 않으며, 법적 요구 사항이 없는 한 개인 정보를 안전하게 보호합니다. 또한, 사용자는 자신의 개인정보 접근 및 수정 권리를 갖습니다.
                </Text>

                <Text style={styles.sectionTitle(isLightMode)}>4. 권한 관리</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    사용자지는 앱 이용 중 필요한 권한을 직접 관리할 수 있습니다. 
                </Text>

                <Text style={styles.sectionTitle(isLightMode)}>5. 개인정보 보호의 의무</Text>
                <Text style={styles.sectionContent(isLightMode)}>
                    우리는 적절한 기술적 및 관리적 조치를 통해 사용자의 개인정보를 보호하며, 관련 있는 직원만 데이터에 접근할 수 있도록 합니다.
                </Text>

                <Text style={styles.sectionContent(isLightMode)}>
                    본 개인정보 보호정책은 서비스 제공 법적 요구 사항에 따라 수시로 업데이트될 수 있습니다.
                </Text>
            </ScrollView>
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
        justifyContent: 'flex-start',
        marginBottom: 30,
        marginTop: 40,
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
    content: {
        marginBottom: 20,
    },
    sectionTitle: (isLightMode) => ({
        fontSize: 18,
        color: isLightMode ? '#007AFF' : '#FFF', // 제목 색상 (라이트 모드에서 파란색)
        marginBottom: 10,
        marginTop: 20,
        fontWeight: 'bold', // 강조 표기
    }),
    sectionContent: (isLightMode) => ({
        color: isLightMode ? '#000' : '#B0B0B0', // 내용 색상
        fontSize: 16,
        marginBottom: 15,
    }),
    listItem: (isLightMode) => ({
        color: isLightMode ? '#000' : '#B0B0B0', // 목록 항목 색상
        fontSize: 16,
        marginLeft: 20,
        marginBottom: 5,
    }),
});

export default PrivacyPolicyScreen;
