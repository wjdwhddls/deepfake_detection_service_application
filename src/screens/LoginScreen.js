// // import React, { useState } from 'react';
// // import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// // import { useNavigation } from '@react-navigation/native';
// // import axios from 'axios';
// // import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 추가

// // const LoginScreen = ({ setIsLoggedIn,  onLoginSuccess }) => {
// //   const navigation = useNavigation();
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');

// //   const handleLogin = async () => {
// //     const trimmedEmail = email.trim();
// //     const trimmedPassword = password; // 비번은 일반적으로 trim하지 않습니다

// //     console.log('로그인 요청 값:', { user_id: trimmedEmail, user_pw: trimmedPassword });

// //     try {
// //       const response = await axios.post('http://10.0.2.2:3000/api/auth/signin', {
// //         user_id: trimmedEmail,
// //         user_pw: trimmedPassword,
// //       }, {
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         validateStatus: (status) => status < 500,
// //       });

// //       console.log('[서버 응답]', {
// //         status: response.status,
// //         headers: response.headers,
// //         data: response.data,
// //       });

// //       // 헤더 키 대소문자 주의 (서버 설정에 따라 다름)
// //       const token = response.data?.data?.accessToken || response.data?.accessToken;

// //       if (token) {
// //         console.log('[토큰 수신]', token);

// //         // AsyncStorage에 토큰 저장
// //         await AsyncStorage.setItem('token', token); // 토큰 저장
// //         setIsLoggedIn(true);
// //         onLoginSuccess(response.data.data.phoneNumber);
// //         Alert.alert('로그인 성공', '환영합니다!');
// //       } else {
// //         const msg = response.data?.message || 
// //               (typeof response.data === 'string' ? response.data : '') ||
// //               '서버에서 토큰을 받지 못했습니다.';
// //         console.error('토큰 미수신, 응답:', response.data);
// //         Alert.alert('로그인 실패', msg);
// //       }

// //     } catch (error) {
// //       console.error('[로그인 에러]', {
// //         name: error.name,
// //         message: error.message,
// //         stack: error.stack,
// //         config: {
// //           url: error.config?.url,
// //           method: error.config?.method,
// //           data: error.config?.data,
// //         },
// //         response: {
// //           status: error.response?.status,
// //           data: error.response?.data,
// //           headers: error.response?.headers,
// //         },
// //       });

// //       if (error.response) {
// //         const { status, data } = error.response;
// //         if (status === 401) {
// //           Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
// //         } else {
// //           // 상세한 오류 메시지 대신 일반 메시지로 처리
// //           Alert.alert('로그인 실패', `서버 오류 (${status}): ${data.message || '알 수 없는 오류'}`);
// //         }
// //       } else if (error.request) {
// //         console.error('요청 전송 실패 - 요청 객체:', error.request);
// //         Alert.alert('로그인 실패', '서버에 연결할 수 없습니다. 네트워크를 확인하세요.');
// //       } else {
// //         Alert.alert('로그인 실패', `클라이언트 오류: ${error.message}`);
// //       }
// //     }
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.title}>Let's Catch The Fake!</Text>

// //       <TextInput
// //         style={styles.input}
// //         placeholder="이메일"
// //         placeholderTextColor="#A9A9A9"
// //         value={email}
// //         onChangeText={setEmail}
// //       />
// //       <TextInput
// //         style={styles.input}
// //         placeholder="비밀번호"
// //         placeholderTextColor="#A9A9A9"
// //         secureTextEntry={true}
// //         value={password}
// //         onChangeText={setPassword}
// //       />

// //       <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
// //         <Text style={styles.authButtonText}>로그인</Text>
// //       </TouchableOpacity>

// //       <Text style={styles.orText}>OR</Text>

// //       <TouchableOpacity style={styles.googleButton}>
// //         <Text style={styles.authButtonText}>Sign In with Google</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity style={styles.naverButton}>
// //         <Text style={styles.naverButtonText}>Log in with Naver</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
// //         <Text style={styles.footerText}>아직 계정이 없으신가요? 회원가입</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
// //         <Text style={styles.footerText}>비밀번호를 잊으셨나요?</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#000',
// //     padding: 20,
// //     justifyContent: 'center',
// //   },
// //   title: {
// //     fontSize: 28,
// //     fontWeight: 'bold',
// //     color: '#FFF',
// //     textAlign: 'center',
// //     marginBottom: 40,
// //   },
// //   input: {
// //     height: 50,
// //     backgroundColor: '#1F1F1F',
// //     borderRadius: 10,
// //     paddingHorizontal: 15,
// //     fontSize: 16,
// //     color: '#FFF',
// //     marginBottom: 20,
// //   },
// //   authButton: {
// //     height: 50,
// //     backgroundColor: '#007AFF',
// //     borderRadius: 10,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   googleButton: {
// //     height: 50,
// //     backgroundColor: '#FFF',
// //     borderRadius: 10,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginBottom: 15,
// //   },
// //   naverButton: {
// //     height: 50,
// //     backgroundColor: '#39B54A',
// //     borderRadius: 10,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginBottom: 20,
// //   },
// //   naverButtonText: {
// //     color: '#FFF',
// //     fontWeight: 'bold',
// //   },
// //   orText: {
// //     textAlign: 'center',
// //     color: '#A9A9A9',
// //     marginBottom: 15,
// //   },
// //   footerText: {
// //     textAlign: 'center',
// //     color: '#A9A9A9',
// //     marginVertical: 5,
// //   },
// // });

// // export default LoginScreen;

// // LoginScreen.js — 카드(어두운 박스) 제거 + 입력 박스 크게 + 홈과 동일한 배경(블롭 2개)
// import React, { useState, useMemo, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Image,
//   Easing,
//   Dimensions,   // ✅ 추가: 화면 크기 기반 블롭 사이즈/위치
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const C = {
//   g1: '#20B2F3',
//   g2: '#5E73F7',
//   g3: '#0F1730',
//   blobLT: 'rgba(255,255,255,0.18)',
//   blobRB: 'rgba(0,0,0,0.18)',
//   white: '#FFFFFF',
//   btnBlue: '#2F84FF',
// };

// const { width: W, height: H } = Dimensions.get('window');

// const LoginScreen = ({ setIsLoggedIn, onLoginSuccess }) => {
//   const navigation = useNavigation();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   // ===== 기존 로그인 로직: 그대로 유지 =====
//   const handleLogin = async () => {
//     const trimmedEmail = email.trim();
//     const trimmedPassword = password;

//     console.log('로그인 요청 값:', { user_id: trimmedEmail, user_pw: trimmedPassword });

//     try {
//       const response = await axios.post(
//         'http://10.0.2.2:3000/api/auth/signin',
//         { user_id: trimmedEmail, user_pw: trimmedPassword },
//         { headers: { 'Content-Type': 'application/json' }, validateStatus: (s) => s < 500 }
//       );

//       console.log('[서버 응답]', { status: response.status, headers: response.headers, data: response.data });

//       const token = response.data?.data?.accessToken || response.data?.accessToken;

//       if (token) {
//         await AsyncStorage.setItem('token', token);
//         setIsLoggedIn(true);
//         onLoginSuccess?.(response.data?.data?.phoneNumber);
//         Alert.alert('로그인 성공', '환영합니다!');
//       } else {
//         const msg =
//           response.data?.message ||
//           (typeof response.data === 'string' ? response.data : '') ||
//           '서버에서 토큰을 받지 못했습니다.';
//         Alert.alert('로그인 실패', msg);
//       }
//     } catch (error) {
//       console.error('[로그인 에러]', {
//         name: error?.name, message: error?.message, stack: error?.stack,
//         config: { url: error?.config?.url, method: error?.config?.method, data: error?.config?.data },
//         response: { status: error?.response?.status, data: error?.response?.data, headers: error?.response?.headers },
//       });

//       if (error?.response) {
//         const { status, data } = error.response;
//         if (status === 401) Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
//         else Alert.alert('로그인 실패', `서버 오류 (${status}): ${data?.message || '알 수 없는 오류'}`);
//       } else if (error?.request) {
//         Alert.alert('로그인 실패', '서버에 연결할 수 없습니다. 네트워크를 확인하세요.');
//       } else {
//         Alert.alert('로그인 실패', `클라이언트 오류: ${error?.message}`);
//       }
//     }
//   };
//   // ===================================

//   // 이퀄라이저 (색감/레이아웃 동일)
//   const barCount = 18;
//   const bars = useMemo(() => Array.from({ length: barCount }, () => new Animated.Value(0)), []);
//   useEffect(() => {
//     bars.forEach((v) => {
//       const loop = () => {
//         Animated.timing(v, {
//           toValue: Math.random(),
//           duration: 400 + Math.random() * 700,
//           easing: Easing.inOut(Easing.quad),
//           useNativeDriver: false,
//         }).start(loop);
//       };
//       loop();
//     });
//   }, [bars]);

//   return (
//     <SafeAreaView style={styles.safe}>
//       {/* ✅ 배경: 홈과 통일 (g1 → g3 아래로 갈수록 어두움) */}
//       <LinearGradient
//         colors={[C.g1, C.g2, C.g3]}
//         locations={[0, 0.55, 1]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={StyleSheet.absoluteFill}
//         pointerEvents="none"
//       />
//       {/* ✅ 큰 원(블롭) 2개: 좌상단 밝게 / 우하단 어둡게 */}
//       <View style={[styles.blob, styles.blobLT, { backgroundColor: C.blobLT }]} pointerEvents="none" />
//       <View style={[styles.blob, styles.blobRB, { backgroundColor: C.blobRB }]} pointerEvents="none" />

//       <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//         <View style={styles.container} pointerEvents="box-none">
//           {/* 상단: 로고 + 이퀄라이저 */}
//           <View style={styles.header}>
//             <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />
//             <View style={styles.equalizer} pointerEvents="none">
//               {bars.map((v, idx) => {
//                 const h = v.interpolate({ inputRange: [0, 1], outputRange: [8, 44] });
//                 return (
//                   <Animated.View
//                     key={idx}
//                     style={[
//                       styles.eqBar,
//                       { height: h, backgroundColor: idx % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)' },
//                     ]}
//                   />
//                 );
//               })}
//             </View>
//           </View>

//           {/* ⛔ 카드 박스 제거(투명) + 입력 박스 크게 */}
//           <View style={styles.card}>
//             <View style={styles.inputPill}>
//               <TextInput
//                 style={styles.pillText}
//                 placeholder="E-mail"
//                 placeholderTextColor="#8FB2E8"
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 autoCorrect={false}
//                 value={email}
//                 onChangeText={setEmail}
//                 returnKeyType="next"
//               />
//             </View>

//             <View style={styles.inputPill}>
//               <TextInput
//                 style={styles.pillText}
//                 placeholder="Password"
//                 placeholderTextColor="#8FB2E8"
//                 secureTextEntry
//                 value={password}
//                 onChangeText={setPassword}
//                 returnKeyType="done"
//               />
//             </View>

//             <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleLogin}>
//               <LinearGradient
//                 colors={['#0AA7F6', '#2E7BFF']}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.ctaInner}
//               >
//                 <Text style={styles.ctaText}>로그인</Text>
//               </LinearGradient>
//             </TouchableOpacity>

//             <View style={styles.bottomLinks}>
//               <Text style={styles.linkDim}>계정이 없으신가요? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
//                 <Text style={styles.linkStrong}>회원가입</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={styles.bottomLinks}>
//               <Text style={styles.linkDim}>비밀번호를 잊으셨나요? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
//                 <Text style={styles.linkStrong}>비밀번호 찾기</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// /* ====================== styles ====================== */
// const BLOB_LT_SIZE = Math.max(W, H) * 0.9;   // 좌상단 큰 원
// const BLOB_RB_SIZE = Math.max(W, H) * 0.85;  // 우하단 큰 원

// const styles = StyleSheet.create({
//   flex: { flex: 1 },
//   safe: { flex: 1, backgroundColor: '#0A1430' },

//   // ✅ 블롭 공통
//   blob: {
//     position: 'absolute',
//     borderRadius: 9999,
//   },
//   blobLT: {
//     width: BLOB_LT_SIZE,
//     height: BLOB_LT_SIZE,
//     top: -BLOB_LT_SIZE * 0.25,
//     left: -BLOB_LT_SIZE * 0.15,
//   },
//   blobRB: {
//     width: BLOB_RB_SIZE,
//     height: BLOB_RB_SIZE,
//     bottom: -BLOB_RB_SIZE * 0.25,
//     right: -BLOB_RB_SIZE * 0.2,
//   },

//   container: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },

//   header: { alignItems: 'center', marginBottom: 18 },
//   logo: { width: 300, height: 300, marginBottom: 12 },

//   equalizer: {
//     height: 56,
//     width: '82%',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   eqBar: { width: 8, borderRadius: 4 },

//   /* 🔹 카드 상자 비주얼 제거 */
//   card: {
//     backgroundColor: 'transparent',
//     borderWidth: 0,
//     padding: 0,
//     shadowOpacity: 0,
//     elevation: 0,
//   },

//   /* 🔹 입력 박스 크게 */
//   inputPill: {
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(20, 32, 70, 0.95)',
//     paddingHorizontal: 18,
//     justifyContent: 'center',
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.16)',
//   },
//   pillText: {
//     color: '#F2F7FF',
//     fontSize: 17,
//   },

//   cta: {
//     marginTop: 10,
//     borderRadius: 28,
//     overflow: 'hidden',
//     shadowColor: '#1A73E8',
//     shadowOpacity: 0.45,
//     shadowRadius: 18,
//     shadowOffset: { width: 0, height: 8 },
//     elevation: 6,
//   },
//   ctaInner: { height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
//   ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, fontSize: 16 },

//   bottomLinks: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
//   linkDim: { color: '#A9C1F6' },
//   linkStrong: { color: '#FFFFFF', fontWeight: '800' },
// });

// export default LoginScreen;
// 위에 맨 처음 기존 코드 혹시 대비용 코드 지우지 말기

// LoginScreen.js — 성공 모달 OK에서 토큰 저장 + 전환 + 에러 한국어 변환
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Animated, Image, Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SuccessDialog from '../components/SuccessDialog';
import ErrorDialog from '../components/ErrorDialog';

/* ====================== 에러 메시지 한글 변환 유틸 ====================== */
const toKoreanBackendMessage = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.join(', ');
  if (typeof data === 'object') return data.message ?? Object.values(data).join(', ');
  return null;
};

const toKoreanErrorMessage = (error) => {
  // 서버 응답이 있는 경우
  if (error?.response) {
    const { status, data } = error.response;

    const raw =
      typeof data === 'string' ? data :
      (Array.isArray(data) ? data.join(', ') :
      (data?.message || null));

    // 흔한 영문 메시지 매핑(필요 시 추가)
    const dict = {
      'Invalid credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'User not found': '해당 계정을 찾을 수 없습니다.',
      'Password mismatch': '비밀번호가 올바르지 않습니다.',
      'Account locked': '계정이 잠겼습니다. 관리자에게 문의하세요.',
      'Too many requests': '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.',
    };
    const mapped = raw && dict[raw] ? dict[raw] : raw;

    switch (status) {
      case 400: return mapped || '요청 형식이 올바르지 않습니다.';
      case 401: return mapped || '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 403: return mapped || '접근 권한이 없습니다.';
      case 404: return mapped || '요청한 리소스를 찾을 수 없습니다.';
      case 409: return mapped || '이미 존재하는 정보가 있습니다.';
      case 422: return mapped || '입력값을 다시 확인해 주세요.';
      case 429: return mapped || '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
      case 500: return mapped || '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      case 502:
      case 503:
      case 504: return '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
      default: return mapped || `오류가 발생했습니다. (코드 ${status})`;
    }
  }

  // 네트워크/타임아웃
  if (error?.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.';
  }
  if (typeof error?.message === 'string' && error.message.includes('Network Error')) {
    return '네트워크 오류입니다. 인터넷 연결을 확인해 주세요.';
  }

  // 기타
  return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};
/* ===================================================================== */

const LoginScreen = ({ setIsLoggedIn, onLoginSuccess }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 모달 상태
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState('로그인 실패');
  const [errorMsg, setErrorMsg] = useState('문제가 발생했습니다.');

  // ✅ 성공 후 작업을 위해 임시로 보관
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingPhone, setPendingPhone] = useState(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    try {
      const response = await axios.post(
        'http://10.0.2.2:3000/api/auth/signin',
        { user_id: trimmedEmail, user_pw: trimmedPassword },
        { headers: { 'Content-Type': 'application/json' }, validateStatus: (s) => s < 500 }
      );

      const token = response.data?.data?.accessToken || response.data?.accessToken;
      const phone = response.data?.data?.phoneNumber;

      if (token) {
        // ✅ 모달 먼저 띄우고, 필요한 값만 보관 (바로 저장/전환 X)
        setPendingToken(token);
        setPendingPhone(phone ?? null);
        setSuccessOpen(true);
      } else {
        const msg = toKoreanBackendMessage(response.data) || '서버에서 토큰을 받지 못했습니다.';
        setErrorTitle('로그인 실패');
        setErrorMsg(msg);
        setErrorOpen(true);
      }
    } catch (error) {
      const msg = toKoreanErrorMessage(error);
      setErrorTitle('로그인 실패');
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  // 이퀄라이저
  const barCount = 18;
  const bars = useMemo(() => Array.from({ length: barCount }, () => new Animated.Value(0)), []);
  useEffect(() => {
    bars.forEach((v) => {
      const loop = () => {
        Animated.timing(v, {
          toValue: Math.random(),
          duration: 400 + Math.random() * 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }).start(loop);
      };
      loop();
    });
  }, [bars]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#20B2F3', '#5E73F7', '#0F1730']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container} pointerEvents="box-none">
          <View style={styles.header}>
            <Image source={require('../assets/Detection.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.equalizer} pointerEvents="none">
              {bars.map((v, idx) => {
                const h = v.interpolate({ inputRange: [0, 1], outputRange: [8, 44] });
                return (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.eqBar,
                      { height: h, backgroundColor: idx % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)' },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.pillText}
                placeholder="E-mail"
                placeholderTextColor="#8FB2E8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputPill}>
              <TextInput
                style={styles.pillText}
                placeholder="Password"
                placeholderTextColor="#8FB2E8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={handleLogin}>
              <LinearGradient
                colors={['#0AA7F6', '#2E7BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaInner}
              >
                <Text style={styles.ctaText}>로그인</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomLinks}>
              <Text style={styles.linkDim}>계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkStrong}>회원가입</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PasswordRecovery')}>
              <Text style={[styles.linkDim, { textAlign: 'center', marginTop: 8 }]}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 모달들 */}
      <SuccessDialog
        visible={successOpen}
        title="로그인 성공"
        message="환영합니다!"
        okText="OK"
        onClose={async () => {
          setSuccessOpen(false);
          try {
            if (pendingToken) {
              await AsyncStorage.setItem('token', pendingToken); // ← 여기서 저장
            }
          } finally {
            if (pendingPhone) onLoginSuccess?.(pendingPhone);
            setIsLoggedIn(true); // ← 여기서 전환
            setPendingToken(null);
            setPendingPhone(null);
          }
        }}
      />
      <ErrorDialog
        visible={errorOpen}
        title={errorTitle}
        message={errorMsg}
        okText="확인"
        onClose={() => setErrorOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#0A1430' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  header: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 280, height: 126, marginBottom: 12 },
  equalizer: { height: 56, width: '82%', flexDirection: 'row', justifyContent: 'space-between' },
  eqBar: { width: 8, borderRadius: 4 },
  card: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, shadowOpacity: 0, elevation: 0 },
  inputPill: {
    height: 60, borderRadius: 30, backgroundColor: 'rgba(20, 32, 70, 0.95)',
    paddingHorizontal: 18, justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  pillText: { color: '#F2F7FF', fontSize: 17 },
  cta: {
    marginTop: 10, borderRadius: 28, overflow: 'hidden',
    shadowColor: '#1A73E8', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  ctaInner: { height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, fontSize: 16 },
  bottomLinks: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
  linkDim: { color: '#A9C1F6' },
  linkStrong: { color: '#FFFFFF', fontWeight: '800' },
});

export default LoginScreen;
