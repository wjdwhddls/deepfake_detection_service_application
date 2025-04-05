import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, ScrollView } from 'react-native';

const ProfileScreen = ({ navigation }) => {
  const [isLightMode, setIsLightMode] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://example.com/user-image.png' }} // 프로필 사진 URL로 변경
          style={styles.profileImage}
        />
        <Text style={styles.username}>너 누구니</Text>
        <Text style={styles.userInfo}>deepfake@naver.com | +010 1111 2222</Text>
      </View>

      <View style={styles.section}>
        {/* 프로필 수정 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={styles.menuText}>프로필 수정</Text>
        </TouchableOpacity>

        {/* 알림 설정 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
          <Text style={styles.menuText}>알림 설정</Text>
          <Text style={styles.indicator}>켜짐</Text>
        </TouchableOpacity>

        {/* 라이트 모드 / 다크 모드 스위치 */}
        <View style={styles.switchContainer}>
          <Text style={styles.menuText}>라이트 모드 / 다크 모드</Text>
          <Switch
            value={isLightMode}
            onValueChange={setIsLightMode}
            thumbColor={isLightMode ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        {/* 탐지 기록 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DetectionHistory')}>
          <Text style={styles.menuText}>탐지 기록</Text>
        </TouchableOpacity>

        {/* 내가 게시한 글 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyPosts')}>
          <Text style={styles.menuText}>내가 게시한 글</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {/* 추가 정보 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Info')}>
          <Text style={styles.menuText}>정보</Text>
        </TouchableOpacity>
        {/* 자주 묻는 질문 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FAQ')}>
          <Text style={styles.menuText}>자주 묻는 질문</Text>
        </TouchableOpacity>
        {/* 개인정보 처리방침 버튼 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.menuText}>개인정보 처리방침</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 배경 색상
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 5,
  },
  userInfo: {
    color: '#A9A9A9',
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    color: '#FFF',
    fontSize: 18,
  },
  indicator: {
    color: '#007AFF', // 파란색 또는 원하는 색상으로 수정
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#1e1e1e', // 스위치 배경 색상
    borderRadius: 10,
  },
});

export default ProfileScreen;
