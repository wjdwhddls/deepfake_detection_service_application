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

  useEffect(() => {
    let isClosed = false;
    const signalHandlers = {};

    const initConnection = async () => {
      if (!enabled || !remotePeerId || !socket?.connected) {
        console.warn('[VoIP] Skipping setup:', {
          enabled,
          remotePeerId,
          socketConnected: socket?.connected,
        });
        return;
      }

      console.log('[VoIP] 🔧 Initializing VoIP connection...');
      console.log('[VoIP] ➔ isCaller:', isCaller);

      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        console.log('[VoIP] 🎙️ Local media stream acquired:', stream.toURL?.() ?? stream);
        localStreamRef.current = stream;

        await sleep(300);

        if (pc.current) {
          console.warn('[VoIP] ⚠️ PeerConnection already exists!');
          return;
        }

        try {
          pc.current = new RTCPeerConnection(peerConfig);
        } catch (e) {
          console.error('[VoIP] ❌ Failed to initialize PeerConnection:', e);
          if (onHangup) onHangup('peerconnection_error', e?.message || e);
          return;
        }

        console.log('[VoIP] 🧑‍🔧 Created RTCPeerConnection');

        stream.getTracks().forEach((track) => {
          pc.current.addTrack(track, stream);
          console.log(`[VoIP] ➕ Added local track (${track.kind})`);
        });

        pc.current.oniceconnectionstatechange = () => {
          if (!pc.current) {
            console.warn('[VoIP] ICE connection state change event triggered but pc is null');
            return;
          }
          const state = pc.current.iceConnectionState;
          console.log('[VoIP] ICE connection state:', state);
          if (["failed", "disconnected", "closed"].includes(state)) {
            if (!isClosed && onHangup) {
              onHangup('ice_disconnected');
            }
          }
        };

        pc.current.ontrack = (event) => {
          if (isClosed) return;
          console.log('[VoIP] 📱 Received remote track:', event.track.kind);
          const stream = event.streams[0] || remoteMediaStream.current;
          remoteMediaStream.current.addTrack(event.track);
          if (onRemoteStream) {
            console.log('[VoIP] 🎧 Calling onRemoteStream...');
            onRemoteStream(stream);
          }
        };

        pc.current.onicecandidate = (e) => {
          if (e.candidate && socket?.connected) {
            console.log('[VoIP] ❄️ Sending ICE candidate');
            socket.emit('ice', {
              candidate: e.candidate,
              to: remotePeerId,
              from: socket.id,
            });
          } else {
            console.log('[VoIP] ✅ ICE candidate gathering complete');
          }
        };

        signalHandlers.handleOffer = async ({ offer, from }) => {
          if (isClosed || !pc.current) return;
          console.log('[VoIP] 📩 Received offer from', from);
          try {
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit('answer', { answer, to: from, from: socket.id });
            console.log('[VoIP] 📤 Sent answer to', from);
          } catch (err) {
            console.error('[VoIP] ❌ Failed to handle offer:', err);
          }
        };

        signalHandlers.handleAnswer = async ({ answer }) => {
          if (isClosed || !pc.current) return;
          try {
            await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[VoIP] ✅ Set remote description (answer)');
            if (onRemoteStream) onRemoteStream(remoteMediaStream.current);
          } catch (err) {
            console.error('[VoIP] ❌ Failed to handle answer:', err);
          }
        };

        signalHandlers.handleIce = async ({ candidate }) => {
          if (candidate && pc.current) {
            try {
              await pc.current.addIceCandidate(candidate);
              console.log('[VoIP] ➕ Added remote ICE candidate');
            } catch (e) {
              console.error('[VoIP] ❌ Error adding ICE candidate:', e);
            }
          }
        };

        socket.off('offer').on('offer', signalHandlers.handleOffer);
        socket.off('answer').on('answer', signalHandlers.handleAnswer);
        socket.off('ice').on('ice', signalHandlers.handleIce);
        console.log('[VoIP] 📱 Signal handlers registered');

        if (isCaller) {
          try {
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            socket.emit('offer', {
              offer,
              to: remotePeerId,
              from: socket.id,
            });
            console.log('[VoIP] ☎️ Created and sent offer to', remotePeerId);
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
      console.log('[VoIP] 🔧 Cleaning up connection');

      socket?.off('offer', signalHandlers.handleOffer);
      socket?.off('answer', signalHandlers.handleAnswer);
      socket?.off('ice', signalHandlers.handleIce);

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
          console.log('[VoIP] 🎙️ Stopped local stream tracks');
        } catch (e) {
          console.warn('[VoIP] ⚠️ Error stopping tracks:', e);
        }
        localStreamRef.current = null;
      }

      remoteMediaStream.current = new MediaStream();
    };
  }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}
