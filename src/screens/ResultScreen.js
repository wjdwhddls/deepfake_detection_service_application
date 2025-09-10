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

          {/* 이미지 경로에 따라 이미지를 표시 */}
          <View style={styles.imageContainer}>
            {resultData.imageUri ? (
              <Image
                style={styles.image}
                source={{ uri: resultData.imageUri }} // resultData.imageUri 사용
                resizeMode="contain"
              />
            ) : (
              <Image
                style={styles.image}
                source={require('../assets/image2.png')} // 기본 이미지 경로
                resizeMode="contain"
              />
            )}
          </View>

          <Text style={styles.resultText}>
            <Text style={styles.resultLabel}>결과: </Text>
            {resultData.result || '데이터 없음'}
          </Text>

          {/* 추가적인 이미지를 포함한 영역 */}
          <View style={styles.additionalImageContainer}>
            <Image
              style={styles.additionalImage}
              source={require('../assets/image.png')} // 기본 이미지 경로
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>필독: 아래 정보를 확인하세요.</Text>
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
      justifyContent: 'flex-start', // Flex-direction 변경
      padding: 20,
      marginTop: 20,
      marginBottom: 20,
      borderRadius: 16,
      backgroundColor: isLightMode ? '#ffffff' : '#222C36',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    resultContainer: {
      width: '100%',
      padding: 24,
      backgroundColor: isLightMode ? '#f9f9fb' : '#2b2b2b',
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isLightMode ? '#e6eefb' : '#555',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isLightMode ? '#333' : '#e3eafd',
      marginBottom: 10,
    },
    resultText: {
      fontSize: 18,
      color: isLightMode ? '#333' : '#e3eafd',
      textAlign: 'center',
      marginVertical: 8,
    },
    resultLabel: {
      fontWeight: 'bold',
      color: isLightMode ? '#2196F3' : '#8ebeef',
    },
    imageContainer: {
      width: '100%', // 이미지 컨테이너가 화면 가득 차도록
      height: 250, // 높이 조정
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 3,
      backgroundColor: isLightMode ? '#f2f6fd' : '#222C36',
    },
    image: {
      width: '120%',
      height: '100%',
      borderRadius: 12,
    },
    additionalImageContainer: {
      width: '200%', // 컨테이너 너비를 더 늘림
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 0,
    },
    additionalImage: {
      width: '100%', // 컨테이너 기준 100% 유지
      height: 200,   // 이미지 높이를 더 크게
      borderRadius: 12,
    },


    placeholderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginTop: 20,
    },
    placeholderText: {
      fontSize: 16,
      color: isLightMode ? '#888' : '#bbb',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      borderRadius: 18,
      backgroundColor: isLightMode ? '#fff3f4' : '#2a1717',
      borderWidth: 1,
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
