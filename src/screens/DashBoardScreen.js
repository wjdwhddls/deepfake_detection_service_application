import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage import
import { useTheme } from '../contexts/ThemeContext'; // 테마 컨텍스트 import

const DashBoardScreen = ({ navigation }) => {
  const [dashBoards, setDashBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 오류 상태 추가
  const { isLightMode } = useTheme(); // 테마 상태 가져오기
  const styles = getStyles(isLightMode); // 테마에 따른 스타일 적용

  // 대시보드 데이터 불러오기
  const fetchDashBoards = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // AsyncStorage에서 JWT 토큰 가져오기

      if (!token) {
        throw new Error('토큰이 없습니다. 다시 로그인 해주세요.'); // 토큰이 없을 경우 오류 발생
      }

      const response = await axios.get('http://10.0.2.2:3000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 포함
        },
      });

      // 응답 데이터 확인
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const sortedDashBoards = response.data.data.sort((a, b) => 
          new Date(b.id) - new Date(a.id) // 대시보드를 ID로 정렬
        );
        setDashBoards(sortedDashBoards);
      } else {
        throw new Error('대시보드 데이터가 올바르지 않습니다.'); // 데이터가 올바르지 않을 경우 오류 발생
      }
    } catch (error) {
      console.error('대시보드 불러오기 실패:', error); // 상세한 로깅
      
      // 오류 상태 업데이트. 이곳에서 401 오류일 경우 특별 처리 하지 않음
      if (error.response) {
        // Response를 통해 401 오류 확인
        if (error.response.status === 401) {
          console.warn('인증 오류: 401'); // 인증 오류 로깅
          setError('인증되지 않은 사용자입니다. 토큰을 확인하세요.'); // 사용자에게 보여줄 오류 메시지 설정
        } else {
          setError(error.message || '데이터를 불러오는 데 문제가 발생했습니다.'); // 다른 오류 처리
        }
      } else {
        setError('네트워크 오류가 발생했습니다.'); // 네트워크 오류 처리
      }
    } finally {
      setLoading(false); // 데이터 불러오기 완료
    }
  };

  useEffect(() => {
    fetchDashBoards(); // 컴포넌트 마운트 시 데이터 불러오기
  }, []);

  // 대시보드 아이템 렌더링
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dashBoardItem}
      onPress={() => {
        navigation.navigate('DashBoardDetail', { dashBoardId: item.id }); // id를 통해 대시보드 상세 화면으로 이동
      }}
    >
      <Text style={styles.dashBoardTitle}>{item.title}</Text>
      <Text style={styles.dashBoardAuthor}>작성자 ID: {item.author}</Text> {/* author 변경 */}
      <Text style={styles.dashBoardContents}>{item.contents}</Text> {/* contents 추가 */}
      <Text style={styles.dashBoardLikes}>좋아요: {item.like_num !== null ? item.like_num : 0}</Text> {/* 수정된 like_num 사용 */}
    </TouchableOpacity>
  );

  // 로딩 중일 때
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text> {/* 텍스트가 적절히 감싸져 있는지 확인 */}
      </View>
    );
  }

  // 오류가 있을 경우
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text> {/* 오류 메시지 표시 */}
      </View>
    );
  }

  // 로딩이 완료되고 데이터가 있을 때
  return (
    <View style={styles.container}>
      <FlatList
        data={dashBoards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} // 아이디를 사용하여 keyExtractor 설정
        ListHeaderComponent={<Text style={styles.header}>대시보드</Text>} // 헤더에서도 텍스트가 적절히 감싸져 있습니다.
        showsVerticalScrollIndicator={false}
      />
      
      {/* + 버튼 추가 */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          navigation.navigate('WritePost'); // 글 작성 화면으로 이동
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// 테마에 따른 스타일 동적 적용
const getStyles = (isLightMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: isLightMode ? '#FFF' : '#000',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: isLightMode ? '#000' : '#FFF',
  },
  dashBoardItem: {
    backgroundColor: isLightMode ? '#EEE' : '#1e1e1e',
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  dashBoardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: isLightMode ? '#000' : '#FFF',
  },
  dashBoardAuthor: {
    fontSize: 14,
    color: isLightMode ? '#666' : '#A9A9A9',
    marginBottom: 4,
  },
  dashBoardContents: {
    fontSize: 14,
    color: isLightMode ? '#333' : '#A9A9A9',
    marginBottom: 4,
  },
  dashBoardLikes: {
    fontSize: 12,
    color: '#007AFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    backgroundColor: '#1DA1F2', // 트위터와 같은 파란색
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // 안드로이드 그림자 효과
    shadowColor: '#000', // iOS 그림자 색상
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red', // 오류 메시지는 빨간색으로 표시
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DashBoardScreen;
