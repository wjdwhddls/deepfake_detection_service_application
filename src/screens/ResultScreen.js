import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext'; // 컨텍스트 import

const { width } = Dimensions.get('window');

const ResultScreen = ({ route }) => {
  const resultData = route.params?.result;
  const { isLightMode } = useTheme(); // 테마 값 획득
  const styles = getDynamicStyles(isLightMode); // 동적 스타일 생성

  // 라이트/다크별 그라데이션 팔레트
  const gradientColors = isLightMode
    ? ['#E0EAFC', '#CFDEF3', '#fcfff7']
    : ['#232526', '#414345', '#0f2027'];

  if (!resultData) {
    return (
      <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>결과 데이터를 확인할 수 없습니다.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
      <View style={styles.container}>
        <View style={[styles.resultContainer, styles.shadow]}>
          <Text style={styles.title}>📊 분석 결과</Text>
          <Text style={styles.resultText}>
            <Text style={styles.resultLabel}>결과: </Text>
            {resultData.result || '데이터 없음'}
          </Text>
        </View>
        <View style={styles.imageContainer}>
          {resultData.imageUri ? (
            <Image
              style={styles.image}
              source={{ uri: resultData.imageUri }}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>이미지를 찾을 수 없습니다.</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

// 전문성있고 다크/라이트 대응되는 스타일
const getDynamicStyles = (isLightMode) =>
  StyleSheet.create({
    gradientContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      width: '92%',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 24,
      marginTop: 25,
      marginBottom: 25,
      borderRadius: 24,
      backgroundColor: isLightMode ? '#ffffffee' : '#222C36cc',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 8,
    },
    resultContainer: {
      width: '100%',
      padding: 24,
      backgroundColor: isLightMode ? '#f9f9fb' : '#181e26',
      borderRadius: 18,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: isLightMode ? '#e6eefb' : '#333b47',
    },
    title: {
      fontSize: 27,
      fontWeight: 'bold',
      color: isLightMode ? '#334488' : '#b0cfff',
      marginBottom: 13,
      letterSpacing: 1,
      textShadowColor: isLightMode ? '#e3eafd' : '#0e1526',
      textShadowOffset: { width: 1, height: 2 },
      textShadowRadius: 3,
    },
    resultText: {
      fontSize: 19,
      color: isLightMode ? '#333a50' : '#e3eafd',
      textAlign: 'center',
      marginVertical: 6,
    },
    resultLabel: {
      fontWeight: 'bold',
      color: isLightMode ? '#2196F3' : '#8ebeef',
    },
    imageContainer: {
      width: width * 0.85,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: isLightMode ? '#d0d8e6' : '#333b47',
      backgroundColor: isLightMode ? '#f2f6fd' : '#222C36',
      shadowColor: isLightMode ? '#b5becd' : '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    placeholderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    placeholderText: {
      fontSize: 17,
      color: isLightMode ? '#888' : '#bbb',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 26,
      borderRadius: 18,
      backgroundColor: isLightMode ? '#fff3f4' : '#2a1717',
      borderWidth: 1.2,
      borderColor: isLightMode ? '#facccc' : '#5f2042',
    },
    errorText: {
      fontSize: 20,
      color: isLightMode ? '#fa2b2b' : '#ff8cb3',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.13,
      shadowRadius: 8,
      elevation: 3,
    },
  });

export default ResultScreen;
