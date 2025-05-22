import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const keypadButtons = [
    { number: '1', label: '' },
    { number: '2', label: 'ABC' },
    { number: '3', label: 'DEF' },
    { number: '4', label: 'GHI' },
    { number: '5', label: 'JKL' },
    { number: '6', label: 'MNO' },
    { number: '7', label: 'PQRS' },
    { number: '8', label: 'TUV' },
    { number: '9', label: 'WXYZ' },
    { number: '*', label: '' },
    { number: '0', label: '+' },
    { number: '#', label: '' },
];

// 하이픈 포함 포맷
function formatPhoneNumber(number) {
    const onlyNumber = number.replace(/[^0-9]/g, '');

    if (onlyNumber.length === 11 && onlyNumber.startsWith('01')) {
        return onlyNumber.replace(/(\d{3})(\d{4})(\d{4})/, '\$1-\$2-\$3');
    }
    if (onlyNumber.length === 10 && onlyNumber.startsWith('02')) {
        return onlyNumber.replace(/(\d{2})(\d{4})(\d{4})/, '\$1-\$2-\$3');
    }
    if (onlyNumber.length === 10) {
        return onlyNumber.replace(/(\d{3})(\d{3,4})(\d{4})/, '\$1-\$2-\$3');
    }
    if (onlyNumber.length === 9) {
        return onlyNumber.replace(/(\d{2,3})(\d{3})(\d{4})/, '\$1-\$2-\$3');
    }
    return onlyNumber;
}

export default function VoIPScreen({ isFocused, socket }) {
    const navigation = useNavigation();
    const [dialedNumber, setDialedNumber] = useState('');

    // 포커스될 때 입력값 초기화(선택 사항)
    useEffect(() => {
        if (isFocused) {
            setDialedNumber('');
        }
    }, [isFocused]);

    const handleKeyPress = (number) => {
        const onlyNumber = dialedNumber.replace(/[^0-9]/g, '');
        if (onlyNumber.length < 11) {
            setDialedNumber(prev => prev + number);
        }
    };

    const handleBackspace = () => {
        setDialedNumber(prev => prev.slice(0, -1));
    };

    const handleCall = () => {
        // 여기서 하이픈 포함값으로 동작
        const formattedNumber = formatPhoneNumber(dialedNumber);
        if (formattedNumber) {
            // DB, 소켓, CallScreen 이동 모두 하이픈 포함 번호로!
            if (socket && typeof socket.emit === 'function') {
                // 실제 자신의 전화번호로 바꿔주세요!
                const userPhoneNumber = '010-1234-5678'; 
                socket.emit('call', { to: formattedNumber, from: userPhoneNumber });
            }
            // DB 저장이 필요하면 여기도 formattedNumber로 활용!
            // saveToDB({ phoneNumber: formattedNumber, ... });

            navigation.navigate('CallScreen', {
                peer: {
                    name: '',
                    number: formattedNumber,
                },
                callState: 'outgoing',
            });
        } else {
            console.warn("Please enter a valid number to call.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>VoIP Dialer</Text>
            </View>

            <View style={styles.dialedNumberContainer}>
                <Text style={styles.dialedNumber}>
                    {formatPhoneNumber(dialedNumber)}
                </Text>
            </View>

            <View style={styles.keypadContainer}>
                {keypadButtons.map(({ number, label }, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.keypadButton}
                        onPress={() => handleKeyPress(number)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.keypadButtonText}>{number}</Text>
                        {!!label && <Text style={styles.keypadLabel}>{label}</Text>}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                    <Icon name="call" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
                    <View style={styles.backspaceIconContainer}>
                        <Icon name="backspace" size={20} color="#B0BEC5" />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.tabBarSpace} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: 70,
    },
    header: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1976D2',
        textAlign: 'center',
    },
    dialedNumberContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    dialedNumber: {
        fontSize: 25,
        color: '#000000',
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#6A1B9A',
        width: '60%',
        textAlign: 'center',
    },
    keypadContainer: {
        marginTop: 30,
        width: '60%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    keypadButton: {
        width: '25%',
        height: SCREEN_WIDTH * 0.15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        margin: 5,
        elevation: 2,
    },
    keypadButtonText: {
        fontSize: 28,
        color: '#000000',
    },
    keypadLabel: {
        fontSize: 12,
        color: '#000000',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '80%',
        marginVertical: 20,
        alignItems: 'center',
    },
    backspaceButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    backspaceIconContainer: {
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 25,
        padding: 10,
    },
    callButton: {
        width: 50,
        height: 50,
        backgroundColor: '#34B7F1',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        marginRight: 20,
    },
    tabBarSpace: {
        height: 70,
    },
});
