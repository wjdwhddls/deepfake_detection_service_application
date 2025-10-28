// src/screens/DashBoardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ⬅️ 안전영역
import { api } from '../lib/config';
import { useTheme } from '../contexts/ThemeContext';

/** HomeScreen과 동일 팔레트 */
const PALETTE = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  blobLT: 'rgba(255,255,255,0.18)',
  blobRB: 'rgba(0,0,0,0.18)',
  white: '#FFFFFF',
  btnBlue: '#2F84FF',
};

const DashBoardScreen = ({ navigation }) => {
  const [dashBoards, setDashBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);

  // 안전영역 (노치/홈인디케이터/내비바 여백)
  const insets = useSafeAreaInsets();

  // FAB 애니메이션
  const fabScale = useRef(new Animated.Value(1)).current;
  const animateFab = (to) =>
    Animated.timing(fabScale, {
      toValue: to,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  const fetchDashBoards = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const url =
        query.trim().length > 0
          ? `/api/dashboard/search?keyword=${encodeURIComponent(query.trim())}`
          : `/api/dashboard`;

      const res = await api.get(url);
      const ok = res?.data?.success;
      const data = res?.data?.data;

      if (!ok || !Array.isArray(data)) throw new Error('대시보드 데이터 형식 오류');

      const sorted = [...data].sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0));
      setDashBoards(sorted);
    } catch (err) {
      console.error('대시보드 불러오기 실패:', err?.friendlyMessage || err?.message || err);
      const status = err?.response?.status;
      if (status === 401) setError('인증이 만료되었습니다. 다시 로그인 해주세요. (401)');
      else if (status === 403) setError('접근 권한이 없습니다. (403)');
      else setError(err?.friendlyMessage || '데이터를 불러오는 중 문제가 발생했습니다.');
      setDashBoards([]);
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
    if (searchQuery.trim() === '') return;
    fetchDashBoards(searchQuery);
  };

  useEffect(() => {
    fetchDashBoards();
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.dashBoardItem}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <Text style={styles.dashBoardTitle}>{item.title}</Text>
      <Text style={styles.dashBoardMeta}>작성자 ID: {item.userId}</Text>
      <Text style={styles.dashBoardContents}>{item.text}</Text>
      <Text style={styles.dashBoardLikes}>좋아요: {item.like_num != null ? item.like_num : 0}</Text>
    </Pressable>
  );

  // 로딩 화면도 안전영역 패딩 적용
  if (loading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobLT]} />
          <View style={[styles.blob, styles.blobRB]} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 8 }]}>
      {/* 배경 */}
      <LinearGradient colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, styles.blobLT]} />
        <View style={[styles.blob, styles.blobRB]} />
      </View>

      {/* 상단 검색바 (노치와 겹치지 않도록 paddingTop 사용) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="제목/키워드 검색..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </Pressable>
      </View>

      {/* 리스트 (하단 탭바/FAB와 겹치지 않도록 paddingBottom 크게) */}
      {error ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.searchButton, { marginTop: 12 }]} onPress={() => fetchDashBoards()}>
            <Text style={styles.searchButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 140, // ⬅️ 하단 안전영역 + 탭바 + FAB 공간
          }}
          data={dashBoards}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={<Text style={styles.header}>대시보드</Text>}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<Text style={{ color: '#fff', textAlign: 'center' }}>데이터가 없습니다.</Text>}
        />
      )}

      {/* FAB: 홈 인디케이터/제스처바 위로 띄우기 */}
      <Animated.View
        style={[
          styles.fabWrap,
          {
            bottom: insets.bottom + 70, // ⬅️ 안전영역 반영
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('WritePost')}
          onPressIn={() => animateFab(0.94)}
          onPressOut={() => animateFab(1)}
          onHoverIn={() => animateFab(1.06)}
          onHoverOut={() => animateFab(1)}
          style={({ pressed, hovered }) => [styles.fab, (pressed || hovered) && styles.fabHovered]}
        >
          <LinearGradient colors={[PALETTE.g1, PALETTE.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabBg}>
            <Text style={styles.fabText}>＋</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const getStyles = (isLightMode) =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: PALETTE.g3 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#fff' },

    /** 배경 블롭 */
    blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
    blobLT: { top: 120, left: -40, backgroundColor: PALETTE.blobLT },
    blobRB: { bottom: -40, right: -60, backgroundColor: PALETTE.blobRB },

    header: {
      fontSize: 24,
      fontWeight: '900',
      marginTop: 12,
      marginBottom: 12,
      textAlign: 'center',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },

    /** 검색 UI */
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 8,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      color: '#FFFFFF',
    },
    searchButton: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    searchButtonText: { color: '#FFFFFF', fontWeight: '800' },

    /** 아이템 카드 */
    dashBoardItem: {
      backgroundColor: 'rgba(16,24,48,0.9)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    dashBoardTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
    dashBoardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
    dashBoardContents: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
    dashBoardLikes: { fontSize: 12, color: '#4FB2FF' },

    errorText: { color: '#FFD2D2', fontSize: 14 },

    /** FAB */
    fabWrap: {
      position: 'absolute',
      right: 20,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: '#1EA7FF',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    fabHovered: {
      shadowOpacity: 0.5,
      elevation: 14,
      borderColor: 'rgba(255,255,255,0.45)',
    },
    fabBg: { flex: 1, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: -2 },
  });

export default DashBoardScreen;