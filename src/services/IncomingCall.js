import React, { useEffect, useRef, useState } from 'react';  
import { Animated, Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';  
import { NativeEventEmitter, NativeModules } from 'react-native';  
import { UserCircleIcon, XMarkIcon } from "react-native-heroicons/solid";  

const callScreeningEvents = new NativeEventEmitter(NativeModules.CallReceiver);  

const IncomingCall = () => {  
    const [incomingNumber, setIncomingNumber] = useState(null);  

    const slideAnim = useRef(new Animated.Value(300)).current;  
    const backdropAnim = useRef(new Animated.Value(0)).current;  

    useEffect(() => {  
        const subscription = callScreeningEvents.addListener("CallScreeningEvent", (phoneNumber) => {  
            setIncomingNumber(phoneNumber);  
            slideUp();  
        });  

        return () => {  
            subscription.remove();  
        };  
    }, []);  

    const slideUp = () => {  
        Animated.parallel([  
            Animated.timing(slideAnim, {  
                toValue: 0,  
                duration: 300,  
                useNativeDriver: true,  
            }),  
            Animated.timing(backdropAnim, {  
                toValue: 0.9,  
                duration: 300,  
                useNativeDriver: true,  
            }),  
        ]).start();  
    };  

    const slideDown = () => {  
        Animated.parallel([  
            Animated.timing(slideAnim, {  
                toValue: 300,  
                duration: 300,  
                useNativeDriver: true,  
            }),  
            Animated.timing(backdropAnim, {  
                toValue: 0,  
                duration: 300,  
                useNativeDriver: true,  
            }),  
        ]).start(() => {  
            setIncomingNumber(null);  
        });  
    };  

    const handleAnswerCall = () => {  
        // 네이티브 모듈 호출하여 전화를 수락합니다.  
        NativeModules.CallReceiver.answerPhoneCall();   
        slideDown(); // UI를 숨깁니다.  
    };  

    return (  
        <View style={styles.container}>  
            {incomingNumber && (  
                <>  
                    <Animated.View style={[styles.backDrop, { opacity: backdropAnim }]} />  
                    <Animated.View style={[styles.subContainer, { transform: [{ translateY: slideAnim }] }]}>  
                        <Image source={require('../../assets/logo_text.png')} style={styles.logo} />  
                        <View style={styles.callInfo}>  
                            <View style={styles.callHeader}>  
                                <UserCircleIcon style={styles.avatar} />  
                                <View>  
                                    <Text style={styles.callText}>Incoming Call...</Text>  
                                    <Text style={styles.incomingNumber}>{incomingNumber}</Text>  
                                </View>  
                                <TouchableOpacity onPress={slideDown} style={styles.closeButton}>  
                                    <XMarkIcon size={20} />  
                                </TouchableOpacity>  
                            </View>  
                            <TouchableOpacity style={styles.callButton} onPress={handleAnswerCall}>  
                                <Text style={styles.callButtonText}>ACCEPT</Text>  
                            </TouchableOpacity>  
                        </View>  
                    </Animated.View>  
                </>  
            )}  
        </View>  
    );  
};  

const styles = StyleSheet.create({  
    container: {  
        flex: 1,  
        justifyContent: 'flex-end',  
    },  
    backDrop: {  
        position: 'absolute',  
        top: 0,  
        left: 0,  
        right: 0,  
        bottom: 0,  
        backgroundColor: 'rgba(0,0,0,0.9)',  
        zIndex: 1,  
    },  
    subContainer: {  
        position: 'absolute',  
        bottom: '10%',  
        width: '100%',  
        padding: 10,  
        zIndex: 2,  
        backgroundColor: '#202124',  
        borderRadius: 10,  
    },  
    logo: {  
        width: 80,  
        height: 30,  
        alignSelf: 'center',  
        marginBottom: 10,  
    },  
    callInfo: {  
        backgroundColor: '#202124',  
        borderRadius: 10,  
        padding: 15,  
        borderWidth: 1,  
        borderColor: '#fff',  
    },  
    callHeader: {  
        flexDirection: 'row',  
        alignItems: 'center',  
    },  
    callText: {  
        color: '#fff',  
        fontSize: 16,  
        fontWeight: 'bold',  
    },  
    incomingNumber: {  
        color: '#fff',  
        fontSize: 14,  
    },  
    closeButton: {  
        padding: 5,  
        alignSelf: 'flex-start',  
    },  
    callButton: {  
        backgroundColor: 'rgba(255,255,255,0.3)',  
        borderRadius: 5,  
        padding: 10,  
        alignItems: 'center',  
        marginTop: 10,  
    },  
    callButtonText: {  
        color: '#fff',  
        fontWeight: 'bold',  
    }  
});  

export default IncomingCall;  