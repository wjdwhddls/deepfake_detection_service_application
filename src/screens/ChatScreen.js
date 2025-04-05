import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button } from 'react-native';
import axios from 'axios';

const BoardScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 게시글 목록을 불러오는 함수
  const fetchPosts = async () => {
    try {
      const response = await axios.get('api/dashboard'); // 실제 API 엔드포인트로 변경 필요
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 게시글 아이템 렌더링
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => {
        // 게시글 상세 페이지로 이동 (예: navigation.navigate('PostDetail', { postId: item.POST_ID }))
      }}
    >
      <Text style={styles.postTitle}>{item.TITLE}</Text>
      <Text style={styles.postAuthor}>작성자 ID: {item.USER_ID}</Text>
      <Text style={styles.postDate}>작성일: {new Date(item.DATE).toLocaleString()}</Text>
      <Text style={styles.postLikes}>좋아요: {item.LIKE_NUM || 0}</Text>
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
      {/* ChatScreen에서 가져온 버튼 */}
      <Button
        title="채팅 화면으로 이동"
        onPress={() => {
          // navigation.navigate('ChatScreen'); // 네비게이션 사용 시 활성화
        }}
        style={styles.chatButton}
      />

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.POST_ID.toString()}
        ListHeaderComponent={<Text style={styles.header}>게시판</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  postItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  postLikes: {
    fontSize: 12,
    color: '#ff6b6b',
  },
  chatButton: {
    marginBottom: 16, // 버튼과 게시판 사이 간격 조정
  },
});

export default BoardScreen;
