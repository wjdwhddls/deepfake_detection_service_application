import { useRef, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

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
  const signalHandlers = useRef({});

  useEffect(() => {
    let isClosed = false;
    let retryTimer = null;

    const registerSocketHandlers = () => {
      signalHandlers.current.handleOffer = async ({ offer, from }) => {
        if (isClosed || !pc.current) return;
        console.log('[VoIP] 📩 Received offer from', from, 'with offer:', offer);

        try {
          await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
          console.log('[VoIP] ✅ Set remote description (offer)');

          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          console.log('[VoIP] 📤 Created answer:', answer);

          socket.emit('answer', { answer, to: from, from: socket.id });
          console.log('[VoIP] 📤 Sent answer to', from);
        } catch (err) {
          console.error('[VoIP] ❌ Failed to handle offer:', err);
        }
      };

      signalHandlers.current.handleAnswer = async ({ answer }) => {
        if (isClosed || !pc.current) return;
        console.log('[VoIP] 📩 Received answer:', answer);

        try {
          await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('[VoIP] ✅ Set remote description (answer)');
        } catch (err) {
          console.error('[VoIP] ❌ Failed to handle answer:', err);
        }
      };

      signalHandlers.current.handleIce = async ({ candidate }) => {
        if (candidate && pc.current) {
          console.log('[VoIP] 📥 Received ICE candidate:', candidate);
          try {
            await pc.current.addIceCandidate(candidate);
            console.log('[VoIP] ➕ Added remote ICE candidate');
          } catch (e) {
            console.error('[VoIP] ❌ Error adding ICE candidate:', e);
          }
        }
      };

      socket?.off('offer').on('offer', signalHandlers.current.handleOffer);
      socket?.off('answer').on('answer', signalHandlers.current.handleAnswer);
      socket?.off('ice').on('ice', signalHandlers.current.handleIce);

      console.log('[VoIP] 📱 Signal handlers registered');
    };

    const initConnection = async () => {
      if (!enabled || !socket?.connected) {
        console.warn('[VoIP] Skipping setup (enabled/socket):', {
          enabled,
          socketConnected: socket?.connected,
        });
        return;
      }

      if (!remotePeerId) {
        console.warn('[VoIP] Waiting for remotePeerId...');
        retryTimer = setInterval(() => {
          if (remotePeerId && !isClosed && socket?.connected) {
            console.log('[VoIP] ✅ remotePeerId acquired, re-initializing...');
            clearInterval(retryTimer);
            initConnection(); // 재시도
          }
        }, 200);
        return;
      }

      console.log('[VoIP] 🔧 Initializing VoIP connection...');
      console.log('[VoIP] ➔ isCaller:', isCaller);

      try {
        registerSocketHandlers();

        let stream;
        try {
          stream = await mediaDevices.getUserMedia({ audio: true });
          console.log('[VoIP] 🎧 Local media stream acquired:', stream.toURL?.() ?? stream);
        } catch (err) {
          console.error('[VoIP] ❌ Error getting local media stream:', err);
          if (onHangup) onHangup('media_error', err?.message || err);
          return;
        }

        localStreamRef.current = stream;
        await sleep(300);

        pc.current = new RTCPeerConnection(peerConfig);
        console.log('[VoIP] 🧑‍💻 Created RTCPeerConnection');

        stream.getTracks().forEach((track) => {
          try {
            pc.current.addTrack(track, stream);
            console.log(`[VoIP] ➕ Added local track (${track.kind})`);
          } catch (e) {
            console.error('[VoIP] ❌ Failed to add local track:', e);
          }
        });

        pc.current.oniceconnectionstatechange = () => {
          const state = pc.current?.iceConnectionState;
          console.log('[VoIP] 🧊 ICE connection state:', state);
          if (['failed', 'disconnected', 'closed'].includes(state)) {
            if (!isClosed && onHangup) {
              onHangup('ice_disconnected');
            }
          }
        };

        pc.current.ontrack = (event) => {
          if (isClosed) return;
          console.log('[VoIP] 📱 Received remote track:', event.track.kind);

          const stream = event.streams[0];
          if (stream) {
            stream.getTracks().forEach((track) => {
              remoteMediaStream.current.addTrack(track);
            });
            if (onRemoteStream) {
              console.log('[VoIP] 🎧 Calling onRemoteStream with stream:', stream);
              onRemoteStream(stream);
            }
          } else {
            console.warn('[VoIP] ⚠️ No remote stream found in event.streams');
          }
        };

        pc.current.onicecandidate = (e) => {
          if (e.candidate && socket?.connected && remotePeerId) {
            console.log('[VoIP] ❄️ Sending ICE candidate:', e.candidate);
            socket.emit('ice', {
              candidate: e.candidate,
              to: remotePeerId,
              from: socket.id,
            });
          } else {
            console.log('[VoIP] ✅ ICE candidate gathering complete or no candidate');
          }
        };

        if (isCaller) {
          try {
            console.log('[VoIP] 📤 Creating offer...');
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            console.log('[VoIP] ☎️ Created offer:', offer);

            socket.emit('offer', {
              offer,
              to: remotePeerId,
              from: socket.id,
            });
            console.log('[VoIP] ☎️ Sent offer to', remotePeerId);
          } catch (err) {
            console.error('[VoIP] ❌ Failed to create/send offer:', err);
          }
        }
      } catch (err) {
        console.error('[VoIP] ❌ Error during initConnection:', err);
        if (onHangup) onHangup('init_error', err?.message || err);
      }
    };

    initConnection();

    return () => {
      isClosed = true;
      clearInterval(retryTimer);
      console.log('[VoIP] 🔧 Cleaning up connection');

      socket?.off('offer', signalHandlers.current.handleOffer);
      socket?.off('answer', signalHandlers.current.handleAnswer);
      socket?.off('ice', signalHandlers.current.handleIce);

      if (pc.current) {
        try {
          pc.current.close();
          console.log('[VoIP] 🔌 Closed RTCPeerConnection');
        } catch (e) {
          console.warn('[VoIP] ⚠️ Error closing RTCPeerConnection:', e);
        }
        pc.current = null;
      }

      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          console.log('[VoIP] 🎧 Stopped local stream tracks');
        } catch (e) {
          console.warn('[VoIP] ⚠️ Error stopping tracks:', e);
        }
        localStreamRef.current = null;
      }

      remoteMediaStream.current = new MediaStream();
    };
  }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}
