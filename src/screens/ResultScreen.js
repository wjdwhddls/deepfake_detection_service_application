// (기존 대비용 주석 블록은 유지)

// 위에 맨 처음 기존 코드 혹시 대비용 코드 지우지 말기

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const GUTTER = 16;
const MAX_CONTENT = 640;

const PALETTE = {
  g1: '#20B2F3', g2: '#5E73F7', g3: '#0F1730',
  cardBg: 'rgba(16,24,48,0.94)', cardStroke: 'rgba(255,255,255,0.10)',
  white: '#FFFFFF', muted: 'rgba(255,255,255,0.82)', faint: 'rgba(255,255,255,0.08)',
  safe1: '#34D399', safe2: '#10B981',
  warn1: '#F59E0B', warn2: '#D97706',
  danger1: '#EF4444', danger2: '#B91C1C',
};

// 안전/주의/위험별 안내
const DEFAULT_STEPS = {
  safe:   ['중요 결론 전, 한 번 더 사실 확인.', '의심 링크/앱 설치는 피하세요.', 'OTP·인증번호 등 민감 정보 공유 금지.'],
  warn:   ['통화를 끊고 공식 번호로 재확인.', '재촉·압박하면 즉시 중단하세요.', '앱 설치/원격 제어 요구는 거절.'],
  danger: ['즉시 통화 종료 및 번호 차단.', '112 또는 1392(사기피해 신고센터) 신고.', '송금·비밀번호 즉시 변경 등 긴급 조치.'],
};

const CircleBadge = ({ title, percent, colors }) => {
  const SIZE = Math.min(280, Math.max(220, width * 0.68));
  const R = SIZE / 2;
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: R,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
    >
      <Text style={{ color: PALETTE.white, fontSize: 16, fontWeight: '800', opacity: 0.95 }}>
        {title}
      </Text>
      <Text style={{ color: PALETTE.white, fontSize: 54, fontWeight: '900', marginTop: 6 }}>
        {percent}%
      </Text>
    </LinearGradient>
  );
};

const ResultScreen = ({ route }) => {
  useTheme(); // 흐름 유지
  const shot = route?.params?.result;   // 🔒 HomeScreen에서 만든 스냅샷만 사용

  const bg = [PALETTE.g1, PALETTE.g2, PALETTE.g3];

  if (!shot) {
    return (
      <LinearGradient colors={bg} style={styles.fillCenter}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>결과 데이터를 확인할 수 없습니다.</Text>
        </View>
      </LinearGradient>
    );
  }

  // 스냅샷에서 값만 꺼내 사용 (재계산 금지)
  const { probReal, realPct, fakePct, verdict, resultText } = shot;
  const steps = DEFAULT_STEPS[verdict?.key] ?? DEFAULT_STEPS.warn;

  return (
    <LinearGradient colors={bg} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrap}>
            {/* 1) 한눈에 판단 */}
            <View style={[styles.card, { alignItems: 'center' }]}>
              <Text style={styles.sectionTitle}>
                {verdict?.emoji ?? 'ℹ️'} {verdict?.label ?? '결과'}
              </Text>
              <Text style={styles.sectionDesc}>{verdict?.desc ?? ''}</Text>

              <View style={{ height: 22 }} />
              <CircleBadge title="가짜(위·변조) 확률" percent={fakePct ?? (100 - (realPct ?? 0))} colors={verdict?.colors ?? [PALETTE.safe1, PALETTE.safe2]} />

              <View style={styles.dualRow}>
                <View style={styles.kv}>
                  <Text style={styles.kKey}>분류 결과</Text>
                  <Text style={styles.kVal}>{resultText ?? verdict?.label ?? '-'}</Text>
                </View>
                <View style={styles.kv}>
                  <Text style={styles.kKey}>Real 확률</Text>
                  <Text style={styles.kVal}>{(realPct ?? Math.round((probReal ?? 0) * 100))}%</Text>
                </View>
              </View>

              <View style={[styles.kv, { marginTop: 12, width: '100%' }]}>
                <Text style={styles.kKey}>Raw pReal (0~1)</Text>
                <Text style={styles.kVal}>{(probReal ?? 0).toFixed(4)}</Text>
              </View>
            </View>

            {/* 2) 후속 조치 */}
            <View style={[styles.card, styles.cardActions]}>
              <Text style={styles.sectionTitle}>후속 조치</Text>
              <Text style={styles.sectionDesc}>아래 안내를 순서대로 진행해 주세요.</Text>

              <View style={styles.actionsBodyTop} />

              {steps.map((t, i) => (
                <View key={`${verdict?.key}-${i}`} style={styles.stepRow}>
                  <View style={[styles.stepIndex, { borderColor: (verdict?.colors ?? [PALETTE.safe1])[0] }]}>
                    <Text style={[styles.stepIndexText, { color: (verdict?.colors ?? [PALETTE.safe1])[0] }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{t}</Text>
                </View>
              ))}

              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>추가 팁</Text>
                <Text style={styles.noteText}>
                  대화/문자 기록은 보관하고, 의심 시 계좌·비밀번호를 즉시 변경하세요.
                  금융사/기관은 앱 설치나 원격 제어를 요구하지 않습니다.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: {
    paddingTop: 72,
    paddingBottom: 140,
  },

  contentWrap: {
    width: '100%',
    maxWidth: MAX_CONTENT,
    alignSelf: 'center',
    paddingHorizontal: GUTTER,
    rowGap: 20,
  },

  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.cardStroke,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardActions: {
    paddingTop: 24,
    paddingBottom: 22,
  },

  sectionTitle: { color: PALETTE.white, fontWeight: '900', fontSize: 20 },
  sectionDesc : { color: PALETTE.muted, fontSize: 14, marginTop: 8 },

  actionsBodyTop: { height: 18 },

  dualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    width: '100%',
    columnGap: 12,
  },
  kv: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: PALETTE.faint,
  },
  kKey: { color: PALETTE.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  kVal: { color: PALETTE.white, fontSize: 18, fontWeight: '900', marginTop: 6 },

  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  stepIndex: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  stepIndexText: { fontSize: 12, fontWeight: '900' },
  stepText: { color: PALETTE.white, fontSize: 15, lineHeight: 22, flex: 1 },

  noteBox: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  noteTitle: { color: PALETTE.white, fontWeight: '900', marginBottom: 6, fontSize: 14 },
  noteText: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 20 },

  empty: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyText: { color: PALETTE.white, fontWeight: '800', fontSize: 16 },
});

export default ResultScreen;