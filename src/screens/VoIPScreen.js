import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BUTTON_SIZE = SCREEN_WIDTH / 5;

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

function formatPhoneNumber(number) {
  const onlyNumber = number.replace(/[^0-9]/g, '');
  if (onlyNumber.length === 11 && onlyNumber.startsWith('01')) {
    return onlyNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 10 && onlyNumber.startsWith('02')) {
    return onlyNumber.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 10) {
    return onlyNumber.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
  if (onlyNumber.length === 9) {
    return onlyNumber.replace(/(\d{2,3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return onlyNumber;
}

export default function VoIPScreen({ isFocused, socket, userPhoneNumber, onStartCall }) {
  const [dialedNumber, setDialedNumber] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VoIP Dialer</Text>
      </View>

      <View style={styles.dialedNumberContainer}>
        <Text style={styles.dialedNumber}>{formatPhoneNumber(dialedNumber)}</Text>
      </View>

      <View style={styles.keypadContainer}>
        {keypadButtons.map(({ number, label }, idx) => (
          <View key={idx} style={styles.keypadWrapper}>
            <TouchableOpacity
              style={styles.keypadButton}
              onPress={() => handleKeyPress(number)}
              activeOpacity={0.7}
            >
              <Text style={styles.keypadButtonText}>{number}</Text>
              {!!label && <Text style={styles.keypadLabel}>{label}</Text>}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => onStartCall(formatPhoneNumber(dialedNumber), { name: '' })}
        >
          <Icon name="call" size={SCREEN_HEIGHT * 0.035} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
          <View style={styles.backspaceIconContainer}>
            <Icon name="backspace" size={SCREEN_HEIGHT * 0.03} color="#B0BEC5" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    marginTop: SCREEN_HEIGHT * 0.03,
    alignItems: 'center',
  },
  title: {
    fontSize: SCREEN_HEIGHT * 0.035,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  dialedNumberContainer: {
    marginTop: SCREEN_HEIGHT * 0.02,
    alignItems: 'center',
  },
  dialedNumber: {
    fontSize: SCREEN_HEIGHT * 0.03,
    color: '#000000',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#6A1B9A',
    width: '60%',
    textAlign: 'center',
  },
  keypadContainer: {
    marginTop: SCREEN_HEIGHT * 0.03,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  keypadWrapper: {
    width: '33.33%',
    alignItems: 'center',
    marginVertical: 8,
  },
  keypadButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  keypadButtonText: {
    fontSize: SCREEN_HEIGHT * 0.035,
    color: '#000000',
  },
  keypadLabel: {
    fontSize: SCREEN_HEIGHT * 0.015,
    color: '#000000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
    marginTop: SCREEN_HEIGHT * 0.03,
    alignItems: 'center',
  },
  backspaceButton: {
    width: SCREEN_HEIGHT * 0.06,
    height: SCREEN_HEIGHT * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  backspaceIconContainer: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 25,
    padding: 10,
  },
  callButton: {
    width: SCREEN_HEIGHT * 0.06,
    height: SCREEN_HEIGHT * 0.06,
    backgroundColor: '#34B7F1',
    borderRadius: SCREEN_HEIGHT * 0.03,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});