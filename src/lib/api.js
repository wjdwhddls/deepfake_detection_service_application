// src/lib/api.js
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 개발/에뮬레이터용 기본 주소 (로컬 서버 쓸 때만)
const DEV_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// 배포(EC2) 주소 — Nginx로 80 프록시면 포트 없이 IP/도메인만
const PROD_BASE = 'http://ec2-43-203-141-45.ap-northeast-2.compute.amazonaws.com';

export const api = axios.create({
  baseURL: __DEV__ ? DEV_BASE : PROD_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: 토큰 자동 첨부
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token'); // 로그인 시 저장해두기
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 공통 에러 메시지 변환
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
    // 필요 시 전역 토스트/로그
    return Promise.reject({ ...err, friendlyMessage: message });
  }
);

// 편의 함수들(선택)
export const setToken = async (token) => {
  await AsyncStorage.setItem('access_token', token);
};
export const clearToken = async () => {
  await AsyncStorage.removeItem('access_token');
};