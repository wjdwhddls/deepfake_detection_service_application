import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

// 옵션: LinearGradient 사용 (설치되어 있으면 자동 사용, 없으면 폴백)
let LinearGradientComp: any = null;
try {
  // yarn add react-native-linear-gradient && pod install (iOS)
  LinearGradientComp = require('react-native-linear-gradient').default;
} catch (e) {
  LinearGradientComp = null;
}

const ProfileScreen = ({ setIsLoggedIn }) => {
  console.log('ProfileScreen 렌더링됨.');
  const navigation = useNavigation();
  const { isLightMode, toggleTheme } = useTheme();
  const styles = getStyles(isLightMode);

  // 기본 프로필 이미지 (에러 방지 대체 이미지)
  const profileImageSource = require('../assets/profile.png');

  // 로그아웃 핸들러
  const handleLogout = () => {
    Alert.alert(
      '로그아웃 확인',
      '정말로 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            setIsLoggedIn(false);
            // navigation.navigate('Login');
          },
        },
      ],
      { cancelable: false }
    );
  };

  // 배경(그라디언트 또는 폴백)
  const Background = ({ children }) =>
    LinearGradientComp ? (
      <LinearGradientComp
        colors={isLightMode ? ['#0ea5e9', '#6366f1'] : ['#0b1220', '#1f2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {children}
      </LinearGradientComp>
    ) : (
      <View style={[styles.container, { backgroundColor: isLightMode ? '#E8EEFF' : '#0b1220' }]}>
        {children}
      </View>
    );

  return (
    <Background>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 AppBar 형태 */}
        <View style={styles.appbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.appbarBack}
            accessibilityLabel="뒤로가기"
          >
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.appbarTitle}>프로필</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={[styles.card, styles.shadowCard]}>
          {/* 아바타 + 배지 */}
          <View style={styles.avatarWrap}>
            <Image
              source={profileImageSource}
              style={styles.profileImage}
              onError={(e) => console.log('Image load error:', e?.nativeEvent?.error)}
            />
            <View style={[styles.avatarRing]} />
            <TouchableOpacity
              style={[styles.avatarBadge, styles.shadowSoft]}
              onPress={() => navigation.navigate('ProfileEdit')}
              activeOpacity={0.8}
            >
              <Icon name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 이름 / 정보 */}
          <Text style={styles.username}>너 누구니</Text>
          <Text style={styles.userInfo}>deepfake@naver.com · +010 1111 2222</Text>

          {/* 주요 액션 버튼 */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.shadowSoft]}
              onPress={() => navigation.navigate('ProfileEdit')}
              activeOpacity={0.9}
            >
              <Icon name="pencil" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>프로필 수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 설정 카드 */}
        <View style={[styles.card, styles.shadowCard, { paddingVertical: 8 }]}>
          <Text style={styles.listTitle}>설정</Text>

          <ListRowDivider />

          {/* 알림 설정 (칩) */}
          <TouchableMenuItem
            text="알림 설정"
            onPress={() => navigation.navigate('NotificationSettings')}
            styles={styles}
            withDivider
          />

          {/* 라이트/다크 모드 토글 */}
          <View style={[styles.menuItem, styles.rowBetween]}>
            <View style={styles.rowLeft}>
              <Text style={styles.menuText}>라이트 모드 / 다크 모드</Text>
            </View>
            <Switch
              value={!isLightMode} // 그대로 유지
              onValueChange={toggleTheme}
              thumbColor={isLightMode ? '#FFFFFF' : '#FFFFFF'}
              trackColor={{ false: '#d1d5db', true: '#81b0ff' }}
            />
          </View>
          <ListRowDivider />

          {/* 탐지 기록 */}
          <TouchableMenuItem
            text="탐지 기록"
            onPress={() => navigation.navigate('DetectionHistory')}
            styles={styles}
            withDivider
          />

          {/* 내가 게시한 글 */}
          <TouchableMenuItem
            text="내가 게시한 글"
            onPress={() => navigation.navigate('MyPosts')}
            styles={styles}
            withDivider
          />

          {/* 정보 */}
          <TouchableMenuItem
            text="정보"
            onPress={() => navigation.navigate('Info')}
            styles={styles}
            withDivider
          />

          {/* 자주 묻는 질문 */}
          <TouchableMenuItem
            text="자주 묻는 질문"
            onPress={() => navigation.navigate('FAQ')}
            styles={styles}
            withDivider
          />

          {/* 개인정보 처리방침 */}
          <TouchableMenuItem
            text="개인정보 처리방침"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            styles={styles}
            withDivider
          />

          {/* 로그아웃 (Danger) */}
          <TouchableMenuItem
            text="로그아웃"
            onPress={handleLogout}
            styles={styles}
            danger
            showChevron={false}
          />
        </View>


      </ScrollView>
    </Background>
  );
};

// Divider
const ListRowDivider = () => <View style={{ height: 1, backgroundColor: 'rgba(15,23,42,0.08)', opacity: 0.6 }} />;

// 재사용 가능한 메뉴 아이템 컴포넌트 (스타일 강화, 옵션 추가)
const TouchableMenuItem = ({ text, onPress, styles, rightContent, withDivider, danger = false, showChevron = true }) => (
  <>
    <TouchableOpacity style={[styles.menuItem, danger && styles.menuItemDanger]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.menuText, danger && styles.menuTextDanger]}>{text}</Text>
      {rightContent ? (
        rightContent
      ) : showChevron ? (
        <Icon name="chevron-forward" size={20} color={styles.chevron.color} />
      ) : (
        <View style={{ width: 20 }} />
      )}
    </TouchableOpacity>
    {withDivider && <ListRowDivider />}
  </>
);

// 스타일
const getStyles = (isLightMode) =>
  StyleSheet.create({
    // 색상 토큰
    onSurface: { color: isLightMode ? '#0f172a' : '#e5e7eb' },
    subtext: { color: isLightMode ? '#475569' : '#9ca3af' },
    divider: { color: isLightMode ? 'rgba(15,23,42,0.08)' : 'rgba(229,231,235,0.08)' },

    container: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },

    // AppBar
    appbar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // 가운데 정렬
      paddingHorizontal: 4,
      marginBottom: 12,
    },

    appbarBack: {
      position: 'absolute',
      left: 4,             // 좌측 고정
      padding: 4,          // 터치 영역 확보
    },

    appbarTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center', // 혹시 모를 좌우 영향 방지
    },

    // 카드 공통
    card: {
      backgroundColor: isLightMode ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.60)',
      borderColor: isLightMode ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
    },

    // 아바타
    avatarWrap: {
      width: 110,
      height: 110,
      alignSelf: 'center',
      marginTop: 6,
      marginBottom: 12,
    },
    profileImage: {
      width: 110,
      height: 110,
      borderRadius: 60,
      backgroundColor: isLightMode ? '#EEE' : '#333',
    },
    avatarRing: {
      position: 'absolute',
      top: -3,
      left: -3,
      right: -3,
      bottom: -3,
      borderRadius: 64,
      borderWidth: 3,
      borderColor: isLightMode ? '#a78bfa' : '#7c3aed', // 보라 톤 링(그라디언트 폴백)
    },
    avatarBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 16,
      backgroundColor: '#7c3aed', // 보라 primary
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },

    // 텍스트
    username: {
      fontSize: 20,
      fontWeight: '700',
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      textAlign: 'center',
    },
    userInfo: {
      fontSize: 13,
      color: isLightMode ? '#475569' : '#9ca3af',
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 12,
    },

    // 액션 버튼
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    primaryButton: {
      flex: 1,
      height: 44,
      backgroundColor: '#6366f1', // 인디고-블루 (그라디언트 폴백)
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      paddingHorizontal: 12,
      marginRight: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    outlineButton: {
      width: 88,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: isLightMode ? 'rgba(15,23,42,0.14)' : 'rgba(229,231,235,0.18)',
      backgroundColor: 'transparent',
    },
    outlineButtonText: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 13,
      fontWeight: '700',
    },

    // 리스트/행
    listTitle: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 16,
      fontWeight: '700',
      paddingHorizontal: 4,
      paddingTop: 2,
      paddingBottom: 10,
    },
    menuItem: {
      paddingVertical: 14,
      paddingHorizontal: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    menuItemDanger: {},
    menuText: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 15,
      fontWeight: '600',
    },
    menuTextDanger: {
      color: '#ef4444',
      fontWeight: '700',
    },
    chevron: {
      color: isLightMode ? '#94a3b8' : '#6b7280',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // 칩
    valueChip: {
      backgroundColor: isLightMode ? 'rgba(15,23,42,0.06)' : 'rgba(229,231,235,0.08)',
      height: 28,
      paddingHorizontal: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    valueChipText: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 12,
      fontWeight: '700',
      opacity: 0.9,
    },
  });

export default ProfileScreen;