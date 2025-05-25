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

        // MediaStream 가져오기
        mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                localStreamRef.current = stream;

                // PeerConnection이 없는 경우에만 생성
                if (!pc.current) {
                    pc.current = new RTCPeerConnection(peerConfig);
                }

                // 로컬 트랙을 PeerConnection에 추가
                stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

                // 원격 트랙 수신 처리
                pc.current.ontrack = (event) => {
                    if (isClosed) return;
                    const newStream = event.streams[0] || remoteMediaStream.current;
                    remoteMediaStream.current.addTrack(event.track); // 원격 오디오 스트림 추가
                    if (onRemoteStream) onRemoteStream(newStream); // 원격 스트림 전달
                };

                // ICE 후보 송신
                pc.current.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit('ice', { candidate: e.candidate, to: remotePeerId, from: socket.id });
                    }
                };

                // Offer 핸들러 등록
                signalHandlers.handleOffer = async ({ offer, from }) => {
                    if (isClosed || !pc.current) return;
                    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);
                    socket.emit('answer', { answer, to: from, from: socket.id });
                };

                // Answer 핸들러 등록
                signalHandlers.handleAnswer = async ({ answer }) => {
                    if (isClosed || !pc.current) return;
                    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                    if (onRemoteStream) {
                        onRemoteStream(remoteMediaStream.current); // 스트림 업데이트
                    }
                };

                // ICE 후보 수신 처리
                signalHandlers.handleIce = async ({ candidate }) => {
                    if (candidate && pc.current) {
                        try {
                            await pc.current.addIceCandidate(candidate);
                        } catch (e) {
                            console.error('Error adding ICE candidate:', e);
                        }
                    }
                };

                // 소켓 이벤트 핸들러 등록
                socket.on('offer', signalHandlers.handleOffer);
                socket.on('answer', signalHandlers.handleAnswer);
                socket.on('ice', signalHandlers.handleIce);

                // Caller 경우 Offer 생성 및 전송
                if (isCaller) {
                    (async () => {
                        const offer = await pc.current.createOffer();
                        await pc.current.setLocalDescription(offer);
                        socket.emit('offer', { offer, to: remotePeerId, from: socket.id });
                    })();
                }
            })
            .catch((err) => {
                console.error('Failed to get media:', err);
                if (onHangup) onHangup('mic_error', err?.message || err);
            });

        return () => {
            isClosed = true;

            // 소켓 이벤트 해제
            socket.off('offer', signalHandlers.handleOffer);
            socket.off('answer', signalHandlers.handleAnswer);
            socket.off('ice', signalHandlers.handleIce);

            // PeerConnection 종료 및 초기화
            if (pc.current) {
                pc.current.ontrack = null;
                pc.current.onicecandidate = null;
                try { pc.current.close(); } catch (e) {}
                pc.current = null;
            }

            // 로컬 스트림 해제
            if (localStreamRef.current && localStreamRef.current.release) {
                try { localStreamRef.current.release(); } catch (e) {}
                localStreamRef.current = null;
            }
        };
    }, [enabled, remotePeerId, socket, isCaller, onRemoteStream, onHangup]);
}