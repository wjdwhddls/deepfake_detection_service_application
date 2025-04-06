import React, { useState, useEffect } from 'react'; // useEffect 추가  
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, PermissionsAndroid, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext'; // useTheme 훅 import 추가

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { isLightMode } = useTheme(); // 현재 테마 정보 가져오기

  // 스위치 상태를 관리하기 위한 상태변수 추가
  const [isCallDetection, setIsCallDetection] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(false);
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(true);
  const [isNewServiceEnabled, setIsNewServiceEnabled] = useState(false);
  const [isNewTeamEnabled, setIsNewTeamEnabled] = useState(true);

  // 권한 요청 함수  
  const requestCallPermission = async () => {  
    console.log("Requesting call permission...");
    if (Platform.OS === 'android') {  
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);  
      console.log('Permission granted:', granted);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {  
        console.log('전화 상태 권한이 허가되었습니다');  
      } else {  
        Alert.alert('권한 필요', '통화 감지를 사용하기 위해 전화 상태 권한이 필요합니다.');  
        setIsCallDetection(false); // 권한 거부 시 스위치를 비활성화  
      }  
    }  
  };  

  useEffect(() => {  
    if (isCallDetection) {  
      requestCallPermission();  
    }  
  }, [isCallDetection]);

  const handleCallDetectionToggle = (value) => {  
    if (value) {  
      console.log('Switch toggled: ', value);  
      setIsCallDetection(value);  
    } else {  
      Alert.alert(  
        '권한 해제',  
        '통화 감지 기능을 비활성화하면 전화 상태 권한이 해제됩니다. 설정에서 권한을 확인하세요.',  
        [{ text: '확인' }]  
      );  
      setIsCallDetection(value);  
    }  
  };  

  return (
    <ScrollView style={styles.container(isLightMode)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={20} color="#FFFFFF" /> 
        </TouchableOpacity>
        <Text style={styles.title(isLightMode)}>알림 설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle(isLightMode)}>일반 설정</Text>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>통화 감지 시 백그라운드 실행 및 진동 알림</Text>
          <Switch
            value={isCallDetection}
            onValueChange={handleCallDetectionToggle}  
            thumbColor={isCallDetection ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>알림</Text>
          <Switch
            value={isNotificationEnabled}
            onValueChange={setIsNotificationEnabled}
            thumbColor={isNotificationEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>소리</Text>
          <Switch
            value={isSoundEnabled}
            onValueChange={setIsSoundEnabled}
            thumbColor={isSoundEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>진동</Text>
          <Switch
            value={isVibrationEnabled}
            onValueChange={setIsVibrationEnabled}
            thumbColor={isVibrationEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle(isLightMode)}>시스템 및 서비스 업데이트</Text>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>앱 자동 업데이트</Text>
          <Switch
            value={isAutoUpdateEnabled}
            onValueChange={setIsAutoUpdateEnabled}
            thumbColor={isAutoUpdateEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>프로모션</Text>
          <Switch
            value={isPromotionEnabled}
            onValueChange={setIsPromotionEnabled}
            thumbColor={isPromotionEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle(isLightMode)}>기타</Text>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>새로운 서비스 제공</Text>
          <Switch
            value={isNewServiceEnabled}
            onValueChange={setIsNewServiceEnabled}
            thumbColor={isNewServiceEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer(isLightMode)}>
          <Text style={styles.switchLabel(isLightMode)}>새로운 팀 제공</Text>
          <Switch
            value={isNewTeamEnabled}
            onValueChange={setIsNewTeamEnabled}
            thumbColor={isNewTeamEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// 스타일 업데이트 (테마를 동적으로 적용)
const styles = StyleSheet.create({
  container: (isLightMode) => ({
    flex: 1,
    backgroundColor: isLightMode ? '#FFF' : '#000', // 배경색
    padding: 20,
  }),
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: {
    marginRight: 10,
  },
  title: (isLightMode) => ({
    fontSize: 24,
    color: isLightMode ? '#000' : '#FFF', // 제목 색상을 라이트 모드일 때 검정색으로
    textAlign: 'center',
    flex: 1,
  }),
  section: {
    marginBottom: 20,
  },
  sectionTitle: (isLightMode) => ({
    fontSize: 18,
    color: isLightMode ? '#000' : '#FFF', // 제목 색상
    marginBottom: 10,
  }),
  switchContainer: (isLightMode) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: isLightMode ? '#EEE' : '#1f1f1f', // 카드 배경색
    padding: 15,
    borderRadius: 10,
  }),
  switchLabel: (isLightMode) => ({
    color: isLightMode ? '#000' : '#FFF', // 라이트 모드일 때 글씨 색깔을 검정색으로
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
  }),
});

export default NotificationSettingsScreen;
