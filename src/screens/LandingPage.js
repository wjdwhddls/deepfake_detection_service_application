// src/screens/LandingPage.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../components/Header';
import WaveAnimation from '../components/WaveAnimation';
import Button from '../components/Button';

const LandingPage = () => {
    const handleDetect = () => {
        // Detect 버튼 클릭 시 동작할 함수
        console.log('Detect Pressed');
    };

    return (
        <View style={styles.container}>
            <Header />
            <WaveAnimation />
            <Button title="DETECT" onPress={handleDetect} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LandingPage;
