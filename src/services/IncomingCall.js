import React, { useEffect, useRef, useState } from "react";  
import { Animated, Image, NativeEventEmitter, StyleSheet, Text, TouchableOpacity, View } from "react-native";  
import { findUser } from "../../service/authService";  
import { getAbbrName } from "../../utils/miscUtils";  
import UserAvatar from "../ui/UserAvatar";  
import { Colors, formatPhoneNumber } from "../../utils/Constants";  
import { UserCircleIcon, XMarkIcon } from "react-native-heroicons/solid";  
import { navigate } from "../../utils/NavigationUtils";  
import { ChatBubbleOvalLeftEllipsisIcon, NoSymbolIcon, PhoneIcon } from "react-native-heroicons/outline";  

const callScreeningEvents = new NativeEventEmitter();  
const withIncomingCall = (WrappedComponent) => {  
    
    const WithIncomingCallComponent = (props) => {  
        const [incomingNumber, setIncomingNumber] = useState();  
        const [userInfo, setUserInfo] = useState();  

        const slideAnim = useRef(new Animated.Value(300)).current;  
        const backdropAnim = useRef(new Animated.Value(0)).current;  

        useEffect(() => {  
            const subscription = callScreeningEvents.addListener("CallScreeningEvent", (phoneNumber) => {  
                const cleanedNumber = phoneNumber.replace(/[^\d]/g, '');  
                const last10Digits = cleanedNumber.slice(-10);  
                setIncomingNumber(last10Digits);  
                slideUp(last10Digits);  
            });  

            return () => {  
                subscription.remove();  
            };  
        }, []);  

        const slideUp = async (phoneNumber) => {  
            try {  
                const data = await findUser(phoneNumber);  
                setUserInfo(data);  
            } catch (error) {  
                setUserInfo({  
                    phoneNumber: phoneNumber,  
                    name: "Unknown",  
                    isSpam: false,  
                });  
                console.log(error);  
            }  
            Animated.parallel([  
                Animated.timing(slideAnim, {  
                    toValue: 0,  
                    duration: 1200,  
                    useNativeDriver: true,  
                }),  
                Animated.timing(backdropAnim, {  
                    toValue: 0.9,  
                    duration: 1200,  
                    useNativeDriver: true,  
                }),  
            ]).start();  
        };  

        const slideDown = async () => {  
            Animated.parallel([  
                Animated.timing(slideAnim, {  
                    toValue: 300,  
                    duration: 1200,  
                    useNativeDriver: true,  
                }),  
                Animated.timing(backdropAnim, {  
                    toValue: 0,  
                    duration: 1200,  
                    useNativeDriver: true,  
                }),  
            ]).start(() => {  
                setIncomingNumber(undefined);  
                setUserInfo(undefined);  
            });  
        };  

        let abbrName = userInfo?.name ? getAbbrName(userInfo.name) : 'UN';  

        return (  
            <View style={styles.container}>  
                <WrappedComponent {...props} />  
                {incomingNumber && <Animated.View style={[styles.backDrop, { opacity: backdropAnim }]} />}  

                {incomingNumber && (  
                    <Animated.View style={[styles.subContainer, { transform: [{ translateY: slideAnim }] }]}>  
                        <Image source={require('../../assets/logo_text.png')} style={{ width: 80, marginVertical: 8, height: 16 }} />  
                        <View style={{ backgroundColor: '#202124', borderRadius: 8, overflow: 'hidden' }}>  
                            <View style={{ backgroundColor: userInfo?.isSpam ? 'red' : 'blue' }}>  
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>  
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>  
                                        <UserAvatar isSpam={userInfo?.isSpam} text={abbrName} onPress={() => { }} />  

                                        <View>  
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Incoming Call...</Text>  
                                            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>{userInfo?.name || 'Unknown'}</Text>  
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{formatPhoneNumber(incomingNumber?.slice(-10)) || ""}</Text>  
                                        </View>  
                                    </View>  
                                    <TouchableOpacity onPress={slideDown} style={{ padding: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 50, backgroundColor: 'white' }}>  
                                        <XMarkIcon color={Colors.primary} size={16} />  
                                    </TouchableOpacity>  
                                </View>  
                                <TouchableOpacity  
                                    style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 8, padding: 8 }}  
                                    onPress={() => {  
                                        navigate('CallerScreen', { item: userInfo });  
                                        slideDown();  
                                    }}>  
                                    <UserCircleIcon color={'#fff'} size={22} />  
                                    <Text style={{ fontWeight: '600', color: 'white', fontSize: 18 }}>View Profile</Text>  
                                </TouchableOpacity>  
                            </View>  

                            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>  
                                <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: '33%' }}>  
                                    <PhoneIcon color='#eee' size={22} />  
                                    <Text style={{ color: '#ccc', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>CALL</Text>  
                                </TouchableOpacity>  
                                <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: '33%' }}>  
                                    <ChatBubbleOvalLeftEllipsisIcon color='#eee' size={22} />  
                                    <Text style={{ color: '#ccc', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>MESSAGE</Text>  
                                </TouchableOpacity>  
                                <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: '33%' }}>  
                                    <NoSymbolIcon color='#eee' size={22} />  
                                    <Text style={{ color: '#ccc', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>SPAM</Text>  
                                </TouchableOpacity>  
                            </View>  
                        </View>  

                        <Text style={{ fontWeight: '800', fontSize: 16, textAlign: 'center', marginVertical: 8, color: '#1abc9c' }}>ADVERTISEMENT</Text>  
                        <View style={{ height: 160 }}>  
                            <Image source={require('../../assets/images/banner.jpg')} style={{ resizeMode: 'contain', height: '100%', width: '100%', borderRadius: 10 }} />  
                        </View>  
                    </Animated.View>  
                )}  
            </View>  
        );  
    };  

    return WithIncomingCallComponent;  
};  

const styles = StyleSheet.create({  
    container: {  
        flex: 1,  
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
    },  
});  

export default withIncomingCall;