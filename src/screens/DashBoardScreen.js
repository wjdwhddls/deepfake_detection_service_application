import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const DashBoardScreen = ({ navigation }) => {
  const [dashBoards, setDashBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);

  // 대시보드 데이터 가져오기
  const fetchDashBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('토큰이 없습니다. 다시 로그인 해주세요.');
      }

      const response = await axios.get('http://10.0.2.2:3000/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const sortedDashBoards = response.data.data.sort((a, b) => b.id - a.id);
        setDashBoards(sortedDashBoards);
      } else {
        throw new Error('대시보드 데이터가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('대시보드 불러오기 실패:', error);
      setError(error.response 
        ? error.response.data.message || '데이터를 불러오는 데 문제가 발생했습니다.' 
        : '네트워크 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 새로 고침 핸들러
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashBoards();
  };

  useEffect(() => {
    fetchDashBoards();
  }, []);

  // 대시보드 항목 렌더링
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dashBoardItem}
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <Text style={styles.dashBoardTitle}>{item.title}</Text> {/* 제목 */}
      <Text style={styles.dashBoardAuthor}>작성자 ID: {item.userId}</Text> {/* 작성자 ID */}
      <Text style={styles.dashBoardContents}>{item.text}</Text> {/* 내용 */}
      <Text style={styles.dashBoardLikes}>좋아요: {item.like_num !== null ? item.like_num : 0}</Text> {/* 좋아요 수 */}
    </TouchableOpacity>
  );

  // 로딩 중일 때
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text> {/* 로딩 텍스트 */}
      </View>
    );
  }

  // 오류가 발생했을 때
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text> {/* 오류 메시지 */}
      </View>
    );
  }

  // 대시보드 내용 렌더링
  return (
    <View style={styles.container}>
      <FlatList
        data={dashBoards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={styles.header}>대시보드</Text>} // 헤더
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('WritePost')}
      >
        <Text style={styles.fabText}>+</Text> {/* 추가 버튼 텍스트 */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isLightMode ? '#FFF' : '#000',
  },
  loadingText: {
    marginTop: 10,
    color: isLightMode ? '#000' : '#FFF',
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
    backgroundColor: '#1DA1F2',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DashBoardScreen;
