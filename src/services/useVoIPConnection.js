// src/services/useVoIPConnection.js
import { useRef, useEffect, useState } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { NativeModules } from 'react-native';

const { DeepfakeDetector } = NativeModules || {};

const peerConfig = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function useVoIPConnection({
  enabled,
  remotePeerId,
  socket,
  isCaller,
  onRemoteStream,
  onHangup,
}) {
  const pc = useRef(null);
  const localStreamRef = useRef(null);
  const remoteMediaStream = useRef(new MediaStream());
  const pendingCandidates = useRef([]);
  const [pendingOffer, setPendingOffer] = useState(null);
  const currentRemoteTrackId = useRef(null);

  // 네이티브 모듈 초기화 헬퍼
  const ensureModel = async () => {
    if (!DeepfakeDetector?.initModel) return;
    try {
      await DeepfakeDetector.initModel(); // 여러 번 호출해도 안전
    } catch (e) {
      console.warn('[VoIP] Deepfake model init failed:', e?.message || e);
    }
  };

  // 소켓 신호 핸들러 등록
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer, from }) => {
      console.log('[VoIP] 📩 Received offer from', from);
      setPendingOffer({ offer, from });
    };

    const handleAnswer = async ({ answer }) => {
      if (!pc.current) return;
      console.log('[VoIP] 📩 Received answer');
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[VoIP] ✅ Set remote description (answer)');
      } catch (err) {
        console.error('[VoIP] ❌ Failed to handle answer:', err);
      }
    };

    const handleIce = async ({ candidate }) => {
      if (candidate) {
        if (pc.current?.remoteDescription) {
          try {
            await pc.current.addIceCandidate(candidate);
            console.log('[VoIP] 📥 ICE candidate added immediately');
          } catch (e) {
            console.error('[VoIP] ❌ Error adding ICE candidate:', e);
          }
        } else {
          pendingCandidates.current.push(candidate);
          console.log('[VoIP] 📥 ICE candidate queued (no remote description yet)');
        }
      }
    };

    socket.off('offer').on('offer', handleOffer);
    socket.off('answer').on('answer', handleAnswer);
    socket.off('ice').on('ice', handleIce);

    console.log('[VoIP] 📱 Signal handlers registered');

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice', handleIce);
    };
  }, [socket]);

  const initConnection = async (caller) => {
    if (!socket?.connected) return;

    console.log('[VoIP] 🔧 Initializing VoIP connection...');
    console.log('[VoIP] ➔ isCaller:', caller);

    try {
      await ensureModel();

      const stream = await mediaDevices.getUserMedia({ audio: true });
      console.log('[VoIP] 🎧 Local media stream acquired');
      localStreamRef.current = stream;

      await sleep(300);
      pc.current = new RTCPeerConnection(peerConfig);
      console.log('[VoIP] 🧑‍💻 Created RTCPeerConnection');

      stream.getTracks().forEach((track) => {
        pc.current.addTrack(track, stream);
      });

      pc.current.oniceconnectionstatechange = () => {
        const state = pc.current?.iceConnectionState;
        console.log('[VoIP] 🧊 ICE state:', state);
        if (['failed', 'disconnected', 'closed'].includes(state)) {
          if (onHangup) onHangup('ice_disconnected');
        }
      };

      pc.current.ontrack = async (event) => {
        const stream = event.streams[0];
        const track = event.track;

        if (stream) {
          stream.getTracks().forEach((t) => remoteMediaStream.current.addTrack(t));
          onRemoteStream?.(stream);
        }

        // 원격 오디오 트랙 ID만 기록 (모니터 시작은 App.js에서만)
        if (track?.kind === 'audio') {
          currentRemoteTrackId.current = track.id;
          console.log('[VoIP] Remote audio track detected:', track.id);
        }
      };

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice', {
            candidate: e.candidate,
            to: remotePeerId,
            from: socket.id,
          });
        }
      };

      if (caller) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        console.log('[VoIP] ☎️ Created and sent offer');
        socket.emit('offer', { offer, to: remotePeerId, from: socket.id });
      }
    } catch (err) {
      console.error('[VoIP] ❌ Error during initConnection:', err);
      if (onHangup) onHangup('init_error', err?.message || err);
    }
  };

  // 수락 버튼 누를 때 호출되는 함수
  const acceptCall = async () => {
    if (!pendingOffer) return;
    console.log('[VoIP] ✅ Accepting call...');
    await initConnection(false);

    try {
      await pc.current.setRemoteDescription(new RTCSessionDescription(pendingOffer.offer));
      console.log('[VoIP] ✅ Set remote description (offer)');

      for (const c of pendingCandidates.current) {
        await pc.current.addIceCandidate(c);
      }
      pendingCandidates.current = [];

      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      console.log('[VoIP] 📤 Created and sent answer');

      socket.emit('answer', { answer, to: pendingOffer.from, from: socket.id });
      setPendingOffer(null);
    } catch (err) {
      console.error('[VoIP] ❌ Failed to accept call:', err);
      if (onHangup) onHangup('accept_error', err?.message || err);
    }
  };

  // lifecycle
  useEffect(() => {
    if (!enabled) {
      console.warn('[VoIP] Skipping setup (enabled/socket):', {
        enabled,
        socketConnected: socket?.connected,
      });
      return;
    }

    if (isCaller) {
      initConnection(true);
    }

    return () => {
      console.log('[VoIP] 🔧 Cleaning up connection');
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      remoteMediaStream.current = new MediaStream();
      pendingCandidates.current = [];
      setPendingOffer(null);
      currentRemoteTrackId.current = null;
    };
  }, [enabled, remotePeerId, socket, isCaller]);

  return { acceptCall };
}
