import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

// 옵션: LinearGradient 사용 (설치되어 있으면 자동 사용, 없으면 폴백)
let LinearGradientComp = null;
try {
  // yarn add react-native-linear-gradient && (iOS) pod install
  LinearGradientComp = require('react-native-linear-gradient').default;
} catch (e) {
  LinearGradientComp = null;
}

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { isLightMode } = useTheme(); // 현재 테마
  const styles = getStyles(isLightMode);

  // 스위치 상태
  const [isCallDetection, setIsCallDetection] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(false);
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(true);
  const [isNewServiceEnabled, setIsNewServiceEnabled] = useState(false);
  const [isNewTeamEnabled, setIsNewTeamEnabled] = useState(true);

  // 권한 요청 (안드로이드)
  const requestCallPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            '권한 필요',
            '통화 감지를 사용하기 위해 전화 상태 권한이 필요합니다.'
          );
          setIsCallDetection(false);
        }
      }
    } catch (err) {
      console.warn('권한 요청 에러:', err);
      setIsCallDetection(false);
    }
  };

  // 토글 ON 시 권한 요청
  useEffect(() => {
    if (isCallDetection) {
      requestCallPermission();
    }
  }, [isCallDetection]);

  // 통화 감지 토글 핸들러
  const handleCallDetectionToggle = (value) => {
    if (value) {
      setIsCallDetection(true);
    } else {
      Alert.alert(
        '권한 해제',
        '통화 감지 기능을 비활성화하면 전화 상태 권한이 해제됩니다. 설정에서 권한을 확인하세요.',
        [{ text: '확인' }]
      );
      setIsCallDetection(false);
    }
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
      <View
        style={[
          styles.container,
          { backgroundColor: isLightMode ? '#E8EEFF' : '#0b1220' },
        ]}
      >
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
        {/* AppBar: 뒤로가기만 좌측에 고정, 타이틀 가운데 */}
        <View style={styles.appbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.appbarBack}
            accessibilityLabel="뒤로가기"
          >
            <Icon name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>알림 설정</Text>
        </View>

        {/* 일반 설정 */}
        <View style={[styles.card, styles.shadowCard, { paddingVertical: 8 }]}>
          <Text style={styles.listTitle}>일반 설정</Text>
          <ListRowDivider />

          <RowSwitch
            label="통화 감지 시 백그라운드 실행 및 진동 알림"
            value={isCallDetection}
            onValueChange={handleCallDetectionToggle}
            isLightMode={isLightMode}
          />
          <ListRowDivider />

          <RowSwitch
            label="알림"
            value={isNotificationEnabled}
            onValueChange={setIsNotificationEnabled}
            isLightMode={isLightMode}
          />
          <ListRowDivider />

          <RowSwitch
            label="소리"
            value={isSoundEnabled}
            onValueChange={setIsSoundEnabled}
            isLightMode={isLightMode}
          />
          <ListRowDivider />

          <RowSwitch
            label="진동"
            value={isVibrationEnabled}
            onValueChange={setIsVibrationEnabled}
            isLightMode={isLightMode}
          />
        </View>

        {/* 시스템 및 서비스 업데이트 */}
        <View style={[styles.card, styles.shadowCard, { paddingVertical: 8 }]}>
          <Text style={styles.listTitle}>시스템 및 서비스 업데이트</Text>
          <ListRowDivider />

          <RowSwitch
            label="앱 자동 업데이트"
            value={isAutoUpdateEnabled}
            onValueChange={setIsAutoUpdateEnabled}
            isLightMode={isLightMode}
          />
          <ListRowDivider />

          <RowSwitch
            label="프로모션"
            value={isPromotionEnabled}
            onValueChange={setIsPromotionEnabled}
            isLightMode={isLightMode}
          />
        </View>

        {/* 기타 */}
        <View style={[styles.card, styles.shadowCard, { paddingVertical: 8 }]}>
          <Text style={styles.listTitle}>기타</Text>
          <ListRowDivider />

          <RowSwitch
            label="새로운 서비스 제공"
            value={isNewServiceEnabled}
            onValueChange={setIsNewServiceEnabled}
            isLightMode={isLightMode}
          />
          <ListRowDivider />

          <RowSwitch
            label="새로운 팀 제공"
            value={isNewTeamEnabled}
            onValueChange={setIsNewTeamEnabled}
            isLightMode={isLightMode}
          />
        </View>
      </ScrollView>
    </Background>
  );
};

// 리스트 디바이더
const ListRowDivider = () => (
  <View
    style={{
      height: 1,
      backgroundColor: 'rgba(15,23,42,0.08)',
      opacity: 0.6,
    }}
  />
);

// 스위치 행(공용 컴포넌트)
const RowSwitch = ({ label, value, onValueChange, isLightMode }) => (
  <View
    style={{
      paddingVertical: 14,
      paddingHorizontal: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'transparent',
    }}
  >
    <Text
      style={{
        color: isLightMode ? '#0f172a' : '#e5e7eb',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        paddingRight: 12,
      }}
    >
      {label}
    </Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      trackColor={{ false: '#d1d5db', true: '#81b0ff' }}
    />
  </View>
);

// 스타일 (프로필 화면과 톤 일치)
const getStyles = (isLightMode) =>
  StyleSheet.create({
    // 색상 토큰
    onSurface: { color: isLightMode ? '#0f172a' : '#e5e7eb' },

    container: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 24,
    },

    // AppBar
    appbar: {
      height: 56,
      alignItems: 'center',
      justifyContent: 'center', // 타이틀 정중앙
      marginBottom: 12,
    },
    appbarBack: {
      position: 'absolute',
      left: 4,
      padding: 4,
    },
    appbarTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },

    // 카드 (유리감)
    card: {
      backgroundColor: isLightMode
        ? 'rgba(255,255,255,0.65)'
        : 'rgba(17,24,39,0.60)',
      borderColor: isLightMode
        ? 'rgba(255,255,255,0.65)'
        : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderRadius: 24,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    

    // 리스트 타이틀
    listTitle: {
      color: isLightMode ? '#0f172a' : '#e5e7eb',
      fontSize: 16,
      fontWeight: '700',
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 10,
    },
  });

export default NotificationSettingsScreen;