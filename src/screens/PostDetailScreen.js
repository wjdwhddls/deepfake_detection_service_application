// src/screens/PostDetailScreen.js
import React, { useEffect, useMemo, useState } from 'react';
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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/config';

const PALETTE = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  glass: 'rgba(16,24,48,0.96)',
  glassBorder: 'rgba(255,255,255,0.08)',
  white: '#FFFFFF',
};

function parseBoardId(params) {
  // id, boardId, dashboardId 등 무엇으로 와도 케이스 커버
  const cand = params?.id ?? params?.boardId ?? params?.dashboardId;
  const n = Number(cand);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const PostDetailScreen = () => {
  const route = useRoute();
  const boardId = useMemo(() => parseBoardId(route?.params), [route?.params]);

  const { isLightMode } = useTheme();
  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  const fetchPostDetail = async () => {
    if (!boardId) {
      setErrMsg('유효하지 않은 게시물 ID입니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await api.get(`/api/dashboard/${boardId}/detail`);
      if (!res?.data?.success || !res?.data?.data) {
        throw new Error('대시보드 데이터가 올바르지 않습니다.');
      }
      const data = res.data.data;
      setPost(data);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setLiked(false);
    } catch (e) {
      setErrMsg(
        e?.friendlyMessage ||
          e?.response?.data?.message ||
          e?.message ||
          '불러오는 중 문제가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const willLike = !liked;
    setLiked(willLike);
    const nextCount = Math.max((post?.like_num || 0) + (willLike ? 1 : -1), 0);
    setPost((p) => ({ ...p, like_num: nextCount }));
    // 백엔드에서 like 갱신을 허용할 때만 동기화 (없어도 UI만 동작)
    try {
      await api.put(`/api/dashboard/${boardId}`, { like_num: nextCount });
    } catch {
      // 무시 (선택적으로 토스트 표시 가능)
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, text: newComment.trim() },
    ]);
    setNewComment('');
  };

  useEffect(() => {
    fetchPostDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // 상단/하단 겹침 방지용 여백
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const bottomInset = 24; // 하단 탭/제스처 여유

  return (
    <View style={styles.root}>
      {/* 배경 그라디언트 + 블롭 */}
      <LinearGradient
        colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, styles.blobLT]} />
        <View style={[styles.blob, styles.blobRB]} />
      </View>

      {/* StatusBar는 겹침 방지를 위해 불투명 처리 */}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1, paddingTop: topInset }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 80 }}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* 헤더 */}
            <Text style={styles.headerTitle}>대시보드</Text>

            {/* 로딩/에러 */}
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={PALETTE.white} />
                <Text style={styles.loadingText}>불러오는 중…</Text>
              </View>
            ) : errMsg ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{errMsg}</Text>
              </View>
            ) : !post ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>데이터가 없습니다.</Text>
              </View>
            ) : (
              <>
                {/* 카드 */}
                <View style={styles.card}>
                  {post.image ? (
                    <Image source={{ uri: post.image }} style={styles.image} />
                  ) : null}

                  <Text style={styles.title}>{post.title}</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.meta}>작성자: {post.userId}</Text>
                    <Text style={styles.meta}>
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString('ko-KR')
                        : ''}
                    </Text>
                  </View>

                  <Text style={styles.bodyText}>{post.text}</Text>

                  <View style={styles.likeRow}>
                    <TouchableOpacity onPress={handleLike} activeOpacity={0.8}>
                      <Icon
                        name={liked ? 'heart' : 'heart-o'}
                        size={24}
                        color={liked ? '#FF5A5F' : '#FFFFFF'}
                        style={{ marginRight: 8 }}
                      />
                    </TouchableOpacity>
                    <Text style={styles.likeText}>좋아요: {post.like_num || 0}</Text>
                  </View>
                </View>

                {/* 댓글 */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>댓글</Text>
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <View key={c.id} style={styles.commentRow}>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.dimText}>댓글이 없습니다.</Text>
                  )}

                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="댓글을 달아주세요…"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={addComment}>
                      <Text style={styles.sendBtnText}>추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.g3 },

  // 배경 블롭
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
  blobLT: { top: 120, left: -40, backgroundColor: 'rgba(255,255,255,0.18)' },
  blobRB: { bottom: -40, right: -60, backgroundColor: 'rgba(0,0,0,0.18)' },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: PALETTE.white,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 10, color: PALETTE.white, opacity: 0.9 },
  errorText: { color: '#FFD1D1', fontWeight: '700' },

  card: {
    backgroundColor: PALETTE.glass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 16,
  },

  image: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: PALETTE.white,
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meta: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  bodyText: { color: 'rgba(255,255,255,0.95)', fontSize: 16, lineHeight: 24, marginTop: 6 },

  likeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  likeText: { color: PALETTE.white, fontWeight: '800' },

  sectionTitle: {
    color: PALETTE.white,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 8,
  },

  commentRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  commentText: { color: 'rgba(255,255,255,0.95)' },
  dimText: { color: 'rgba(255,255,255,0.6)', marginVertical: 8 },

  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PALETTE.white,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#4FB2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sendBtnText: { color: '#FFF', fontWeight: '800' },
});

export default PostDetailScreen;