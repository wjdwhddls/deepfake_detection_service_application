import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { mediaDevices, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

const peerConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const VoIPCall = ({ remotePeerId, socket, onHangup }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef(null);
  const isMounted = useRef(true);

  // remote stream 조립용
  const remoteMediaStream = useRef(new MediaStream());

  useEffect(() => {
    isMounted.current = true;

    async function requestAudioPermissionAndStream() {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            { title: '마이크 권한', message: '음성 통화에 마이크 권한이 필요합니다.' }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            if (isMounted.current)
              Alert.alert('마이크 권한 필요', '마이크 권한을 허용해 주세요.');
            return;
          }
        } catch (e) {
          if (isMounted.current)
            Alert.alert('권한 오류', e?.message || '권한 요청 오류');
          return;
        }
      }
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        if (isMounted.current) setLocalStream(stream);
      } catch (e) {
        if (isMounted.current) {
          Alert.alert('마이크 오류', e?.message || 'Failed to access mic');
          console.log('마이크 오류', e);
        }
      }
    }

    requestAudioPermissionAndStream();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!remotePeerId || !socket || !localStream) return;

    let closed = false;
    isMounted.current = true;

    pc.current = new RTCPeerConnection(peerConfig);

    try {
      localStream.getTracks().forEach(track => pc.current.addTrack(track, localStream));
    } catch (e) {
      console.log('localStream 트랙 추가 에러:', e);
    }

    // remote 트랙 수집
    pc.current.ontrack = (event) => {
      if (!isMounted.current) return;
      console.log('ontrack 발생! ', event);
      try {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else if (event.track) {
          remoteMediaStream.current.addTrack(event.track);
          setRemoteStream(remoteMediaStream.current);
        }
      } catch (e) {
        console.log('ontrack 오류:', e);
      }
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

    const handleOffer = async ({ offer, from }) => {
      try {
        if (closed || !isMounted.current || !pc.current) return;
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from, from: socket.id });
        console.log('offer 수신→answer 생성 후 전송');
      } catch (e) {
        console.log('offer 핸들러 오류:', e?.message ?? e);
        if (isMounted.current)
          Alert.alert('offer 오류', e?.message ?? '오퍼 수신 처리 중 에러');
      }
    };
    const handleAnswer = async ({ answer }) => {
      try {
        if (closed || !isMounted.current || !pc.current) return;
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('answer 수신 처리 완료');
      } catch (e) {
        console.log('answer 핸들러 오류:', e?.message ?? e);
        if (isMounted.current)
          Alert.alert('answer 오류', e?.message ?? 'answer 처리 중 에러');
      }
    };
    const handleIce = async ({ candidate }) => {
      try {
        if (candidate && pc.current && isMounted.current) {
          await pc.current.addIceCandidate(candidate);
          console.log('ICE candidate 추가');
        }
      } catch (e) {
        console.log('ice 핸들러 오류:', e?.message ?? e);
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice', handleIce);

    if (socket.id !== remotePeerId) {
      (async () => {
        try {
          const offer = await pc.current.createOffer();
          await pc.current.setLocalDescription(offer);
          socket.emit('offer', { offer, to: remotePeerId, from: socket.id });
          console.log('발신측에서 offer 생성/전송');
        } catch (e) {
          console.log('offer 생성/emit 오류:', e?.message ?? e);
          if (isMounted.current)
            Alert.alert('offer 생성/송신 오류', e?.message ?? 'offer 과정 중 에러');
        }
      })();
    }

    return () => {
      closed = true;
      isMounted.current = false;
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice', handleIce);
      if (pc.current) {
        try {
          pc.current.ontrack = null;
          pc.current.onicecandidate = null;
          pc.current.close();
        } catch (e) {}
        pc.current = null;
      }
      if (localStream && localStream.release) {
        try {
          localStream.release();
        } catch (e) {}
      }
      setLocalStream(null);
      setRemoteStream(null);
      console.log('peerConnection/시그널링 cleanup');
    };
  }, [remotePeerId, socket, localStream]);

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
      {remoteStream && <Text style={{color: '#fff'}}>상대의 오디오 스트림이 들어옴!</Text>}
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