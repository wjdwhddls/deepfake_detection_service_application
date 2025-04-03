import React from 'react';
import { Image, StyleSheet } from 'react-native';

const Logo = () => {
  return <Image source={require('../assets/wave.png')} style={styles.image} />;
};

const styles = StyleSheet.create({
  image: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
});

export default Logo;
