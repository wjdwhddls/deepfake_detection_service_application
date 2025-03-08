import React from 'react';  
import { TouchableOpacity, Text } from 'react-native';  
import styles from '../style/style';

const Menu = () => {  
    const menuItems = [  
        { title: '프로필 설정' },  
        { title: '알림 설정', subText: '켜짐' },  
        { title: '라이트 모드 / 다크 모드', subText: '다크' },  
        { title: '탑기록' },  
        { title: '내가 게시한 글' },  
        { title: '정보' },  
        { title: '자주 묻는 질문' },  
        { title: '개인정보 처리방침' },  
    ];  

    return (  
        <>  
            {menuItems.map((item, index) => (  
                <TouchableOpacity key={index} style={styles.menuItem}>  
                    <Text style={styles.menuText}>{item.title}</Text>  
                    {item.subText && <Text style={styles.subText}>{item.subText}</Text>}  
                </TouchableOpacity>  
            ))}  
        </>  
    );  
};  

export default Menu;