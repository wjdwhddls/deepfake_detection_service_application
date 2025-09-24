import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

// 옵션: LinearGradient (설치되어 있으면 자동 사용)
let LinearGradientComp = null;
try {
  // yarn add react-native-linear-gradient && (iOS) pod install
  LinearGradientComp = require('react-native-linear-gradient').default;
} catch (e) {
  LinearGradientComp = null;
}

const FOOTER_HEIGHT = 56; // 하단 고정 푸터 높이

const FAQScreen = ({ navigation }) => {
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState(null);
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);

  const questions = [
    { question: '자주 묻는 질문 1', answer: '자주 묻는 질문 내용 1' },
    { question: '자주 묻는 질문 2', answer: '자주 묻는 질문 내용 2' },
    {
      question: '자주 묻는 질문 3',
      answer:
        '자주 묻는 질문 내용 3입니다. 내용 내용 내용 내용 내용 내용 내용 내용 내용 내용.',
    },
    { question: '자주 묻는 질문 4', answer: '자주 묻는 질문 내용 4' },
  ];

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
        {/* AppBar: 뒤로가기 좌측 고정, 타이틀 중앙 */}
        <View style={styles.appbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.appbarBack}
            accessibilityLabel="뒤로가기"
          >
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>자주 묻는 질문</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: FOOTER_HEIGHT + 16 }, // 푸터에 가리지 않도록 확보
          ]}
          showsVerticalScrollIndicator={false}
        >
          {questions.map((item, index) => {
            const expanded = expandedQuestionIndex === index;
            return (
              <View key={index} style={styles.qaItem}>
                <TouchableOpacity
                  style={styles.qaHeader}
                  onPress={() =>
                    setExpandedQuestionIndex(expanded ? null : index)
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  <Icon
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={isLightMode ? '#0f172a' : '#e5e7eb'}
                  />
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.qaBody}>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* 하단 고정 푸터 */}
        <View style={styles.footerBar}>
          <Text style={styles.footerText}>
            ※ 추가 문의사항은 HONGIK123@g.hongik.ac.kr로 문의주시길 바랍니다.
          </Text>
        </View>
      </View>
    </Background>
  );
};

// 스타일 (섀도/엘리베이션 제거, 유리감 카드 유지)
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
      // paddingBottom은 런타임에서 FOOTER_HEIGHT 기준으로 추가
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

    // QA 카드(섀도 없음)
    qaItem: {
      backgroundColor: isLightMode
        ? 'rgba(255,255,255,0.70)'
        : 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: isLightMode
        ? 'rgba(15,23,42,0.08)'
        : 'rgba(229,231,235,0.10)',
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
    },
    qaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    question: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
      paddingRight: 8,
    },
    qaBody: {
      borderTopWidth: 1,
      borderTopColor: isLightMode
        ? 'rgba(15,23,42,0.06)'
        : 'rgba(229,231,235,0.08)',
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: isLightMode
        ? 'rgba(255,255,255,0.80)'
        : 'rgba(255,255,255,0.04)',
    },
    answer: {
      color: isLightMode ? '#334155' : '#cbd5e1',
      fontSize: 14,
      lineHeight: 20,
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
      backgroundColor: 'transparent', // 필요 시 배경 추가 가능
      borderTopWidth: 1,
      borderTopColor: isLightMode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)',
    },
    footerText: {
      color: 'rgba(255,255,255,0.90)',
      fontSize: 12,
      textAlign: 'center',
    },
  });

export default FAQScreen;