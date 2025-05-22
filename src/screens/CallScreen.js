import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';

// callState, peer, onAccept, onReject, onHangup 모두 props로 받습니다!
export default function CallScreen({
    callState = 'outgoing',        // 'outgoing', 'incoming', 'active'
    peer = { name: 'Unknown', number: '', avatar: null },
    onAccept,
    onReject,
    onHangup,
}) {
    // 없는 번호 예시 (실제 서비스에서는 서버 등으로 체크)
    const invalidNumbers = ['', '12345', '000'];

    // 타이머 설정(통화시간 표시)
    const [callTime, setCallTime] = useState(0);
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

    // 상태 메시지
    let stateText = '';
    if (invalidNumbers.includes(peer.number)) {
        stateText = '없는 번호입니다';
    } else if (callState === 'outgoing') stateText = 'Calling...';
    else if (callState === 'incoming') stateText = 'Incoming call';
    else if (callState === 'active') stateText = formatTime(callTime);

    return (
        <SafeAreaView style={styles.container}>
            {/* 배경 파동 */}
            <View style={styles.pulseLayer} pointerEvents="none">
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
            <View style={styles.centerArea}>
                <View style={styles.profileContainer}>
                    {peer.avatar ? (
                        <Image source={peer.avatar} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Icon name="person" size={58} color="#93d5f6" />
                        </View>
                    )}
                    <Text style={styles.name}>
                        {peer.name || peer.number || 'Unknown'}
                    </Text>
                    <Text style={styles.number}>{peer.number}</Text>
                </View>

                <Text style={styles.statusText}>{stateText}</Text>
            </View>

            {/* 버튼 */}
            <View style={styles.buttonRow}>
                {!invalidNumbers.includes(peer.number) && callState === 'incoming' && (
                    <>
                        <TouchableOpacity
                            style={[styles.circleButton, styles.acceptButton]}
                            onPress={onAccept}
                        >
                            <Icon name="call" size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.circleButton, styles.rejectButton]}
                            onPress={onReject}
                        >
                            <Icon name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
                {!invalidNumbers.includes(peer.number) && callState === 'outgoing' && (
                    <TouchableOpacity
                        style={[styles.circleButton, styles.rejectButton]}
                        onPress={onReject}
                    >
                        <Icon
                            name="call"
                            size={28}
                            color="#fff"
                            style={{ transform: [{ rotate: '135deg' }] }}
                        />
                    </TouchableOpacity>
                )}
                {!invalidNumbers.includes(peer.number) && callState === 'active' && (
                    <TouchableOpacity
                        style={[styles.circleButton, styles.rejectButton]}
                        onPress={onHangup}
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

const styles = StyleSheet.create({
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