import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext'; // 이 부분은 실제 사용한 ThemeContext의 위치에 따라 수정하세요.
import Icon from 'react-native-vector-icons/FontAwesome'; // FontAwesome 아이콘 사용

const PostDetailScreen = () => {
  const [post, setPost] = useState(null); // 게시물 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 오류 상태
  const [liked, setLiked] = useState(false); // 좋아요 상태
  const [comments, setComments] = useState([]); // 댓글 목록 상태
  const [newComment, setNewComment] = useState(''); // 새 댓글 입력 상태
  const route = useRoute();
  const { id } = route.params; // 라우트에서 대시보드 ID 받기
  const { isLightMode } = useTheme(); // 현재 테마 가져오기

  // 특정 대시보드 데이터 가져오기
  const fetchPostDetail = async () => {
    setLoading(true); // 로딩 시작
    try {
      const token = await AsyncStorage.getItem('token'); // AsyncStorage에서 토큰 가져오기
      if (!token) {
        throw new Error('인증이 필요합니다.'); // 인증 오류 처리
      }

      const response = await axios.get(
        `http://ec2-43-203-141-45.ap-northeast-2.compute.amazonaws.com/api/dashboard/${id}/detail`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Bearer 토큰 사용
          },
        }
      );

      if (response.data && response.data.success) {
        setPost(response.data.data); // 상태 업데이트
        setComments(response.data.data.comments || []); // 댓글 목록 업데이트
      } else {
        throw new Error('대시보드 데이터가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('대시보드 불러오기 실패:', error);
      setError(
        error.response
          ? error.response.data.message
          : error.message || '대시보드를 불러오는 데 문제가 발생했습니다.'
      );
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 댓글 추가 기능
  const addComment = async () => {
    if (!newComment.trim()) return; // 댓글이 비어있을 때는 진행하지 않음

    const token = await AsyncStorage.getItem('token'); // AsyncStorage에서 토큰 가져오기
    try {
      const response = await axios.post(
        `http://172.30.1.52:3000/api/dashboard/${id}/comments`, // 댓글 추가 API URL
        { text: newComment }, // 새 댓글 데이터
        {
          headers: {
            Authorization: `Bearer ${token}`, // Bearer 토큰 사용
          },
        }
      );

      if (response.data && response.data.success) {
        // 새 댓글이 성공적으로 추가된 경우 댓글 목록을 업데이트
        setComments((prevComments) => [
          ...prevComments,
          response.data.data, // 새로운 댓글 추가 (서버가 리턴한 댓글)
        ]);
        setNewComment(''); // 입력 필드 초기화
      } else {
        throw new Error('댓글 추가에 실패했습니다.'); // 실패 시 에러 발생
      }
    } catch (error) {
      console.error('댓글 추가 실패:', error);
      alert('댓글 추가에 문제가 발생했습니다. 다시 시도하세요.'); // 사용자 피드백
    }
  };

  // 좋아요 추가/빼기 기능
  const handleLike = async () => {
    const token = await AsyncStorage.getItem('token'); // AsyncStorage에서 토큰 가져오기
    try {
      // 좋아요 상태 토글
      const newLikeStatus = !liked;
      setLiked(newLikeStatus); // 좋아요 상태 업데이트

      const response = await axios.post(
        `http://172.30.1.63:3000/api/dashboard/${id}/like`, // 좋아요 추가 API URL
        { liked: newLikeStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Bearer 토큰 사용
          },
        }
      );

      if (response.data && response.data.success) {
        // 응답이 성공하면 로컬 상태 업데이트
        setPost((prevPost) => ({
          ...prevPost,
          like_num: newLikeStatus ? prevPost.like_num + 1 : Math.max(prevPost.like_num - 1, 0),
        }));
      } else {
        throw new Error('좋아요 상태 업데이트 실패');
      }
    } catch (error) {
      console.error('좋아요 추가 실패:', error);
      alert('좋아요 처리 중 문제가 발생했습니다.'); // 사용자 피드백
    }
  };

  useEffect(() => {
    console.log('Fetching details for ID:', id); // ID 확인
    if (id) {
      fetchPostDetail(); // ID가 유효할 경우 데이터 가져오기
    } else {
      setError('유효하지 않은 대시보드 ID입니다.'); // 잘못된 ID일 경우
      setLoading(false); // 로딩 종료
    }
  }, [id]); // ID가 변경될 때마다 fetchPostDetail 호출

  // 로딩 중일 때
  if (loading) {
    return (
      <View style={styles.container(isLightMode)}>
        <ActivityIndicator size="large" color={isLightMode ? '#007AFF' : '#BB86FC'} />
      </View>
    );
  }

  // 오류가 있을 경우
  if (error) {
    return (
      <View style={styles.container(isLightMode)}>
        <Text style={styles.errorText(isLightMode)}>{error}</Text>
      </View>
    );
  }

  // 대시보드 데이터 표시
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container(isLightMode)}
    >
      <ScrollView>
        <View style={styles.card(isLightMode)}>
          {post.image && (
            <Image source={{ uri: post.image }} style={styles.image} />
          )}
          <Text style={styles.title(isLightMode)}>{post.title}</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.author(isLightMode)}>작성자: {post.userId}</Text>
            <Text style={styles.date(isLightMode)}>
              {new Date(post.createdAt).toLocaleString('ko-KR')}
            </Text>
          </View>
          <Text style={styles.contents(isLightMode)}>{post.text}</Text>
          <View style={styles.likeContainer}>
            <TouchableOpacity onPress={handleLike}>
              <Icon
                name={liked ? 'heart' : 'heart-o'}
                size={24}
                color={liked ? 'red' : isLightMode ? '#000' : '#FFF'}
                style={styles.heartIcon}
              />
            </TouchableOpacity>
            <Text style={styles.likes(isLightMode)}>좋아요: {post.like_num || 0}</Text>
          </View>
        </View>

        {/* 댓글 표시 영역 */}
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle(isLightMode)}>댓글</Text>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <View style={styles.comment} key={comment.id}>
                <Text style={styles.commentText(isLightMode)}>{comment.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noComments(isLightMode)}>댓글이 없습니다.</Text>
          )}
        </View>

        {/* 댓글 입력 영역 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="댓글을 달아주세요..."
            placeholderTextColor={isLightMode ? '#888' : '#CCC'}
            value={newComment}
            onChangeText={setNewComment}
            multiline={true} // 멀티라인 입력 허용
          />
          <TouchableOpacity onPress={addComment} style={styles.button}>
            <Text style={styles.buttonText}>추가</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: (isLightMode) => ({
    flex: 1,
    backgroundColor: isLightMode ? '#ffffff' : '#121212',
  }),
  card: (isLightMode) => ({
    backgroundColor: isLightMode ? '#fff' : '#1E1E1E',
    borderRadius: 12,
    elevation: 5,
    marginBottom: 20,
    padding: 15,
  }),
  errorText: (isLightMode) => ({
    color: isLightMode ? 'red' : '#FFB0B0',
    textAlign: 'center',
    marginTop: 20,
  }),
  title: (isLightMode) => ({
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: isLightMode ? '#000' : '#FFF',
  }),
  author: (isLightMode) => ({
    fontSize: 16,
    marginBottom: 5,
    color: isLightMode ? '#555' : '#FFF',
  }),
  date: (isLightMode) => ({
    fontSize: 14,
    color: isLightMode ? 'grey' : '#CCC',
    marginBottom: 10,
  }),
  contents: (isLightMode) => ({
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    color: isLightMode ? '#333' : '#FFF',
  }),
  likes: (isLightMode) => ({
    fontSize: 14,
    fontWeight: 'bold',
    color: isLightMode ? '#000' : '#FFF',
  }),
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    marginRight: 8,
  },
  commentsContainer: {
    marginTop: 20,
  },
  commentsTitle: (isLightMode) => ({
    fontSize: 20,
    fontWeight: 'bold',
    color: isLightMode ? '#333' : '#FFF',
    marginBottom: 10,
  }),
  comment: {
    padding: 10,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
  },
  commentText: (isLightMode) => ({
    color: isLightMode ? '#000' : '#FFF',
  }),
  noComments: (isLightMode) => ({
    color: isLightMode ? '#555' : '#CCC',
    marginVertical: 10,
  }),
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default PostDetailScreen;