import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native'; // Lottie 애니메이션 라이브러리

class LandingPage extends Component {
    render() {
        return (
            <View style={styles.container}>
                <LottieView
                    source={require('../assets/wave-animation.json')} // Lottie JSON 파일 경로
                    autoPlay
                    loop
                    style={styles.animation}
                />
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // 배경색 검정
    },
    animation: {
        width: 300,
        height: 300, // 애니메이션 크기 설정
    },
});

export default LandingPage;
