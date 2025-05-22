import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext'; // 경로 주의!

// 실제 socket/context에서 가져와야 함!
const fakeSocket = {
    emit: (event, data) => {
        console.log(`SOCKET EMIT: ${event}`, data);
    }
};

export default function CallScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    const { isLightMode } = useTheme ? useTheme() : { isLightMode: false };

    // 예시로 state에 세팅 (실제 socket/userPhoneNumber는 props/context/redux 등에서 받아오세요)
    const [socket] = useState(fakeSocket);
    const [userPhoneNumber] = useState('01012345678');

    // 파라미터 추출
    const {
        callState: initialCallState = 'outgoing',
        peer = { name: 'Unknown', number: '', avatar: null }
    } = route.params || {};

    // 없는 번호 예시 목록 (실제 서비스에서는 서버 결과 값 등으로 체크)
    const invalidNumbers = ['', '12345', '000'];

    // 🟠 상태값: peer/통화상태 초기화 버전!
    const [callState, setCallState] = useState(initialCallState);
    const [callTime, setCallTime] = useState(0);
    const [localPeer, setLocalPeer] = useState(peer);

    // 화면 포커스(들어올 때마다) 모든 상태값 초기화
    useFocusEffect(
        useCallback(() => {
            setCallState(initialCallState);
            setCallTime(0);
            setLocalPeer(peer);
        }, [initialCallState, peer.number, peer.name, peer.avatar])
    );

    // 타이머 관리
    useEffect(() => {
        let timer = null;
        if (callState === 'active') {
            timer = setInterval(() => setCallTime(t => t + 1), 1000);
        } else {
            setCallTime(0);
        }
        return () => timer && clearInterval(timer);
    }, [callState]);

    const formatTime = sec =>
        `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    // 상태 메시지 (localPeer 참조)
    let stateText = '';
    if (invalidNumbers.includes(localPeer.number)) {
        stateText = '없는 번호입니다';
    } else if (callState === 'outgoing') stateText = 'Calling...';
    else if (callState === 'incoming') stateText = 'Incoming call';
    else if (callState === 'active') stateText = formatTime(callTime);
    else if (callState === 'idle') stateText = '대기 중';

    // 버튼 핸들러
    const handleAccept = () => setCallState('active');
    const handleReject = () => navigation.navigate('VoIPScreen');
    const handleHangup = () => navigation.navigate('VoIPScreen');

    // 발신(전화걸기) 핸들러: localPeer 사용!
    const handleCall = () => {
        if (!localPeer.number) return Alert.alert('상대 번호 정보 없음!');
        if (!socket) return Alert.alert('소켓 연결 필요!');
        if (!userPhoneNumber) return Alert.alert('내 전화번호 정보 필요!');
        socket.emit('call', { to: localPeer.number.trim(), from: userPhoneNumber });
        Alert.alert('발신', `${localPeer.number} 번호로 VOIP 전화 요청`);
        setCallState('outgoing');
    };

    const dynamicStyles = getDynamicStyles(isLightMode); // 동적 스타일 적용

    return (
        <SafeAreaView style={dynamicStyles.container}>
            {/* 배경 파동 */}
            <View style={dynamicStyles.pulseLayer} pointerEvents="none">
                <Svg
                    width={200}
                    height={80}
                    style={{ position: 'absolute', left: 30, top: 65 }}
                    fill="none"
                >
                    <Path
                        d="M0 50 Q40 16, 60 50 Q80 90, 110 47 Q130 16, 160 50 Q180 66,200 16"
                        stroke="#56ccff"
                        strokeWidth={7}
                        strokeLinecap="round"
                        opacity={0.17}
                    />
                </Svg>
                <Svg
                    width={120}
                    height={60}
                    style={{ position: 'absolute', right: 30, top: 150 }}
                    fill="none"
                >
                    <Path
                        d="M0 40 Q20 10, 40 40 Q60 60, 120 20"
                        stroke="#297afd"
                        strokeWidth={5}
                        strokeLinecap="round"
                        opacity={0.13}
                    />
                </Svg>
            </View>
    
            {/* 본문 */}
            <View style={dynamicStyles.centerArea}>
                <View style={dynamicStyles.profileContainer}>
                    {localPeer.avatar ? (
                        <Image source={localPeer.avatar} style={dynamicStyles.avatar} />
                    ) : (
                        <View style={dynamicStyles.avatarFallback}>
                            <Icon name="person" size={58} color="#93d5f6" />
                        </View>
                    )}
                    <Text style={dynamicStyles.name}>
                        {localPeer.name || localPeer.number || 'Unknown'}
                    </Text>
                    <Text style={dynamicStyles.number}>{localPeer.number}</Text>
                </View>
                <Text style={dynamicStyles.statusText}>{stateText}</Text>
            </View>
    
            {/* 버튼 */}
            <View style={dynamicStyles.buttonRow}>
                {/* 발신 버튼: 통화 대기 상태에서만 노출 */}
                {!invalidNumbers.includes(localPeer.number) && callState === 'idle' && (
                    <TouchableOpacity
                        style={[dynamicStyles.circleButton, dynamicStyles.acceptButton]}
                        onPress={handleCall}
                    >
                        <Icon name="call" size={28} color="#fff" />
                    </TouchableOpacity>
                )}
    
                {/* 수신(받기/거절) */}
                {!invalidNumbers.includes(localPeer.number) && callState === 'incoming' && (
                    <>
                        <TouchableOpacity
                            style={[dynamicStyles.circleButton, dynamicStyles.acceptButton]}
                            onPress={handleAccept}
                        >
                            <Icon name="call" size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[dynamicStyles.circleButton, dynamicStyles.rejectButton]}
                            onPress={handleReject}
                        >
                            <Icon name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
                {/* 발신: 통화 연결 전(거절) */}
                {!invalidNumbers.includes(localPeer.number) && callState === 'outgoing' && (
                    <TouchableOpacity
                        style={[dynamicStyles.circleButton, dynamicStyles.rejectButton]}
                        onPress={handleReject}
                    >
                        <Icon
                            name="call"
                            size={28}
                            color="#fff"
                            style={{ transform: [{ rotate: '135deg' }] }}
                        />
                    </TouchableOpacity>
                )}
                {/* 통화중: (끊기) */}
                {!invalidNumbers.includes(localPeer.number) && callState === 'active' && (
                    <TouchableOpacity
                        style={[dynamicStyles.circleButton, dynamicStyles.rejectButton]}
                        onPress={handleHangup}
                    >
                        <Icon
                            name="call"
                            size={28}
                            color="#fff"
                            style={{ transform: [{ rotate: '135deg' }] }}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}    
const getDynamicStyles = (isLightMode) =>
    StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pulseLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    centerArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    profileContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#47a9fa',
        backgroundColor: '#22293d',
        marginBottom: 8,
    },
    avatarFallback: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#22293d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#47a9fa',
        marginBottom: 8,
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        color: '#eaf6ff',
        marginTop: 8,
        textAlign: 'center',
    },
    number: {
        fontSize: 16,
        color: '#73b0f7',
        marginBottom: 6,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 20,
        color: '#71f4ff',
        marginVertical: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 36,
        zIndex: 3,
        gap: 30,
    },
    circleButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 18,
        shadowColor: '#111',
        shadowOffset: { width: 1, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 7,
        elevation: 5,
    },
    acceptButton: {
        backgroundColor: '#29c98e',
    },
    rejectButton: {
        backgroundColor: '#ef4c54',
    },
});