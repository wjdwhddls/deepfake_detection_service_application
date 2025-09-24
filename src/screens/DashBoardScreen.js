import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const DashBoardScreen = ({ navigation }) => {
  const [dashBoards, setDashBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);

  const fetchDashBoards = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('다시 로그인 해주세요.');

      const url = query
        ? `http://ec2-43-203-141-45.ap-northeast-2.compute.amazonaws.com/api/dashboard/search?title=${query}`
        : 'http://ec2-43-203-141-45.ap-northeast-2.compute.amazonaws.com/api/dashboard';

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const sortedDashBoards = response.data.data.sort((a, b) => b.id - a.id);
        setDashBoards(sortedDashBoards);
      } else {
        throw new Error('대시보드 데이터가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('대시보드 불러오기 실패:', error);
      setError(
        error.response
          ? error.response.data.message || '데이터를 불러오는 데 문제가 발생했습니다.'
          : '네트워크 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashBoards();
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      Alert.alert('입력 오류', '제목 키워드는 반드시 입력해야 합니다.');
      return;
    }
    fetchDashBoards(searchQuery.trim());
  };

  useEffect(() => {
    fetchDashBoards();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dashBoardItem}
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <Text style={styles.dashBoardTitle}>{item.title}</Text>
      <Text style={styles.dashBoardAuthor}>작성자 ID: {item.userId}</Text>
      <Text style={styles.dashBoardContents}>{item.text}</Text>
      <Text style={styles.dashBoardLikes}>좋아요: {item.like_num !== null ? item.like_num : 0}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="제목 검색..."
          placeholderTextColor={isLightMode ? '#666' : '#A9A9A9'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          keyboardType="default"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dashBoards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={styles.header}>대시보드</Text>}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('WritePost')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isLightMode) => StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: isLightMode ? '#FFF' : '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isLightMode ? '#FFF' : '#000' },
  loadingText: { marginTop: 10, color: isLightMode ? '#000' : '#FFF' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: isLightMode ? '#000' : '#FFF' },
  dashBoardItem: {
    backgroundColor: isLightMode ? '#EEE' : '#1e1e1e',
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: isLightMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  dashBoardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: isLightMode ? '#000' : '#FFF' },
  dashBoardAuthor: { fontSize: 14, color: isLightMode ? '#000' : '#A9A9A9', marginBottom: 4 },
  dashBoardContents: { fontSize: 14, color: isLightMode ? '#000' : '#A9A9A9', marginBottom: 4 },
  dashBoardLikes: { fontSize: 12, color: '#007AFF' },
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
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', marginBottom: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    padding: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    color: isLightMode ? '#000' : '#FFF',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default DashBoardScreen;