import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CallScreen({
  callState = 'outgoing',
  peer = { name: 'Unknown', number: '' },
  onAccept,
  onReject,
  onHangup,
  remoteStreamExists = false,
  isInvalidNumber = false,
  isRejected = false,
}) {
  let stateText = '';
  if (isInvalidNumber) stateText = '없는 번호입니다';
  else if (isRejected) stateText = '상대방이 전화를 거절했습니다';
  else if (callState === 'outgoing') stateText = '전화 거는 중...';
  else if (callState === 'incoming') stateText = '전화가 왔습니다';
  else if (callState === 'connecting') stateText = '연결 중...';
  else if (callState === 'active') stateText = '통화 중';

  let buttons = null;
  if (isInvalidNumber || isRejected) {
    buttons = (
      <TouchableOpacity style={[styles.circleButton, styles.rejectButton]} onPress={onReject}>
        <Icon name="close" size={32} color="#fff" />
      </TouchableOpacity>
    );
  } else if (callState === 'incoming') {
    buttons = (
      <>
        <TouchableOpacity style={[styles.circleButton, styles.acceptButton]} onPress={onAccept}>
          <Icon name="call" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleButton, styles.rejectButton]} onPress={onReject}>
          <Icon name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </>
    );
  } else if (callState === 'outgoing') {
    buttons = (
      <TouchableOpacity style={[styles.circleButton, styles.rejectButton]} onPress={onReject}>
        <Icon name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    );
  } else if (callState === 'connecting' || callState === 'active') {
    buttons = (
      <TouchableOpacity style={[styles.circleButton, styles.rejectButton]} onPress={onHangup}>
        <Icon name="close" size={32} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerArea}>
        <View style={styles.profileContainer}>
          {peer.name !== 'Unknown' && <Text style={styles.name}>{peer.name}</Text>}
          <Text style={styles.number}>{peer.number}</Text>
        </View>
        <Text style={styles.statusText}>{stateText}</Text>
        {callState === 'active' && (
          <Text style={{ color: '#000000', fontSize: 17 }}>
            상대방 음성이 연결되었습니다
          </Text>
        )}
      </View>
      <View style={styles.buttonRow}>{buttons}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3394e5',
  },
  number: {
    fontSize: 16,
    color: '#6bb2e7',
    marginTop: 4,
  },
  statusText: {
    fontSize: 18,
    color: '#7bbef6',
    marginVertical: 30,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
  },
  circleButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 22,
    shadowColor: '#297afd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptButton: {
    backgroundColor: '#62d96f',
  },
  rejectButton: {
    backgroundColor: '#ed489a',
  },
});
