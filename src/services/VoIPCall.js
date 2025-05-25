// src/components/VoIPCall.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const VoIPCall = ({
    isCaller,
    remotePeerName = '',
    onHangup,
    remoteStreamExists
}) => (
    <View style={styles.callContainer}>
      <Text style={{ color: '#fff', fontSize: 20 }}>
        {`VOIP 통화 연결됨 (${isCaller ? '발신자' : '수신자'})`}
        {remotePeerName ? `\n[상대: ${remotePeerName}]` : ''}
      </Text>
      <Button title="통화 종료" onPress={onHangup} color="#f44" />
      {remoteStreamExists && (
        <Text style={{color: '#fff'}}>상대의 오디오 스트림이 연결됨!</Text>
      )}
    </View>
);

const styles = StyleSheet.create({
  callContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99, backgroundColor: '#222c', justifyContent: 'center', alignItems: 'center',
  },
});

export default VoIPCall;