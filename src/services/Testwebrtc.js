import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { RTCPeerConnection } from 'react-native-webrtc';

const TestWebRTC = () => {
  useEffect(() => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      });
      console.log('✅ RTCPeerConnection created:', pc);
    } catch (e) {
      console.error('❌ Failed to create RTCPeerConnection:', e);
    }
  }, []);

  return (
    <View>
      <Text>WebRTC 테스트 중...</Text>
    </View>
  );
};

export default TestWebRTC;
