// src/screens/InCallScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function InCallScreen({ peer, onHangup }) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{peer.name || '상대방'}</Text>
      <Text style={styles.status}>통화 중입니다...</Text>

      <TouchableOpacity style={styles.hangupButton} onPress={onHangup}>
        <Icon name="call" size={30} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f5f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
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
  },
});