import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { mediaDevices, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

const peerConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const VoIPCall = ({ remotePeerId, socket, onHangup }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef();

  // 1. 오디오 스트림 획득
  useEffect(() => {
    (async () => {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        setLocalStream(stream);
      } catch (e) {
        Alert.alert('마이크 오류', e?.message || 'Failed to access mic');
        console.log('마이크 오류', e);
      }
    })();
  }, []);

  // 2. peer 연결 및 시그널링 핸들러 (아주 예외 안전하게 처리)
  useEffect(() => {
    if (!remotePeerId || !socket || !localStream) return;

    pc.current = new RTCPeerConnection(peerConfig);

    try {
      localStream.getTracks().forEach(track => pc.current.addTrack(track, localStream));
      pc.current.ontrack = (event) => {
        try { setRemoteStream(event.streams[0]); }
        catch (e) { console.log('ontrack 오류:', e); }
      };

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          try {
            socket.emit('ice', { candidate: e.candidate, to: remotePeerId, from: socket.id });
          } catch (e) {
            console.log('ICE emit 오류:', e);
          }
        }
      };

      socket.on('offer', async ({ offer, from }) => {
        try {
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          socket.emit('answer', { answer, to: from, from: socket.id });
          console.log('offer 수신→answer 생성 후 전송');
        } catch (e) {
          console.log('offer 핸들러 오류:', e?.message ?? e);
          Alert.alert('offer 오류', e?.message ?? '오퍼 수신 처리 중 에러');
        }
      });
      socket.on('answer', async ({ answer }) => {
        try {
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('answer 수신 처리 완료');
        } catch (e) {
          console.log('answer 핸들러 오류:', e?.message ?? e);
          Alert.alert('answer 오류', e?.message ?? 'answer 처리 중 에러');
        }
      });
      socket.on('ice', async ({ candidate }) => {
        try {
          if (candidate && pc.current) {
            await pc.current.addIceCandidate(candidate);
            console.log('ICE candidate 추가');
          }
        } catch (e) {
          console.log('ice 핸들러 오류:', e?.message ?? e);
        }
      });

      // 내가 offer 생성 주체 (내가 발신자면 서버에서 바로 call 이벤트 안옴)
      if (socket.id !== remotePeerId) {
        (async () => {
          try {
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            socket.emit('offer', { offer, to: remotePeerId, from: socket.id });
            console.log('발신측에서 offer 생성/전송');
          } catch (e) {
            console.log('offer 생성/emit 오류:', e?.message ?? e);
            Alert.alert('offer 생성/송신 오류', e?.message ?? 'offer 과정 중 에러');
          }
        })();
      }
    } catch (e) {
      console.log('peerConnection 생성 오류:', e?.message ?? e);
      Alert.alert('peerConnection 오류', e?.message ?? 'peer 생성 과정에서 에러');
    }

    return () => {
      try {
        socket.off('offer');
        socket.off('answer');
        socket.off('ice');
        if (pc.current) pc.current.close();
        console.log('peerConnection/시그널링 cleanup');
      } catch (e) {
        console.log('cleanup 오류:', e?.message ?? e);
      }
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [remotePeerId, socket, localStream]);

  // 3. 통화종료 (상위 전달)
  const hangup = () => {
    try {
      if (pc.current) pc.current.close();
      setLocalStream(null);
      setRemoteStream(null);
      if (onHangup) onHangup();
      console.log('수동 통화 종료');
    } catch (e) {
      console.log('hangup 오류:', e?.message ?? e);
    }
  };

  return (
    <View style={styles.callContainer}>
      <Text style={{ color: '#fff', fontSize: 20 }}>VOIP 통화 연결됨</Text>
      <Button title="통화 종료" onPress={hangup} color="#f44" />
      {/* localStream/remoteStream 보여주기 등 추가 UI 가능 */}
    </View>
  );
};

const styles = StyleSheet.create({
  callContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99, backgroundColor: '#222c', justifyContent: 'center', alignItems: 'center',
  },
});

export default VoIPCall;