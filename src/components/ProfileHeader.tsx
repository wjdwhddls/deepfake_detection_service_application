import React from 'react';  
import { View, Text, Image } from 'react-native';  
import styles from '../style/style';

const ProfileHeader = () => {  
    return (  
        <View style={styles.header}>  
            <Image   
                source={require('../assets/images/user-profile.jpg')} // 이미지 경로 (assets 폴더에 이미지 필요)  
                style={styles.profileImage}  
            />  
            <Text style={styles.username}>너 누구니</Text>  
            <Text style={styles.email}>deepfake@naver.com | +010 1111 2222</Text>  
        </View>  
    );  
};  

export default ProfileHeader;