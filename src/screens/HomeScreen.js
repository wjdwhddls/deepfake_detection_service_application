// 기존 대비용 주석 유지

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  NativeModules,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  BackHandler,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import LogoImage from '../assets/Detection.png';

/** ===== (추가) Dev 전용 도우미: 배터리/디바이스 정보 시도 ===== */
let DeviceInfo = null;
try {
  DeviceInfo = require('react-native-device-info');
} catch {}

/** ===== (변경) Document Picker: @react-native-documents/picker 고정 사용 (안전 로더) ===== */
import * as DocumentsPicker from '@react-native-documents/picker';

function resolveDocPick() {
  // 다양한 번들 형태 대응
  if (typeof DocumentsPicker?.pick === 'function') return DocumentsPicker.pick;
  if (typeof DocumentsPicker?.default?.pick === 'function') return DocumentsPicker.default.pick;
  if (typeof DocumentsPicker?.default === 'function') return DocumentsPicker.default; // default가 곧 pick
  return null;
}

async function pickOneFile(opts = {}) {
  const pickFn = resolveDocPick();
  if (!pickFn) {
    Alert.alert('문서 선택기 오류', '@react-native-documents/picker의 pick()을 찾을 수 없습니다.');
    throw new Error('No pick() export from @react-native-documents/picker');
  }
  try {
    // @react-native-documents/picker 는 **배열**을 반환
    const res = await pickFn({ mode: 'import', ...opts });
    if (!Array.isArray(res) || res.length === 0) return null;
    return res[0]; // { uri, name, mimeType, size, ... }
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    if (msg.includes('cancel')) return null; // 사용자 취소
    Alert.alert('문서 선택기 오류', '파일을 선택하는 중 문제가 발생했습니다.');
    throw e;
  }
}

/** ===== 팔레트 ===== */
const PALETTE = {
  g1: '#20B2F3',
  g2: '#5E73F7',
  g3: '#0F1730',
  blobLT: 'rgba(255,255,255,0.18)',
  blobRB: 'rgba(0,0,0,0.18)',
  white: '#FFFFFF',
  btnBlue: '#2F84FF',
  success1: '#34D399',
  success2: '#059669',
  warn1: '#F59E0B',
  warn2: '#D97706',
  danger1: '#FF4D4F',
  danger2: '#C81D25',
  track: 'rgba(255,255,255,0.18)',
};

const clamp01 = (v) => {
  if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
};

function verdictFromProb(probReal) {
  const p = clamp01(probReal);
  if (p >= 0.8) {
    return { key: 'safe', label: '안전', emoji: '✅', colors: [PALETTE.success1, PALETTE.success2], desc: '진짜일 가능성이 높습니다.', tierIndex: 2 };
  }
  if (p >= 0.5) {
    return { key: 'warn', label: '주의', emoji: '⚠️', colors: [PALETTE.warn1, PALETTE.warn2], desc: '추가 확인이 필요합니다.', tierIndex: 1 };
  }
  return { key: 'danger', label: '위험', emoji: '⛔️', colors: [PALETTE.danger1, PALETTE.danger2], desc: '가짜/사기 의심이 큽니다.', tierIndex: 0 };
}

function normalizeResult(nativeRes) {
  const rawReal =
    typeof nativeRes?.prob_real === 'number' ? nativeRes.prob_real :
    typeof nativeRes?.pReal === 'number'      ? nativeRes.pReal :
    typeof nativeRes?.prob === 'number'       ? nativeRes.prob :
    typeof nativeRes?.real === 'number'       ? nativeRes.real :
    typeof nativeRes?.score === 'number'      ? nativeRes.score :
    0;

  const probReal = clamp01(rawReal);
  const realPct  = Math.round(probReal * 100);
  const fakePct  = 100 - realPct;
  const verdict  = verdictFromProb(probReal);

  return {
    raw: nativeRes ?? {},
    probReal,
    realPct,
    fakePct,
    verdict,
    resultText: typeof nativeRes?.result === 'string' ? nativeRes.result : verdict.label,
  };
}

/** ===== (추가) 에너지 추정 상수(옵션) ===== */
const ENERGY_ALPHA_mJ_PER_MS = 2.0;   // 지연시간당 가중치
const ENERGY_BETA_mJ_PER_KB  = 0.02;  // 전송량당 가중치

/** ===== (추가) 숫자/분수 보정 유틸 ===== */
const numOrUndef = (v) => (typeof v === 'number' && isFinite(v) ? v : undefined);
const fracOrUndef = (v) => {
  if (typeof v !== 'number' || !isFinite(v)) return undefined;
  if (v > 1 && v <= 100) return v / 100;
  if (v >= 0 && v <= 1) return v;
  return undefined;
};

/** ===== Dev 전용 메트릭 로깅 (확장: 모든 지표를 한 줄 JSON으로) ===== */
async function logDevMetrics({ label = 'Detect', tStart, tEnd, extra = {} }) {
  if (!__DEV__) return;

  const ms = Math.max(0, (tEnd ?? Date.now()) - (tStart ?? Date.now()));
  const latencyMs = Math.round(ms);

  let batteryLevel = null;
  let isCharging = null;

  try {
    if (DeviceInfo?.getPowerState) {
      const ps = await DeviceInfo.getPowerState();
      if (typeof ps?.batteryLevel === 'number') batteryLevel = ps.batteryLevel;
      if (typeof ps?.charging === 'boolean') isCharging = ps.charging;
    } else if (DeviceInfo?.getBatteryLevel) {
      batteryLevel = await DeviceInfo.getBatteryLevel();
    }
  } catch {}

  let cpu = null;
  try {
    const { PerfStats } = NativeModules;
    if (PerfStats?.getCpuUsage) cpu = await PerfStats.getCpuUsage(); // { total, app, sampleMs }
  } catch {}

  const payload = {
    label,
    latencyMs,
    batteryPct: batteryLevel != null ? Math.round(batteryLevel * 100) : null,
    charging: isCharging,
    cpuTotal: cpu?.total ?? null,
    cpuApp: cpu?.app ?? null,
    cpuSampleMs: cpu?.sampleMs ?? null,
    platform: Platform.OS,
    ...extra, // ← bytesKB, energy, usedMemMB, inferMs, accuracy, f1, recall 등
  };

  try {
    const safe = JSON.parse(JSON.stringify(payload));
    console.log('[DEV][metrics]', safe);
  } catch {
    console.log('[DEV][metrics]', payload);
  }
}

/** 오디오 이퀄라이저 */
const EqualizerBackground = ({ styles, variant = 'center' }) => {
  const BAR_COUNT = 11;
  const vals = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    vals.forEach((v, idx) => {
      const duration = 640 + (idx % 6) * 70;
      const seq = Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);
      Animated.loop(seq).start();
    });
  }, [vals]);

  const containerStyle = variant === 'center' ? styles.eqCenterContainer : styles.eqBottomContainer;

  return (
    <View pointerEvents="none" style={containerStyle}>
      {vals.map((v, i) => {
        const center = Math.floor(vals.length / 2);
        const d = Math.abs(i - center);
        const base = 0.55 + 0.45 * Math.cos((i / (vals.length - 1)) * Math.PI);
        const scaleY = v.interpolate({ inputRange: [0, 1], outputRange: [base, base + 1.0] });

        let bg = '#6F86FF';
        let opacity = 0.12;
        if (d === 0) { bg = '#4FB2FF'; opacity = 0.35; }
        else if (d === 1) { bg = '#CFE7FF'; opacity = 0.14; }

        return <Animated.View key={i} style={[styles.eqBar, { backgroundColor: bg, opacity, transform: [{ scaleY }] }]} />;
      })}
    </View>
  );
};

const { DeepfakeDetector } = NativeModules;

const HomeScreen = ({ navigation }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resultVisible, setResultVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const logoFloat = useRef(new Animated.Value(0)).current;
  const detectPress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const uploadReveal = useRef(new Animated.Value(0)).current;

  /** ===== (추가) 지표 상태/메모리 폴링 ===== */
  const [metrics, setMetrics] = useState({
    totalMs: 0,
    avgTotalMs: 0,
    samples: 0,
    netMs: undefined,
    inferMs: undefined,
    usedMemMB: null,
    bytesKB: undefined,
    energy_mJ: undefined,
    accuracy: undefined,
    f1: undefined,
    recall: undefined,
  });
  const memTimerRef = useRef(null);
  const startMemPolling = () => {
    stopMemPolling();
    memTimerRef.current = setInterval(async () => {
      try {
        const used = await DeviceInfo?.getUsedMemory?.();
        setMetrics((m) => ({ ...m, usedMemMB: typeof used === 'number' ? used / (1024 * 1024) : null }));
      } catch { setMetrics((m) => ({ ...m, usedMemMB: null })); }
    }, 1000);
  };
  const stopMemPolling = () => {
    if (memTimerRef.current) { clearInterval(memTimerRef.current); memTimerRef.current = null; }
  };
  useEffect(() => () => stopMemPolling(), []);

  const initOnceRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (initOnceRef.current) return;
      if (!DeepfakeDetector?.initModel) return;
      try {
        await DeepfakeDetector.initModel();
        if (mounted) initOnceRef.current = true;
      } catch (e) {
        console.log('initModel failed:', e?.message || String(e));
        Alert.alert('오류', '모델 초기화에 실패했습니다.');
      }
    };
    boot();
    return () => { mounted = false; };
  }, []);

  // 🔁 화면 포커스될 때 초기화
  const backSubRef = useRef(null);
  useEffect(() => {
    const onFocus = () => {
      setSnapshot(null);
      setLoading(false);
      setShowUploadButton(false);
      try { DeepfakeDetector?.resetSession?.(); } catch {}
      backSubRef.current?.remove?.();
      backSubRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
        setLoading(false);
        setSnapshot(null);
        return false;
      });
    };

    const onBlur = () => {
      backSubRef.current?.remove?.();
      backSubRef.current = null;
    };

    const unsubFocus = navigation?.addListener?.('focus', onFocus);
    const unsubBlur  = navigation?.addListener?.('blur', onBlur);

    onFocus();
    return () => {
      unsubFocus && unsubFocus();
      unsubBlur && unsubBlur();
      onBlur();
    };
  }, [navigation]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [logoFloat]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handleDetect = () => {
    const next = !showUploadButton;
    setShowUploadButton(next);
    Animated.timing(uploadReveal, {
      toValue: next ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // === 권한 요청: PermissionsAndroid만 사용 ===
  const requestFilePermissionIfNeeded = async () => {
    if (Platform.OS !== 'android') return true;
    const API = Number(Platform.Version) || 0;

    try {
      const perm =
        API >= 33
          ? 'android.permission.READ_MEDIA_AUDIO'
          : 'android.permission.READ_EXTERNAL_STORAGE';

      const granted = await PermissionsAndroid.request(perm);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.log('권한 요청 오류:', e?.message || String(e));
      // 권한 모듈 문제 시, 막지 않고 진행
      return true;
    }
  };

  const openResultSheet = () => {
    setResultVisible(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeResultSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setResultVisible(false));
  };

  const handleUpload = async () => {
    const t0 = (global.performance?.now?.() ?? Date.now());

    try {
      setLoading(true);
      setSnapshot(null);
      // 지표 초기화
      setMetrics(m => ({
        ...m,
        bytesKB: undefined, netMs: undefined, inferMs: undefined,
        energy_mJ: undefined, accuracy: undefined, f1: undefined, recall: undefined,
      }));

      const permissionGranted = await requestFilePermissionIfNeeded();
      if (!permissionGranted) {
        Alert.alert('권한 부족', '파일 접근 권한이 필요합니다.');
        return;
      }

      // 파일 선택
      const picked = await pickOneFile({});
      if (!picked) return;

      if (!DeepfakeDetector || !DeepfakeDetector.detectFromFile) {
        Alert.alert('오류', '온디바이스 모듈을 사용할 수 없습니다.');
        return;
      }

      // 전송량(파일 크기) 추정 -> 에너지 계산에 사용
      let bytesKB;
      try {
        const sizeFromPicker = typeof picked?.size === 'number' ? picked.size : undefined;
        if (typeof sizeFromPicker === 'number') {
          bytesKB = sizeFromPicker / 1024;
        }
      } catch {}
      startMemPolling(); // 사용 메모리 폴링 시작

      const mime = (picked?.type || picked?.mimeType || '').toLowerCase?.() ?? '';
      const name = (picked?.name || '').toLowerCase?.() ?? '';
      const isWav = mime.includes('wav') || name.endsWith('.wav');
      if (!isWav) {
        Alert.alert('형식 안내', '현재는 WAV 파일만 지원합니다. (16kHz/mono 권장)');
        return;
      }

      const cachedPath = `${RNFS.CachesDirectoryPath}/upload-${Date.now()}.wav`;
      await RNFS.copyFile(picked.uri, cachedPath);
      const fileUri = Platform.OS === 'android' ? `file://${cachedPath}` : cachedPath;

      // 파일 시스템에서 크기 재확인
      try {
        const st = await RNFS.stat(cachedPath);
        if (typeof st?.size === 'number') bytesKB = st.size / 1024;
      } catch {}

      // 온디바이스 추론
      const nativeRes = await DeepfakeDetector.detectFromFile(fileUri);
      const shot = normalizeResult(nativeRes);

      // 네이티브가 줄 수 있는 시간/지표 수집
      const inferMs = numOrUndef(nativeRes?.inferMs ?? nativeRes?.inferenceMs);
      const accuracy = fracOrUndef(nativeRes?.accuracy ?? nativeRes?.acc);
      const f1       = fracOrUndef(nativeRes?.f1 ?? nativeRes?.f1_score);
      const recall   = fracOrUndef(nativeRes?.recall ?? nativeRes?.sensitivity);

      setSnapshot(shot);
      openResultSheet();

      // 총 지연
      const t1 = (global.performance?.now?.() ?? Date.now());
      const totalMs = t1 - t0;

      // (옵션) 에너지 추정
      const energy_mJ =
        typeof bytesKB === 'number'
          ? totalMs * ENERGY_ALPHA_mJ_PER_MS + bytesKB * ENERGY_BETA_mJ_PER_KB
          : totalMs * ENERGY_ALPHA_mJ_PER_MS;

      // 평균 갱신 + 지표 반영
      setMetrics(m => {
        const n = m.samples + 1;
        const avg = (m.avgTotalMs * m.samples + totalMs) / n;
        return {
          ...m,
          samples: n,
          totalMs,
          avgTotalMs: avg,
          netMs: undefined,
          inferMs,
          bytesKB,
          energy_mJ,
          accuracy,
          f1,
          recall,
        };
      });

      // DevTools 로그(모든 지표 포함)
      await logDevMetrics({
        label: 'Detect',
        tStart: t0,
        tEnd: t1,
        extra: {
          totalMs: Math.round(totalMs),
          netMs: undefined,
          inferMs: typeof inferMs === 'number' ? Math.round(inferMs) : null,
          bytesKB: typeof bytesKB === 'number' ? Math.round(bytesKB) : null,
          energy_mJ: typeof energy_mJ === 'number' ? Math.round(energy_mJ) : null,
          usedMemMB: null, // 폴링 타이밍상 바로 못 읽을 수 있어 null 허용
          accuracy, f1, recall,
          verdict: shot?.verdict?.key ?? null,
        },
      });
    } catch (e) {
      console.log('온디바이스 분석 오류:', e?.message || String(e));
      Alert.alert('오류', '분석 중 문제가 발생했습니다.');
    } finally {
      stopMemPolling();
      setLoading(false);
      setShowUploadButton(true);

      // 마지막 메모리 스냅샷 한 번 더 기록 + 보충 로그
      try {
        const used = await DeviceInfo?.getUsedMemory?.();
        const usedMemMB = typeof used === 'number' ? used / (1024 * 1024) : null;
        setMetrics(m => ({ ...m, usedMemMB }));
        console.log('[DEV][metrics:mem-final]', {
          usedMemMB: usedMemMB != null ? Number(usedMemMB.toFixed(1)) : null,
        });
      } catch {
        setMetrics(m => ({ ...m, usedMemMB: null }));
      }
    }
  };

  const handleReset = () => {
    closeResultSheet();
    setSnapshot(null);
    setLoading(false);
    setShowUploadButton(true);
    try { DeepfakeDetector?.resetSession?.(); } catch {}
  };

  const handleDetailView = () => {
    if (!snapshot) return;
    closeResultSheet();
    // ✅ 고정 경로
    navigation?.navigate?.('DetectDetail', { result: snapshot, metrics });
  };

  const styles = getStyles();

  const logoTranslateY = logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const pressScale = detectPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const uploadTranslate = uploadReveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const uploadOpacity = uploadReveal;
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });

  const verdict = snapshot?.verdict ?? verdictFromProb(0.5);

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <LinearGradient colors={[PALETTE.g1, PALETTE.g2, PALETTE.g3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, styles.blobLT]} />
        <View style={[styles.blob, styles.blobRB]} />
      </View>

      <EqualizerBackground styles={styles} variant="center" />

      {/* 콘텐츠 */}
      <View style={styles.content}>
        <Animated.View style={[styles.hero, { transform: [{ translateY: logoTranslateY }] }]}>
          <Image source={LogoImage} style={{ width: 220, height: 220 }} resizeMode="contain" />
          <Text style={styles.appTitle}>DeepVoice Detection</Text>
          <Text style={styles.subtitle}>음성 위·변조를 한 눈에 확인하세요</Text>
        </Animated.View>

        <View style={styles.actions}>
          <View style={styles.ringWrap} pointerEvents="none">
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          </View>

          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={() => Animated.timing(detectPress, { toValue: 1, duration: 90, useNativeDriver: true }).start()}
              onPressOut={() => Animated.timing(detectPress, { toValue: 0, duration: 90, useNativeDriver: true }).start()}
              onPress={handleDetect}
              style={styles.detectButton}
            >
              <Text style={styles.detectButtonText}>DETECT</Text>
            </TouchableOpacity>
          </Animated.View>

          {showUploadButton && (
            <Animated.View style={{ transform: [{ translateY: uploadTranslate }], opacity: uploadOpacity }}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
                <Text style={styles.uploadButtonText}>{loading ? '업로드 중...' : 'UPLOAD FILE'}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 결과 모달 */}
      <Modal
        visible={resultVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeResultSheet}
      >
        <StatusBar translucent backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeResultSheet} />
          <SafeAreaView pointerEvents="box-none" style={styles.sheetContainer}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }],
                  opacity: sheetAnim,
                },
              ]}
            >
              <View style={styles.handle} />

              <LinearGradient colors={verdict.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verdictCard}>
                <Text style={styles.verdictEmoji}>{verdict.emoji ?? 'ℹ️'}</Text>
                <Text style={styles.verdictText}>{verdict.label ?? '결과'}</Text>
                <Text style={styles.verdictDesc}>{verdict.desc ?? '결과를 확인하세요.'}</Text>
              </LinearGradient>

              <View style={styles.tierRow}>
                {['위험', '주의', '안전'].map((t, idx) => {
                  const active = idx === (verdict.tierIndex ?? 1);
                  return (
                    <View key={t} style={[styles.tierPill, active && styles.tierPillActive]}>
                      <Text style={[styles.tierText, active && styles.tierTextActive]}>{t}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.sheetButtons}>
                <TouchableOpacity style={styles.detailBtn} onPress={handleDetailView} disabled={!snapshot}>
                  <Text style={styles.detailBtnText}>상세보기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleReset}>
                  <Text style={styles.confirmBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: PALETTE.g3 },

    /** 배경 블롭 */
    blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
    blobLT: { top: 120, left: -40, backgroundColor: PALETTE.blobLT },
    blobRB: { bottom: -40, right: -60, backgroundColor: PALETTE.blobRB },

    /** 레이아웃 */
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, zIndex: 2 },
    hero: { alignItems: 'center', marginTop: -10, marginBottom: 10 },
    appTitle: { fontSize: 22, fontWeight: '800', color: PALETTE.white, letterSpacing: 0.5 },
    subtitle: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    /** Equalizer */
    eqBottomContainer: {
      position: 'absolute', left: 24, right: 24, bottom: 120, height: 130,
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 0,
    },
    eqCenterContainer: {
      position: 'absolute', left: 28, right: 28, top: '54%', height: 120,
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 0,
    },
    eqBar: { width: 9, height: 110, borderRadius: 6 },

    /** 액션 */
    actions: { marginTop: 18, alignItems: 'center', width: '100%', height: 160, justifyContent: 'center' },
    ringWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
    pulseRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
    detectButton: {
      backgroundColor: PALETTE.btnBlue, paddingVertical: 16, paddingHorizontal: 56, borderRadius: 28,
      shadowColor: '#1EA7FF', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    detectButtonText: { color: PALETTE.white, fontSize: 20, fontWeight: '800', letterSpacing: 1.2 },
    uploadButton: {
      marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
      paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'center',
    },
    uploadButtonText: { fontSize: 15, fontWeight: '700', color: PALETTE.white },

    /** 모달 루트(상태바까지 덮음) */
    modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheetContainer: { flex: 1, justifyContent: 'flex-end' },

    /** 바텀시트 */
    sheet: {
      marginHorizontal: 16, marginBottom: 16,
      backgroundColor: 'rgba(16,24,48,0.96)',
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 16,
    },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },

    /** 단계 카드 */
    verdictCard: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
    verdictEmoji: { fontSize: 28, marginBottom: 6 },
    verdictText: { color: PALETTE.white, fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    verdictDesc: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 4 },

    /** 3단계 인디케이터 */
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    tierPill: {
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    tierPillActive: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderColor: 'rgba(255,255,255,0.35)',
    },
    tierText: { color: 'rgba(255,255,255,0.75)', fontWeight: '800' },
    tierTextActive: { color: PALETTE.white },

    /** 버튼 */
    sheetButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    detailBtn: { flex: 1, marginRight: 8, backgroundColor: '#4FB2FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    detailBtnText: { color: PALETTE.white, fontWeight: '800' },
    confirmBtn: { flex: 1, marginLeft: 8, backgroundColor: '#7B6CF6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    confirmBtnText: { color: PALETTE.white, fontWeight: '800' },
  });

export default HomeScreen;