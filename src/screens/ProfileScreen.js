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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';  // useTheme 훅 import

const ProfileScreen = ({ setIsLoggedIn }) => {
  console.log("ProfileScreen 렌더링됨."); // 추가 로그
  const navigation = useNavigation();
  const { isLightMode, toggleTheme } = useTheme();  // useTheme 사용
  const styles = getStyles(isLightMode);

  // 기본 프로필 이미지 (에러 방지를 위한 대체 이미지)
  const profileImageSource = require('../assets/profile.png');

  // 로그아웃 핸들러
  const handleLogout = () => {
    Alert.alert(
      '로그아웃 확인',
      '정말로 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '확인',
          onPress: () => {
            setIsLoggedIn(false); // 상태 변경
            //navigation.navigate('Login'); // 로그인 화면으로 이동
          }
        }
      ],
      { cancelable: false } // 백 버튼 클릭 시 Alert 회피
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Image
          source={profileImageSource}
          style={styles.profileImage}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
        <Text style={styles.username}>너 누구니</Text>
        <Text style={styles.userInfo}>deepfake@naver.com | +010 1111 2222</Text>
      </View>

      <View style={styles.section}>
        <TouchableMenuItem
          text="프로필 수정"
          onPress={() => navigation.navigate('ProfileEdit')}
          styles={styles}
        />

        <TouchableMenuItem
          text="알림 설정"
          onPress={() => navigation.navigate('NotificationSettings')}
          styles={styles}
          rightContent={<Text style={styles.indicator}>켜짐</Text>}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.menuText}>라이트 모드 / 다크 모드</Text>
          <Switch
            value={isLightMode}
            onValueChange={toggleTheme}
            thumbColor={isLightMode ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableMenuItem
          text="탐지 기록"
          onPress={() => navigation.navigate('DetectionHistory')}
          styles={styles}
        />

        <TouchableMenuItem
          text="내가 게시한 글"
          onPress={() => navigation.navigate('MyPosts')}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <TouchableMenuItem
          text="정보"
          onPress={() => navigation.navigate('Info')}
          styles={styles}
        />

        <TouchableMenuItem
          text="자주 묻는 질문"
          onPress={() => navigation.navigate('FAQ')}
          styles={styles}
        />

        <TouchableMenuItem
          text="개인정보 처리방침"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          styles={styles}
        />

        <TouchableMenuItem
          text="로그아웃"
          onPress={handleLogout} // 수정된 부분: 로그아웃 핸들러 사용
          styles={styles}
        />
      </View>
    </ScrollView>
  );
};

// 재사용 가능한 메뉴 아이템 컴포넌트
const TouchableMenuItem = ({ text, onPress, styles, rightContent }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuText}>{text}</Text>
    {rightContent || <Icon name="chevron-forward" size={20} color={styles.indicator.color} />}
  </TouchableOpacity>
);

// 스타일 업데이트 (추가 스타일 포함)
const getStyles = (isLightMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isLightMode ? '#FFF' : '#000',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: isLightMode ? '#EEE' : '#333',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isLightMode ? '#000' : '#FFF',
    marginBottom: 5,
  },
  userInfo: {
    color: isLightMode ? '#666' : '#A9A9A9',
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  menuItem: {
    backgroundColor: isLightMode ? '#EEE' : '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    color: isLightMode ? '#000' : '#FFF',
    fontSize: 16,
  },
  indicator: {
    color: '#007AFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: isLightMode ? '#EEE' : '#1e1e1e',
    borderRadius: 10,
    marginTop: 10,
  },
});

export default ProfileScreen;
