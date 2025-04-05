import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();

  // 스위치 상태를 관리하기 위한 상태변수 추가
  const [isCallDetection, setIsCallDetection] = useState(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(false);
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(true);
  const [isNewServiceEnabled, setIsNewServiceEnabled] = useState(false);
  const [isNewTeamEnabled, setIsNewTeamEnabled] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={20} color="#FFFFFF" /> 
        </TouchableOpacity>
        <Text style={styles.title}>알림 설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>일반 설정</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>통화 감지 시 백그라운드 실행 및 진동 알림</Text>
          <Switch
            value={isCallDetection}
            onValueChange={setIsCallDetection}
            thumbColor={isCallDetection ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>알림</Text>
          <Switch
            value={isNotificationEnabled}
            onValueChange={setIsNotificationEnabled}
            thumbColor={isNotificationEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>소리</Text>
          <Switch
            value={isSoundEnabled}
            onValueChange={setIsSoundEnabled}
            thumbColor={isSoundEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>진동</Text>
          <Switch
            value={isVibrationEnabled}
            onValueChange={setIsVibrationEnabled}
            thumbColor={isVibrationEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>시스템 및 서비스 업데이트</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>앱 자동 업데이트</Text>
          <Switch
            value={isAutoUpdateEnabled}
            onValueChange={setIsAutoUpdateEnabled}
            thumbColor={isAutoUpdateEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>프로모션</Text>
          <Switch
            value={isPromotionEnabled}
            onValueChange={setIsPromotionEnabled}
            thumbColor={isPromotionEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기타</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>새로운 서비스 제공</Text>
          <Switch
            value={isNewServiceEnabled}
            onValueChange={setIsNewServiceEnabled}
            thumbColor={isNewServiceEnabled ? "#FFF" : "#000"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>새로운 팀 제공</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center-start',
    marginBottom: 30, // 헤더와 내용 간격 추가
    marginTop: 40,     // 헤더 위 간격 추가
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#1f1f1f',
    padding: 15,
    borderRadius: 10,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
  },
});

export default NotificationSettingsScreen;
