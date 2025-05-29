import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function InCallScreen({ peer, onHangup }) {
  const displayName = peer?.name || peer?.number || '상대방';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.status}>통화 중입니다...</Text>

      <TouchableOpacity
        style={styles.hangupButton}
        onPress={onHangup}
        accessibilityLabel="통화 종료"
        accessibilityRole="button"
        accessibilityHint="통화를 종료합니다"
      >
        <Icon name="call" size={30} color="#fff" style={styles.iconRotated} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 18,
    color: '#4a4a4a',
    marginBottom: 40,
  },
  hangupButton: {
    backgroundColor: '#d9534f',
    borderRadius: 50,
    padding: 20,
    elevation: 3,
  },
  iconRotated: {
    transform: [{ rotate: '135deg' }],
  },
});
