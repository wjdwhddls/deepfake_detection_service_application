import { useRef, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

const peerConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
  ],
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

      console.log('[VoIP] \uD83D\uDD27 Initializing VoIP connection...');
      console.log('[VoIP] \u2794 isCaller:', isCaller);

      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        console.log('[VoIP] \uD83C\uDF99\uFE0F Local media stream acquired:', stream.toURL?.() ?? stream);
        localStreamRef.current = stream;

        await sleep(300);

        if (pc.current) {
          console.warn('[VoIP] \u26A0\uFE0F PeerConnection already exists!');
          return;
        }

        pc.current = new RTCPeerConnection(peerConfig);
        console.log('[VoIP] \uD83E\uDDF1 Created RTCPeerConnection');

        stream.getTracks().forEach((track) => {
          pc.current.addTrack(track, stream);
          console.log(`[VoIP] \u2795 Added local track (${track.kind})`);
        });

        pc.current.oniceconnectionstatechange = () => {
          console.log('[VoIP] ICE connection state:', pc.current.iceConnectionState);
        };

        pc.current.ontrack = (event) => {
          if (isClosed) return;
          console.log('[VoIP] \uD83D\uDCF1 Received remote track:', event.track.kind);
          const stream = event.streams[0] || remoteMediaStream.current;
          remoteMediaStream.current.addTrack(event.track);
          if (onRemoteStream) {
            console.log('[VoIP] \uD83C\uDFA7 Calling onRemoteStream...');
            onRemoteStream(stream);
          }
        };

        pc.current.onicecandidate = (e) => {
          if (e.candidate && socket.connected) {
            console.log('[VoIP] \u2744\uFE0F Sending ICE candidate');
            socket.emit('ice', {
              candidate: e.candidate,
              to: remotePeerId,
              from: socket.id,
            });
          } else {
            console.log('[VoIP] \u2705 ICE candidate gathering complete');
          }
        };

        signalHandlers.handleOffer = async ({ offer, from }) => {
          if (isClosed || !pc.current) return;
          console.log('[VoIP] \uD83D\uDCE9 Received offer from', from);
          try {
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit('answer', { answer, to: from, from: socket.id });
            console.log('[VoIP] \uD83D\uDCE4 Sent answer to', from);
          } catch (err) {
            console.error('[VoIP] \u274C Failed to handle offer:', err);
          }
        };

        signalHandlers.handleAnswer = async ({ answer }) => {
          if (isClosed || !pc.current) return;
          try {
            await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[VoIP] \u2705 Set remote description (answer)');
            if (onRemoteStream) onRemoteStream(remoteMediaStream.current);
          } catch (err) {
            console.error('[VoIP] \u274C Failed to handle answer:', err);
          }
        };

        signalHandlers.handleIce = async ({ candidate }) => {
          if (candidate && pc.current) {
            try {
              await pc.current.addIceCandidate(candidate);
              console.log('[VoIP] \u2795 Added remote ICE candidate');
            } catch (e) {
              console.error('[VoIP] \u274C Error adding ICE candidate:', e);
            }
          }
        };

        socket.on('offer', signalHandlers.handleOffer);
        socket.on('answer', signalHandlers.handleAnswer);
        socket.on('ice', signalHandlers.handleIce);
        console.log('[VoIP] \uD83D\uDCF1 Signal handlers registered');

        if (isCaller) {
          try {
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            socket.emit('offer', {
              offer,
              to: remotePeerId,
              from: socket.id,
            });
            console.log('[VoIP] \u260E\uFE0F Created and sent offer to', remotePeerId);
          } catch (err) {
            console.error('[VoIP] \u274C Failed to create/send offer:', err);
          }
        }
      } catch (err) {
        console.error('[VoIP] \u274C Error during initConnection:', err);
        if (onHangup) onHangup('init_error', err?.message || err);
      }
    };

    initConnection();

    return () => {
      isClosed = true;
      console.log('[VoIP] \uD83D\uDD27 Cleaning up connection');

      socket?.off('offer', signalHandlers.handleOffer);
      socket?.off('answer', signalHandlers.handleAnswer);
      socket?.off('ice', signalHandlers.handleIce);

      if (pc.current) {
        try {
          pc.current.close();
          console.log('[VoIP] \uD83D\uDD0C Closed RTCPeerConnection');
        } catch (e) {
          console.warn('[VoIP] \u26A0\uFE0F Error closing RTCPeerConnection:', e);
        }
        pc.current = null;
      }

      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          console.log('[VoIP] \uD83C\uDF99\uFE0F Stopped local stream tracks');
        } catch (e) {
          console.warn('[VoIP] \u26A0\uFE0F Error stopping tracks:', e);
        }
        localStreamRef.current = null;
      }

      remoteMediaStream.current = new MediaStream();
    };
  }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}
