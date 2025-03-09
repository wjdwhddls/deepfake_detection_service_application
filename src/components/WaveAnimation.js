// src/components/WaveAnimation.js
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const WaveAnimation = () => {
    return (
        <View style={styles.container}>
            <Image source={require('../assets/wave.png')} style={styles.waveImage} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
    },
    waveImage: {
        width: 200, // 이미지 크기를 조절
        height: 200,
        resizeMode: 'contain',
    },
});

export default WaveAnimation;
