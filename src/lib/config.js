// src/lib/config.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 배포(EC2) 주소만 사용 (http:// 포함 필수)
export const API_BASE   = 'http://ec2-13-125-2-122.ap-northeast-2.compute.amazonaws.com';
export const SERVER_URL = API_BASE; // socket.io도 같은 호스트 사용

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: 토큰 자동 첨부
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 에러 메시지 공통화
api.interceptors.response.use(
  (res) => res,
  (err) => {
    let message = '네트워크 오류가 발생했습니다.';
    if (err.response?.data) {
      const d = err.response.data;
      if (typeof d === 'string') message = d;
      else if (Array.isArray(d)) message = d.join(', ');
      else if (typeof d === 'object') message = Object.values(d).join(', ');
    } else if (err.message) {
      message = err.message;
    }
    return Promise.reject({ ...err, friendlyMessage: message });
  }
);