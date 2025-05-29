// WarningScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Linking,
} from 'react-native';

export default function WarningScreen({ visible }) {
  const translateY = new Animated.Value(-200);

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([500, 500, 500]);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const contactOptions = [
    {
      label: '경찰청 피싱수사계 (02-3150-2787)',
      phone: 'tel:0231502787',
    },
    {
      label: '긴급 신고 (112)',
      phone: 'tel:112',
    },
    {
      label: '전기통신금융사기 제보 (1566-1188)',
      phone: 'tel:15661188',
    },
  ];

  return (
    visible && (
      <Animated.View style={[styles.modal, { transform: [{ translateY }] }]}>
        <Text style={styles.title}>⚠️ 딥보이스 의심 전화입니다</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => Linking.openURL(option.phone)}
          >
            <Text style={styles.buttonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    )
  );
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF5252',
    padding: 16,
    zIndex: 1000,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 4,
  },
  buttonText: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
});