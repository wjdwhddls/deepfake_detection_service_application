import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

// 옵션: LinearGradient (설치되어 있으면 자동 사용)
let LinearGradientComp = null;
try {
  LinearGradientComp = require('react-native-linear-gradient').default;
} catch (e) {
  LinearGradientComp = null;
}

const FOOTER_HEIGHT = 56;
// 푸터 텍스트가 필요하면 아래에 문자열을 넣어주세요. 비워두면 표시되지 않습니다.
const FOOTER_TEXT = ''; // 예: '© 2024 Company name, All rights reserved.'

const PrivacyPolicyScreen = ({ navigation }) => {
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);

  const Background = ({ children }) =>
    LinearGradientComp ? (
      <LinearGradientComp
        colors={isLightMode ? ['#0ea5e9', '#6366f1'] : ['#0b1220', '#1f2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {children}
      </LinearGradientComp>
    ) : (
      <View style={[styles.container, { backgroundColor: isLightMode ? '#E8EEFF' : '#0b1220' }]}>
        {children}
      </View>
    );

  return (
    <Background>
      <View style={styles.page}>
        {/* AppBar: 뒤로가기 좌측 고정, 타이틀 중앙 */}
        <View style={styles.appbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.appbarBack}>
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>개인정보 처리방침</Text>
        </View>

        {/* 스크롤 콘텐츠: 푸터가 있을 경우 가리지 않도록 paddingBottom 추가 */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: (FOOTER_TEXT ? FOOTER_HEIGHT + 16 : 24) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 정책 카드(섀도 삭제, 유리감+보더만 적용) */}
          <View style={styles.policyCard}>
            <Text style={styles.sectionTitle}>1. 수집하는 데이터 유형</Text>
            <Text style={styles.sectionContent}>
              우리는 사용자의 개인정보 보호를 최우선으로 생각합니다. 회원가입 시 다음과 같은 정보를 수집합니다:
            </Text>
            <Text style={styles.listItem}>• 닉네임</Text>
            <Text style={styles.listItem}>• 이메일</Text>
            <Text style={styles.listItem}>• 비밀번호</Text>
            <Text style={styles.listItem}>• 성별</Text>
            <Text style={styles.sectionContent}>
              이러한 정보는 사용자의 식별 및 서비스 제공을 위해 필요합니다. 또한, 사용자 간 소통을 위한 게시판 기능을 제공합니다.
            </Text>

            <Text style={styles.sectionTitle}>2. 개인 데이터의 사용</Text>
            <Text style={styles.sectionContent}>수집된 개인 데이터는 다음과 같은 용도로 사용됩니다:</Text>
            <Text style={styles.listItem}>• 사용자 간 소통을 위한 게시판 운영</Text>
            <Text style={styles.listItem}>• 통화 내용 요청 추가 시 필요 데이터 활용</Text>

            <Text style={styles.sectionTitle}>3. 개인 데이터의 공개</Text>
            <Text style={styles.sectionContent}>
              우리는 사용자의 개인 데이터를 제3자와 공유하지 않으며, 법적 요구 사항이 없는 한 개인 정보를 안전하게 보호합니다.
              또한, 사용자는 자신의 개인정보 접근 및 수정 권리를 갖습니다.
            </Text>

            <Text style={styles.sectionTitle}>4. 권한 관리</Text>
            <Text style={styles.sectionContent}>
              사용자지는 앱 이용 중 필요한 권한을 직접 관리할 수 있습니다.
            </Text>

            <Text style={styles.sectionTitle}>5. 개인정보 보호의 의무</Text>
            <Text style={styles.sectionContent}>
              우리는 적절한 기술적 및 관리적 조치를 통해 사용자의 개인정보를 보호하며, 관련 있는 직원만 데이터에 접근할 수 있도록 합니다.
            </Text>

            <Text style={styles.sectionContent}>
              본 개인정보 보호정책은 서비스 제공 법적 요구 사항에 따라 수시로 업데이트될 수 있습니다.
            </Text>
          </View>
        </ScrollView>

        {/* 하단 고정 푸터: 텍스트가 있을 때만 표시 */}
        {FOOTER_TEXT ? (
          <View style={styles.footerBar}>
            <Text style={styles.footerText}>{FOOTER_TEXT}</Text>
          </View>
        ) : null}
      </View>
    </Background>
  );
};

// 스타일(섀도 제거, 반투명 카드 + 보더 유지)
const getStyles = (isLightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    page: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 0,
    },

    // AppBar
    appbar: {
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    appbarBack: {
      position: 'absolute',
      left: 4,
      padding: 4,
    },
    appbarTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },

    // 정책 카드
    policyCard: {
      backgroundColor: isLightMode ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: isLightMode ? 'rgba(15,23,42,0.08)' : 'rgba(229,231,235,0.10)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 16,
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      marginBottom: 10,
      marginTop: 16,
      fontWeight: '700',
    },
    sectionContent: {
      color: isLightMode ? '#334155' : '#cbd5e1',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    listItem: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 14,
      lineHeight: 20,
      marginLeft: 8,
      marginBottom: 6,
    },

    // 하단 고정 푸터
    footerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: FOOTER_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      backgroundColor: 'transparent', // 필요 시 반투명 배경으로 변경 가능
      borderTopWidth: 1,
      borderTopColor: isLightMode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)',
    },
    footerText: {
      color: 'rgba(255,255,255,0.90)',
      fontSize: 12,
      textAlign: 'center',
    },
  });

export default PrivacyPolicyScreen;