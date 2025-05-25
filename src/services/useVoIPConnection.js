import { useRef, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

const peerConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

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

  useEffect(() => {
    if (!enabled || !remotePeerId || !socket) {
    if (!socket) {
      //console.error('[VoIP] Socket is not connected.'); // 소켓의 연결 상태를 체크하고 로그를 남김
    }
    return; // 소켓이 없으면 실행을 종료
  }

    let isClosed = false;
    let signalHandlers = {};

    console.log('[VoIP] Initializing VoIP connection...');

    mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log('[VoIP] Local media stream acquired.');
        localStreamRef.current = stream;

        if (!pc.current) {
          pc.current = new RTCPeerConnection(peerConfig);
          console.log('[VoIP] Created new RTCPeerConnection');
        }

        stream.getTracks().forEach((track) => {
          pc.current.addTrack(track, stream);
          console.log('[VoIP] Added local track:', track.kind);
        });

        pc.current.oniceconnectionstatechange = () => {
          console.log('[VoIP] ICE connection state:', pc.current.iceConnectionState);
        };

        pc.current.ontrack = (event) => {
          if (isClosed) return;
          console.log('[VoIP] Received remote track:', event.track.kind);

          const newStream = event.streams[0] || remoteMediaStream.current;
          remoteMediaStream.current.addTrack(event.track);

          if (onRemoteStream) {
            console.log('[VoIP] Calling onRemoteStream with remote stream');
            onRemoteStream(newStream);
          }
        };

        pc.current.onicecandidate = (e) => {
          if (e.candidate) {
            console.log('[VoIP] Sending ICE candidate');
            socket.emit('ice', {
              candidate: e.candidate,
              to: remotePeerId,
              from: socket.id,
            });
          } else {
            console.log('[VoIP] ICE candidate gathering complete');
          }
        };

        signalHandlers.handleOffer = async ({ offer, from }) => {
          if (isClosed || !pc.current) return;
          console.log('[VoIP] Received offer from', from);
          await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          socket.emit('answer', { answer, to: from, from: socket.id });
          console.log('[VoIP] Sent answer to', from);
        };

        signalHandlers.handleAnswer = async ({ answer }) => {
          if (isClosed || !pc.current) return;
          console.log('[VoIP] Received answer');
          await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
          if (onRemoteStream) {
            onRemoteStream(remoteMediaStream.current);
          }
        };

        signalHandlers.handleIce = async ({ candidate }) => {
          if (candidate && pc.current) {
            try {
              await pc.current.addIceCandidate(candidate);
              console.log('[VoIP] Added remote ICE candidate');
            } catch (e) {
              console.error('[VoIP] Error adding ICE candidate:', e);
            }
          }
        };

        socket.on('offer', signalHandlers.handleOffer);
        socket.on('answer', signalHandlers.handleAnswer);
        socket.on('ice', signalHandlers.handleIce);

        if (isCaller) {
          (async () => {
            try {
                console.log('[VoIP] Preparing to create offer...'); // Offer 생성을 준비했을 때 로그  
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                console.log('[VoIP] Created offer:', offer); // Offer 정보 확인
                socket.emit('offer', {
                    offer,
                    to: remotePeerId,
                    from: socket.id,
                });
                console.log('[VoIP] Sent offer to', remotePeerId);
            } catch (err) {
                console.error('[VoIP] Failed to create/send offer:', err);
            }
          })();
        }
      })
      .catch((err) => {
        console.error('[VoIP] Failed to get media:', err);
        if (onHangup) onHangup('mic_error', err?.message || err);
      });

    return () => {
      isClosed = true;
      console.log('[VoIP] Cleaning up connection...');

      socket.off('offer', signalHandlers.handleOffer);
      socket.off('answer', signalHandlers.handleAnswer);
      socket.off('ice', signalHandlers.handleIce);

      if (pc.current) {
        pc.current.ontrack = null;
        pc.current.onicecandidate = null;
        try {
          pc.current.close();
        } catch (e) {}
        pc.current = null;
        console.log('[VoIP] Closed RTCPeerConnection');
      }

      if (localStreamRef.current && localStreamRef.current.release) {
        try {
          localStreamRef.current.release();
          console.log('[VoIP] Released local stream');
        } catch (e) {}
        localStreamRef.current = null;
      }
    };
  }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}
