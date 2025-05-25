import { useRef, useEffect } from 'react';
import { RTCPeerConnection, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';

const peerConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

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
        if (!enabled || !remotePeerId || !socket) return;

        let isClosed = false;
        let signalHandlers = {};

        mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                localStreamRef.current = stream;
                pc.current = new RTCPeerConnection(peerConfig);

                stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

                pc.current.ontrack = (event) => {
                    if (isClosed) return;
                    let newStream = event.streams?.[0] || remoteMediaStream.current;
                    if (!event.streams[0] && event.track) {
                        remoteMediaStream.current.addTrack(event.track);
                        newStream = remoteMediaStream.current;
                    }
                    if (onRemoteStream) onRemoteStream(newStream);
                };

                pc.current.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit('ice', { candidate: e.candidate, to: remotePeerId, from: socket.id });
                    }
                };

                signalHandlers.handleOffer = async ({ offer, from }) => {
                    if (isClosed || !pc.current) return;
                    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);
                    socket.emit('answer', { answer, to: from, from: socket.id });
                };
                signalHandlers.handleAnswer = async ({ answer }) => {
                    if (isClosed || !pc.current) return;
                    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                };
                signalHandlers.handleIce = async ({ candidate }) => {
                    if (candidate && pc.current) await pc.current.addIceCandidate(candidate);
                };

                socket.on('offer', signalHandlers.handleOffer);
                socket.on('answer', signalHandlers.handleAnswer);
                socket.on('ice', signalHandlers.handleIce);

                if (isCaller) {
                    (async () => {
                        const offer = await pc.current.createOffer();
                        await pc.current.setLocalDescription(offer);
                        socket.emit('offer', { offer, to: remotePeerId, from: socket.id });
                    })();
                }
            })
            .catch((err) => {
                if (onHangup) onHangup('mic_error', err?.message || err);
            });

        return () => {
            isClosed = true;
            if (signalHandlers.handleOffer) socket.off('offer', signalHandlers.handleOffer);
            if (signalHandlers.handleAnswer) socket.off('answer', signalHandlers.handleAnswer);
            if (signalHandlers.handleIce) socket.off('ice', signalHandlers.handleIce);

            if (pc.current) {
                try { pc.current.ontrack = null; pc.current.onicecandidate = null; pc.current.close(); } catch (e) {}
                pc.current = null;
            }
            if (localStreamRef.current && localStreamRef.current.release) {
                try { localStreamRef.current.release(); } catch (e) {}
                localStreamRef.current = null;
            }
        };
    }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}