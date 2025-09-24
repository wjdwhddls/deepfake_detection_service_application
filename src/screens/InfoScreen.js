import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
  import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

// 옵션: LinearGradient (설치 시 자동 사용)
let LinearGradientComp = null;
try {
  LinearGradientComp = require('react-native-linear-gradient').default;
} catch (e) {
  LinearGradientComp = null;
}

// 개발자 데이터 (기존 유지)
const developers = [
  { name: '김찬주', role: '백엔드', icon: 'code-slash' },
  { name: '장사민', role: '프론트엔드', icon: 'laptop' },
  { name: '홍길동', role: '디자이너', icon: 'brush' },
  { name: '고유정', role: 'QA', icon: 'checkmark-circle' },
];

const FOOTER_HEIGHT = 74; // 푸터 높이(ScrollView padding용)

const InfoScreen = () => {
  const navigation = useNavigation();
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
      <View
        style={[
          styles.container,
          { backgroundColor: isLightMode ? '#E8EEFF' : '#0b1220' },
        ]}
      >
        {children}
      </View>
    );

  return (
    <Background>
      <View style={styles.page}>
        {/* AppBar: 뒤로가기 왼쪽 고정, 타이틀 정중앙 */}
        <View style={styles.appbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.appbarBack}
            accessibilityLabel="뒤로가기"
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>정보</Text>
        </View>

        {/* 스크롤 콘텐츠: 푸터 높이만큼 paddingBottom 확보 */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: FOOTER_HEIGHT + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 사업 취지 카드 */}
          <View style={[styles.card, styles.shadowCard]}>
            <Text style={styles.cardTitle}>사업 취지</Text>
            <Text style={styles.cardBody}>
              주저리 주저리 어쩌구 저쩌구 {'~'.repeat(50)} {'~'.repeat(30)} 이렇게 긍정적 효과를 주기 위해 만들게 되었다.
            </Text>
          </View>

          {/* 개발자들 카드 */}
          <View style={[styles.card, styles.shadowCard]}>
            <Text style={styles.cardTitle}>개발자들</Text>
            <View style={styles.developerContainer}>
              {developers.map((dev) => (
                <View key={dev.name} style={styles.developerCard}>
                  <View style={styles.devIconBadge}>
                    <Icon
                      name={dev.icon}
                      size={22}
                      color={isLightMode ? '#0f172a' : '#e5e7eb'}
                    />
                  </View>
                  <Text style={styles.developerName}>{dev.name}</Text>
                  <Text style={styles.developerRole}>{dev.role}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* 하단 고정 푸터 */}
        <View style={styles.footerBar}>
          <Text style={styles.footerText}>© 2024 Company name, All rights reserved.</Text>
          <Text style={styles.footerLink}>Contact Us</Text>
          <Text style={styles.footerLink}>Follow us on Instagram</Text>
        </View>
      </View>
    </Background>
  );
};

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
      padding: 16,
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

    // 카드(유리감)
    card: {
      backgroundColor: isLightMode
        ? 'rgba(255,255,255,0.65)'
        : 'rgba(17,24,39,0.60)',
      borderColor: isLightMode
        ? 'rgba(255,255,255,0.65)'
        : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
    cardBody: {
      color: isLightMode ? '#334155' : '#cbd5e1',
      fontSize: 14,
      lineHeight: 20,
    },

    // 개발자 목록
    developerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    developerCard: {
      width: '48%',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 10,
      backgroundColor: isLightMode ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: isLightMode ? 'rgba(15,23,42,0.08)' : 'rgba(229,231,235,0.10)',
      alignItems: 'center',
      marginBottom: 10,
    },
    devIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLightMode ? 'rgba(15,23,42,0.06)' : 'rgba(229,231,235,0.08)',
      marginBottom: 8,
    },
    developerName: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontWeight: '700',
      fontSize: 14,
      marginTop: 2,
    },
    developerRole: {
      color: isLightMode ? '#64748b' : '#94a3b8',
      fontSize: 12,
      marginTop: 2,
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
      paddingVertical: 12,
      backgroundColor: 'transparent', // 필요 시 반투명 배경으로 변경 가능
      borderTopWidth: 1,
      borderTopColor: isLightMode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)',
    },
    footerText: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.90)',
      fontSize: 12,
      marginTop: 2,
    },
    footerLink: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.90)',
      fontSize: 12,
      marginTop: 4,
      textDecorationLine: 'underline',
    },
  });

export default InfoScreen;