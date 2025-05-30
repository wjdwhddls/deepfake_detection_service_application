import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import InCallManager from 'react-native-incall-manager';

export default function InCallScreen({ peer, onHangup }) {
  const displayName = peer?.name || peer?.number || '상대방';
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);

  useEffect(() => {
    // InCallManager.start({ media: 'audio' }); // ❌ 진동/벨소리 시작 제거
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(timer);
      // InCallManager.stop(); // ❌ 종료 처리 제거
    };
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const secsRemain = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${secsRemain}`;
  };

  const toggleMute = () => {
    try {
      const newMute = !muted;
      setMuted(newMute);
      InCallManager.setMicrophoneMute(newMute);
    } catch (error) {
      console.error('음소거 오류:', error);
    }
  };

  const toggleSpeaker = () => {
    try {
      const newSpeaker = !speakerOn;
      setSpeakerOn(newSpeaker);
      InCallManager.setSpeakerphoneOn(newSpeaker);
    } catch (error) {
      console.error('스피커 오류:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.status}>{formatTime(seconds)}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={toggleSpeaker}>
          <Icon name="volume-high" size={28} color={speakerOn ? 'yellow' : '#fff'} />
          <Text style={styles.label}>스피커</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hangupButton} onPress={onHangup}>
          <Icon name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleMute}>
          <Icon name={muted ? 'mic-off' : 'mic'} size={28} color={muted ? 'red' : '#fff'} />
          <Text style={styles.label}>음소거</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  name: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 6,
  },
  status: {
    fontSize: 20,
    color: '#aaa',
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
  },
  hangupButton: {
    backgroundColor: '#d9534f',
    borderRadius: 50,
    padding: 18,
    marginHorizontal: 20,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 6,
  },
});
