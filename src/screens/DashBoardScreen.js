// DashBoardScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext'; // 추가된 부분

const DashBoardScreen = ({ navigation }) => {
  const [dashBoards, setDashBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLightMode } = useTheme(); // 테마 상태 가져오기
  const styles = getStyles(isLightMode); // 테마에 따른 스타일 적용

  // 대시보드 데이터 불러오기
  const fetchDashBoards = async () => {
    try {
      const response = await axios.get('api/dashboard'); // 실제 API 엔드포인트로 변경 필요
      setDashBoards(response.data);
      setLoading(false);
    } catch (error) {
      console.error('대시보드 불러오기 실패:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashBoards();
  }, []);

  // 대시보드 아이템 렌더링
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dashBoardItem}
      onPress={() => {
        navigation.navigate('DashBoardDetail', { dashBoardId: item.DASHBOARD_ID });
      }}
    >
      <Text style={styles.dashBoardTitle}>{item.TITLE}</Text>
      <Text style={styles.dashBoardAuthor}>작성자 ID: {item.USER_ID}</Text>
      <Text style={styles.dashBoardDate}>작성일: {new Date(item.DATE).toLocaleString()}</Text>
      <Text style={styles.dashBoardLikes}>좋아요: {item.LIKE_NUM || 0}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => {
          navigation.navigate('ChatScreen');
        }}
      >
        <Text style={styles.chatButtonText}>채팅 화면으로 이동</Text>
      </TouchableOpacity>

      <FlatList
        data={dashBoards}
        renderItem={renderItem}
        keyExtractor={(item) => item.DASHBOARD_ID.toString()}
        ListHeaderComponent={<Text style={styles.header}>대시보드</Text>}
      />
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
  dashBoardDate: {
    fontSize: 12,
    color: isLightMode ? '#666' : '#A9A9A9',
    marginBottom: 4,
  },
  dashBoardLikes: {
    fontSize: 12,
    color: '#007AFF',
  },
  chatButton: {
    backgroundColor: isLightMode ? '#EEE' : '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  chatButtonText: {
    color: isLightMode ? '#000' : '#FFF',
    fontSize: 18,
  },
});

export default DashBoardScreen;
