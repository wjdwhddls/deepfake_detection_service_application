import { StyleSheet } from 'react-native';  

const styles = StyleSheet.create({  
    container: {  
        flex: 1,  
        backgroundColor: '#121212', // 다크 모드 배경색  
        padding: 16,  
    },  
    header: {  
        alignItems: 'center',  
        marginBottom: 20,  
    },  
    profileImage: {  
        width: 100,  
        height: 100,  
        borderRadius: 50,   
        marginBottom: 10,  
    },  
    username: {  
        fontSize: 24,  
        color: '#ffffff',  
        fontWeight: 'bold',  
    },  
    email: {  
        fontSize: 14,  
        color: '#aaaaaa',  
    },  
    menu: {  
        flex: 1,  
    },  
    menuItem: {  
        backgroundColor: '#1f1f1f',  
        padding: 16,  
        marginVertical: 8,  
        borderRadius: 8,  
    },  
    menuText: {  
        color: '#ffffff',  
        fontSize: 18,  
    },  
    subText: {  
        color: '#aaaaaa',  
        fontSize: 14,  
        textAlign: 'right',  
    },  
});  

export default styles;