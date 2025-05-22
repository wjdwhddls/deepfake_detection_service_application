import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';

/**
 * CallScreen
 * @param {string} callState         // 'outgoing', 'incoming', 'active'
 * @param {object} peer              // { name, number, avatar }
 * @param {function} onAccept
 * @param {function} onReject
 * @param {function} onHangup
 * @param {boolean} isInvalidNumber  // 서버(소켓)에서 '없는 번호' 판정 시 true로 내려줌
 * @param {boolean} isRejected       // 상대방이 거절했을 때 true로 내려줌
 */
export default function CallScreen({
    callState = 'outgoing',
    peer = { name: 'Unknown', number: '', avatar: null },
    onAccept,
    onReject,
    onHangup,
    isInvalidNumber = false,
    isRejected = false,  // ← 추가: 상대가 거절했을 때 true
}) {
    // 타이머
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
    if (isInvalidNumber) {
        stateText = '없는 번호입니다';
    } else if (isRejected) {
        stateText = '상대방이 전화를 거절했습니다';
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
                {/* "없는 번호" 또는 "거절"일 때는 닫기 버튼만 */}
                {(isInvalidNumber || isRejected) ? (
                    <TouchableOpacity
                        style={[styles.circleButton, styles.rejectButton]}
                        onPress={onReject}
                    >
                        <Icon name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <>
                        {/* 수신 상태: 수락/거절 */}
                        {callState === 'incoming' && (
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
                        {/* 발신: 종료(거절)만 */}
                        {callState === 'outgoing' && (
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
                        {/* 통화중: 종료(끊기)만 */}
                        {callState === 'active' && (
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
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fbfc',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pulseLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#d3eaf7',
        marginBottom: 10,
        overflow: 'hidden',
    },
    avatarFallback: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#d3eaf7',
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3394e5',
    },
    number: {
        fontSize: 16,
        color: '#6bb2e7',
        marginTop: 4,
    },
    statusText: {
        fontSize: 18,
        color: '#7bbef6',
        marginVertical: 30,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 44,
    },
    circleButton: {
        width: 74,
        height: 74,
        borderRadius: 37,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 22,
        shadowColor: '#297afd',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
        elevation: 4,
    },
    acceptButton: {
        backgroundColor: '#62d96f',
    },
    rejectButton: {
        backgroundColor: '#ed489a',
    },
});
