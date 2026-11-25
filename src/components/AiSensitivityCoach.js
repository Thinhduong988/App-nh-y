import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, getAccentTheme } from '../theme/colors';

const COMMON_ISSUES = [
  { id: 'over_head', label: 'Vượt quá đầu (tâm bay lên trời)', desc: 'Lực kéo nhanh hoặc độ nhạy Red Dot / General đang hơi cao' },
  { id: 'chest_lock', label: 'Khó lên đầu, dính ngực / chân', desc: 'Ma sát màn hình cao hoặc độ nhạy đang quá ghì nặng' },
  { id: 'recoil_spread', label: 'Tâm rung / đạn xòe khi sấy SMG', desc: 'Cần cân bằng ống ngắm và mở rộng nút bắn hợp lý' },
  { id: 'awm_slow', label: 'Kéo tâm AWM / M82B bị chậm', desc: 'Độ nhạy Súng Ngắm chưa tối ưu theo tốc độ vuốt tay' },
  { id: 'need_balance', label: 'Cân bằng toàn diện (One-Shot & Sấy)', desc: 'Bộ số ổn định cho cả bắn Shotgun tầm gần lẫn AK/MP40' },
];

export default function AiSensitivityCoach({ onSaveConfig, onGoToTrainer, accentColor }) {
  const accent = getAccentTheme(accentColor || COLORS.primary);
  const [selectedIssue, setSelectedIssue] = useState('chest_lock');
  const [deviceType, setDeviceType] = useState('iPhone / iPad Pro');
  const [customWeapon, setCustomWeapon] = useState('Shotgun (M1887, M1014)');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Interactive sliders inside AI Coach
  const [customGeneral, setCustomGeneral] = useState(190);
  const [customRedDot, setCustomRedDot] = useState(182);
  const [customScope2x, setCustomScope2x] = useState(168);
  const [customScope4x, setCustomScope4x] = useState(156);
  const [customButtonSize, setCustomButtonSize] = useState(42);

  const handleDiagnose = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);

      let gen = 188;
      let redDot = 178;
      let s2x = 166;
      let s4x = 152;
      let awm = 95;
      let btn = 42;
      let dpi = '480 - 520';
      let diagNote = '';

      if (deviceType.includes('iPhone')) {
        gen = 192;
        redDot = 184;
        dpi = 'Con trượt 120 (iOS)';
      } else if (deviceType.includes('Flagship')) {
        gen = 186;
        redDot = 176;
        dpi = '500 - 560 (120Hz+)';
      } else if (deviceType.includes('Yếu')) {
        gen = 198;
        redDot = 194;
        dpi = '411 - 450';
      }

      if (selectedIssue === 'over_head') {
        gen -= 10;
        redDot -= 12;
        btn += 4;
        diagNote = 'AI phát hiện dư lực vuốt khiến tâm vượt đỉnh đầu. Đã giảm nhẹ Nhìn Xung Quanh & Red Dot, đồng thời tăng nhẹ kích thước Nút Bắn để ghìm nhịp kéo.';
      } else if (selectedIssue === 'chest_lock') {
        gen += 8;
        redDot += 12;
        btn -= 2;
        diagNote = 'Tâm đang bị ghì ở vùng ngực. AI đã nâng Nhìn Xung Quanh và Red Dot thêm +10/+12 để thoát khỏi lực hút thân và bắt đỉnh đầu dứt khoát.';
      } else if (selectedIssue === 'recoil_spread') {
        s2x -= 6;
        s4x -= 8;
        btn += 2;
        diagNote = 'Tối ưu độ ổn định cho ống ngắm 2X/4X để gom tia đạn khi sấy SMG hoặc AR, giảm độ rung tầm trung.';
      } else if (selectedIssue === 'awm_slow') {
        awm = 135;
        diagNote = 'Đẩy nhạy Súng Ngắm (AWM/M82B) lên mức 135 giúp vẩy tâm nhanh và bám mục tiêu di chuyển ngang mượt mà.';
      } else {
        diagNote = 'Cấu hình cân bằng Esports chuẩn OB 2026: ổn định tâm dính đầu với Shotgun/One-Shot và giữ đạn gọn khi sấy MP40.';
      }

      if (customWeapon.includes('Shotgun')) {
        btn = Math.max(38, btn - 2);
      } else if (customWeapon.includes('SMG')) {
        btn = Math.min(50, btn + 2);
      }

      gen = Math.min(200, Math.max(100, gen));
      redDot = Math.min(200, Math.max(100, redDot));
      s2x = Math.min(200, Math.max(90, s2x));
      s4x = Math.min(200, Math.max(80, s4x));

      const res = {
        id: `ai_${Date.now()}`,
        deviceName: `Cấu hình AI 5D • ${deviceType.split(' ')[0]}`,
        brand: 'AI 5D Lab',
        general: gen,
        redDot,
        scope2x: s2x,
        scope4x: s4x,
        awm,
        freeLook: 145,
        buttonSize: btn,
        dpi,
        hudPos: 'Cách đáy 13% • Cách phải 18%',
        dragType: selectedIssue === 'over_head' ? 'Vuốt thẳng nhẹ có điểm dừng' : 'Vuốt chữ J dứt khoát lên đỉnh đầu',
        headshotRate: '99.6% ĐẦU',
        diagnosis: diagNote,
      };

      setCustomGeneral(gen);
      setCustomRedDot(redDot);
      setCustomScope2x(s2x);
      setCustomScope4x(s4x);
      setCustomButtonSize(btn);
      setAiResult(res);
    }, 650);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Figma iOS Header Card */}
      <View style={styles.heroHeaderCard}>
        <View style={[styles.headerTag, { backgroundColor: accent.light, borderColor: accent.border }]}>
          <Text style={[styles.headerTagText, { color: accent.bright }]}>
            ⚡ AI 5D TACTICAL GENERATOR 2026
          </Text>
        </View>
        <Text style={styles.headerTitle}>Tạo độ nhạy AI 5 chiều</Text>
        <Text style={styles.headerSub}>
          Chẩn đoán lỗi kéo tâm và hiệu chuẩn ma trận 5 trục (General, Red Dot, 2X/4X, Nút bắn & DPI) theo thiết bị.
        </Text>
        <View style={styles.disclaimerBadge}>
          <Text style={styles.disclaimerText}>
            ℹ️ Gợi ý tham khảo, không bảo đảm tỷ lệ headshot.
          </Text>
        </View>
      </View>

      {/* Main Input Card */}
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>1. BẠN ĐANG GẶP VẤN ĐỀ GÌ KHI KÉO TÂM?</Text>
        <View style={styles.issueList}>
          {COMMON_ISSUES.map((issue) => {
            const isSelected = selectedIssue === issue.id;
            return (
              <TouchableOpacity
                key={issue.id}
                activeOpacity={0.85}
                style={[
                  styles.issueItem,
                  isSelected && {
                    borderColor: accent.border,
                    backgroundColor: accent.light,
                  },
                ]}
                onPress={() => setSelectedIssue(issue.id)}>
                <View style={styles.issueRowInner}>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && { borderColor: accent.primary },
                    ]}>
                    {isSelected && (
                      <View style={[styles.radioInner, { backgroundColor: accent.primary }]} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.issueText, isSelected && { color: COLORS.text, fontWeight: '800' }]}>
                      {issue.label}
                    </Text>
                    <Text style={styles.issueDesc} numberOfLines={2}>
                      {issue.desc}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.cardTitle, { marginTop: 18 }]}>2. PHÂN LOẠI THIẾT BỊ</Text>
        <View style={styles.chipRow}>
          {[
            'iPhone / iPad Pro',
            'Android Flagship (120Hz+)',
            'Android Tầm Trung (90Hz-120Hz)',
            'Máy Cấu Hình Yếu (60Hz)',
          ].map((dev) => {
            const active = deviceType === dev;
            return (
              <TouchableOpacity
                key={dev}
                activeOpacity={0.8}
                style={[
                  styles.chip,
                  active && { borderColor: accent.border, backgroundColor: accent.light },
                ]}
                onPress={() => setDeviceType(dev)}>
                <Text style={[styles.chipText, active && { color: accent.bright, fontWeight: '800' }]}>
                  {dev}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.cardTitle, { marginTop: 18 }]}>3. DÒNG SÚNG SỞ TRƯỜNG</Text>
        <View style={styles.chipRow}>
          {[
            'Shotgun (M1887, M1014)',
            'SMG Sấy (MP40, UMP)',
            'Súng Trường (AK, Scar)',
            'Trường Tầm Xa (Woodpecker, SVD)',
          ].map((w) => {
            const active = customWeapon === w;
            return (
              <TouchableOpacity
                key={w}
                activeOpacity={0.8}
                style={[
                  styles.chip,
                  active && { borderColor: accent.border, backgroundColor: accent.light },
                ]}
                onPress={() => setCustomWeapon(w)}>
                <Text style={[styles.chipText, active && { color: accent.bright, fontWeight: '800' }]}>
                  {w}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.diagnoseBtn, { backgroundColor: accent.primary }]}
          onPress={handleDiagnose}>
          <Text style={[styles.diagnoseBtnText, { color: accent.textOnPrimary }]}>
            {analyzing ? '🔄 Đang phân tích ma trận 5D...' : '⚡ Tạo cấu hình độ nhạy 5D'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI RESULT & INTERACTIVE FINE-TUNER */}
      {aiResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.aiResultTitle}>⚡ Kết quả hiệu chuẩn 5D</Text>
            <View style={styles.aiRateBadge}>
              <Text style={styles.aiRateBadgeText}>Chỉ số nguồn: {aiResult.headshotRate}</Text>
            </View>
          </View>

          <View style={[styles.diagnosisBox, { borderLeftColor: accent.primary }]}>
            <Text style={styles.diagnosisLabel}>💡 Chẩn đoán AI</Text>
            <Text style={styles.diagnosisText}>{aiResult.diagnosis}</Text>
          </View>

          <Text style={styles.sliderSectionTitle}>🎛️ TINH CHỈNH TỪNG TRỤC ĐỘ NHẠY (THANG 200)</Text>

          {/* 1D General */}
          <View style={styles.calibrationCard}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>1D • Nhìn xung quanh</Text>
              <Text style={[styles.sliderVal, { color: accent.bright }]}>{customGeneral}</Text>
            </View>
            <View style={styles.stepGroup}>
              {[-4, -2, 0, +2, +4].map((step) => {
                const target = Math.max(100, Math.min(200, aiResult.general + step));
                const active = customGeneral === target;
                return (
                  <TouchableOpacity
                    key={step}
                    style={[
                      styles.stepItem,
                      active && { backgroundColor: accent.light, borderColor: accent.primary },
                    ]}
                    onPress={() => setCustomGeneral(target)}>
                    <Text style={[styles.stepText, active && { color: COLORS.text, fontWeight: '900' }]}>
                      {target}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2D Red Dot */}
          <View style={styles.calibrationCard}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>2D • Red Dot Sight</Text>
              <Text style={[styles.sliderVal, { color: accent.bright }]}>{customRedDot}</Text>
            </View>
            <View style={styles.stepGroup}>
              {[-4, -2, 0, +2, +4].map((step) => {
                const target = Math.max(100, Math.min(200, aiResult.redDot + step));
                const active = customRedDot === target;
                return (
                  <TouchableOpacity
                    key={step}
                    style={[
                      styles.stepItem,
                      active && { backgroundColor: accent.light, borderColor: accent.primary },
                    ]}
                    onPress={() => setCustomRedDot(target)}>
                    <Text style={[styles.stepText, active && { color: COLORS.text, fontWeight: '900' }]}>
                      {target}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3D/4D Scopes */}
          <View style={styles.calibrationCard}>
            <View style={[styles.sliderInfo, { marginBottom: 0 }]}>
              <Text style={styles.sliderLabel}>3D/4D • Ống ngắm 2X / 4X</Text>
              <Text style={[styles.sliderVal, { color: COLORS.accentCyan }]}>
                {customScope2x} / {customScope4x}
              </Text>
            </View>
          </View>

          {/* 5D Button Size */}
          <View style={styles.calibrationCard}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>5D • Kích thước nút bắn</Text>
              <Text style={[styles.sliderVal, { color: COLORS.secondary }]}>{customButtonSize}%</Text>
            </View>
            <View style={styles.stepGroup}>
              {[38, 42, 46, 50].map((s) => {
                const active = customButtonSize === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.stepItem,
                      active && { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary },
                    ]}
                    onPress={() => setCustomButtonSize(s)}>
                    <Text style={[styles.stepText, active && { color: COLORS.text, fontWeight: '900' }]}>
                      {s}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Strategy Details */}
          <View style={styles.extraDetailsCard}>
            <Text style={styles.extraDetailItem}>
              🎯 <Text style={styles.boldWhite}>DPI đề xuất:</Text> {aiResult.dpi}
            </Text>
            <Text style={styles.extraDetailItem}>
              📐 <Text style={styles.boldWhite}>Vị trí HUD:</Text> {aiResult.hudPos}
            </Text>
            <Text style={styles.extraDetailItem}>
              ⚡ <Text style={styles.boldWhite}>Kỹ thuật vuốt:</Text> {aiResult.dragType}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveBtn, { backgroundColor: accent.primary }]}
              onPress={() => {
                const finalConfig = {
                  ...aiResult,
                  general: customGeneral,
                  redDot: customRedDot,
                  scope2x: customScope2x,
                  scope4x: customScope4x,
                  buttonSize: customButtonSize,
                };
                if (onSaveConfig) onSaveConfig(finalConfig);
                else Alert.alert('💾 Đã Lưu', 'Cấu hình AI đã được lưu thành công!');
              }}>
              <Text style={[styles.saveBtnText, { color: accent.textOnPrimary }]}>
                💾 Lưu cấu hình (Đặt tên)
              </Text>
            </TouchableOpacity>

            {onGoToTrainer && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.trainerBtn}
                onPress={onGoToTrainer}>
                <Text style={[styles.trainerBtnText, { color: accent.bright }]}>
                  🎯 Thử nghiệm trong Phòng Kéo Tâm →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 10,
  },
  heroHeaderCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  headerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    marginBottom: 10,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  disclaimerBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disclaimerText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBox: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  issueList: {
    gap: 8,
  },
  issueItem: {
    backgroundColor: COLORS.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  issueRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  issueText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  issueDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  diagnoseBtn: {
    paddingVertical: 15,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 48,
  },
  diagnoseBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  aiResultTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  aiRateBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  aiRateBadgeText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  diagnosisBox: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    padding: 12,
    borderLeftWidth: 3.5,
    marginBottom: 14,
  },
  diagnosisLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  diagnosisText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sliderSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  calibrationCard: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  sliderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sliderVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  stepGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 9,
    borderRadius: COLORS.rounded.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  extraDetailsCard: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 4,
  },
  extraDetailItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  boldWhite: {
    color: COLORS.text,
    fontWeight: '800',
  },
  btnRow: {
    gap: 10,
    marginTop: 6,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  trainerBtn: {
    backgroundColor: COLORS.backgroundAlt,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    minHeight: 48,
  },
  trainerBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
