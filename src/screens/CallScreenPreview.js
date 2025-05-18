// CallScreenPreview.js
import React, { useState } from 'react';
import { SafeAreaView, View, Button, StyleSheet } from 'react-native';
import CallScreen from './CallScreen'; // 방금 만든 CallScreen을 import

export default function CallScreenPreview() {
    const [state, setState] = useState('outgoing');

    // 테스트용 상대방 데이터
    const peer = {
        name: "홍길동",
        number: "010-1234-5678",
        // avatar: require('./assets/avatar.png'), // 있으면 사용
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.btnGroup}>
                <Button title="발신(CALLING)" onPress={() => setState('outgoing')} />
                <Button title="수신(INCOMING)" onPress={() => setState('incoming')} />
                <Button title="통화중(ACTIVE)" onPress={() => setState('active')} />
            </View>
            <CallScreen
                callState={state}
                peer={peer}
                onAccept={() => setState('active')}
                onReject={() => setState('outgoing')}
                onHangup={() => setState('outgoing')}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    btnGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 28,
        marginBottom: 6,
        gap: 12,
    }
});
