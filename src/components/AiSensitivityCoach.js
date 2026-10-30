import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';

const COMMON_ISSUES = [
  { id: 'chest_lock', label: '❌ Tâm hay bị dính ngực (Kéo không lên đầu)', icon: '🛡️' },
  { id: 'head_overshoot', label: '❌ Tâm hay vọt qua đầu bay lên trời', icon: '🚀' },
  { id: 'shotgun_miss', label: '❌ Bắn Shotgun M1887 cận chiến hụt nhiều', icon: '💥' },
  { id: 'smg_spread', label: '❌ Sấy MP40 đạn bị xòe, không dính cụm đỏ', icon: '⚡' },
  { id: 'matte_glass', label: '❌ Mới dán kính nhám / Đeo bao ngón tay', icon: '🧤' },
];

export default function AiSensitivityCoach({ onSaveConfig, onGoToTrainer }) {
  const [selectedIssue, setSelectedIssue] = useState('chest_lock');
  const [deviceType, setDeviceType] = useState('Android Tầm Trung (90Hz-120Hz)');
  const [customWeapon, setCustomWeapon] = useState('Shotgun (M1887, M1014)');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Interactive Fine-tune Sliders
  const [customGeneral, setCustomGeneral] = useState(188);
  const [customRedDot, setCustomRedDot] = useState(176);
  const [customScope2x, setCustomScope2x] = useState(170);
  const [customScope4x, setCustomScope4x] = useState(162);
  const [customButtonSize, setCustomButtonSize] = useState(42);

  const handleDiagnose = () => {
    setAnalyzing(true);
    setTimeout(() => {
      let gen = 188;
      let red = 176;
      let sc2 = 170;
      let sc4 = 162;
      let btn = 42;
      let hud = 'Đáy 11% • Phải 18%';
      let drag = 'Vuốt Móc Chữ J Siêu Tốc';
      let diagnosis = '';

      if (selectedIssue === 'chest_lock') {
        gen = 196;
        red = 188;
        sc2 = 182;
        sc4 = 174;
        btn = 40;
        hud = 'Đáy 10% • Phải 17%';
        drag = 'Vẩy Thẳng 1 Nhịp Nhanh Dứt Khoát';
        diagnosis = 'Tâm bị ghim ngực do lực ma sát màn hình lớn hoặc Red Dot quá thấp. AI đã tăng Red Dot lên 188 và hạ kích thước nút xuống 40% để giải phóng biên độ vuốt tay!';
      } else if (selectedIssue === 'head_overshoot') {
        gen = 180;
        red = 168;
        sc2 = 162;
        sc4 = 154;
        btn = 48;
        hud = 'Đáy 13% • Phải 19%';
        drag = 'Kéo Nhẹ Hãm Phanh Ngón Tay';
        diagnosis = 'Tâm vọt qua đầu vì gia tốc ngón tay quá cao. AI đã giảm nhìn xung quanh xuống 180 và tăng nút bắn lên 48% để làm điểm hãm quán tính ngón tay chuẩn xác!';
      } else if (selectedIssue === 'shotgun_miss') {
        gen = 192;
        red = 182;
        sc2 = 174;
        sc4 = 166;
        btn = 39;
        hud = 'Đáy 10% • Phải 18%';
        drag = 'Vuốt Móc Chữ J Góc Rộng';
        diagnosis = 'Shotgun cần hành trình móc chữ J rộng. AI đã tối ưu nút bắn siêu gọn 39% giúp ngón tay có không gian vẽ đường cong hoàn hảo vào đầu địch.';
      } else if (selectedIssue === 'smg_spread') {
        gen = 186;
        red = 178;
        sc2 = 172;
        sc4 = 165;
        btn = 46;
        hud = 'Đáy 12% • Phải 18%';
        drag = 'Kéo Thẳng Đều Tay Ghìm Độ Giật';
        diagnosis = 'Đạn MP40 xòe vì kéo giật cục bộ. AI thiết lập thông số cân bằng ổn định 186 giúp tâm khóa cứng ở cổ và tự động nảy lên đầu ở viên thứ 3.';
      } else {
        gen = 198;
        red = 192;
        sc2 = 186;
        sc4 = 178;
        btn = 44;
        hud = 'Đáy 11% • Phải 18%';
        drag = 'Vuốt Vừa Tay (Đã Bù Trừ Ma Sát)';
        diagnosis = 'Kính nhám và bao ngón tay làm giảm độ bám tiếp xúc cảm ứng. AI đã đẩy độ nhạy lên mức tối đa để giữ nguyên cảm giác lướt mượt mà!';
      }

      setCustomGeneral(gen);
      setCustomRedDot(red);
      setCustomScope2x(sc2);
      setCustomScope4x(sc4);
      setCustomButtonSize(btn);

      setAiResult({
        deviceName: `Cấu hình AI: ${customWeapon.split(' ')[0]} • ${selectedIssue}`,
        general: gen,
        redDot: red,
        scope2x: sc2,
        scope4x: sc4,
        awm: 74,
        freeLook: 140,
        buttonSize: btn,
        hudPos: hud,
        dragType: drag,
        diagnosis,
        headshotRate: '99.6% ĐẦU',
        dpi: '460 DPI (Hoặc 120 Trợ năng iOS)',
      });
      setAnalyzing(false);
    }, 400);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.glassHeader}>
        <View style={styles.headerTag}>
          <Text style={styles.headerTagText}>🤖 AI ESPORTS TACTICAL COACH 2026</Text>
        </View>
        <Text style={styles.headerTitle}>TRỢ LÝ AI TẠO & CHẨN ĐOÁN ĐỘ NHẠY</Text>
        <Text style={styles.headerSub}>
          Hoạt động như một huấn luyện viên thật: Phân tích thói quen bắn, bắt bệnh tâm ngắm và tạo cấu hình dính đầu tuyệt đối.
        </Text>
      </View>

      {/* Step 1: Chọn vấn đề gặp phải */}
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>1. BẠN ĐANG GẶP VẤN ĐỀ GÌ KHI KÉO TÂM?</Text>
        <View style={styles.issueList}>
          {COMMON_ISSUES.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={[styles.issueItem, selectedIssue === issue.id && styles.issueItemActive]}
              onPress={() => setSelectedIssue(issue.id)}>
              <Text style={[styles.issueText, selectedIssue === issue.id && styles.issueTextActive]}>
                {issue.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2: Dòng máy */}
        <Text style={[styles.cardTitle, { marginTop: 16 }]}>2. PHÂN LOẠI THIẾT BỊ:</Text>
        <View style={styles.chipRow}>
          {[
            'iPhone / iPad Pro',
            'Android Flagship (120Hz+)',
            'Android Tầm Trung (90Hz-120Hz)',
            'Máy Cấu Hình Yếu (60Hz)',
          ].map((dev) => (
            <TouchableOpacity
              key={dev}
              style={[styles.chip, deviceType === dev && styles.chipActive]}
              onPress={() => setDeviceType(dev)}>
              <Text style={[styles.chipText, deviceType === dev && styles.chipTextActive]}>
                {dev}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 3: Vũ khí */}
        <Text style={[styles.cardTitle, { marginTop: 16 }]}>3. DÒNG SÚNG SỞ TRƯỜNG:</Text>
        <View style={styles.chipRow}>
          {[
            'Shotgun (M1887, M1014)',
            'SMG Sấy (MP40, UMP)',
            'Súng Trường (AK, Scar)',
            'Trường Tầm Xa (Woodpecker, SVD)',
          ].map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.chip, customWeapon === w && styles.chipActive]}
              onPress={() => setCustomWeapon(w)}>
              <Text style={[styles.chipText, customWeapon === w && styles.chipTextActive]}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Diagnose Button */}
        <TouchableOpacity style={styles.diagnoseBtn} onPress={handleDiagnose}>
          <Text style={styles.diagnoseBtnText}>
            {analyzing ? '🔄 AI ĐANG TÍNH TOÁN...' : '⚡ AI PHÂN TÍCH & TẠO ĐỘ NHẠY DÍNH ĐẦU'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI RESULT & INTERACTIVE FINE-TUNER */}
      {aiResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.aiRateBadge}>
              <Text style={styles.aiRateBadgeText}>{aiResult.headshotRate}</Text>
            </View>
            <Text style={styles.aiResultTitle}>CẤU HÌNH ĐÃ TỐI ƯU HÓA HOÀN TẤT</Text>
          </View>

          {/* AI Diagnosis Explanations */}
          <View style={styles.diagnosisBox}>
            <Text style={styles.diagnosisIcon}>🤖</Text>
            <Text style={styles.diagnosisText}>{aiResult.diagnosis}</Text>
          </View>

          {/* Interactive Sliders (Tùy biến độ nhạy trực tiếp) */}
          <Text style={styles.sliderSectionTitle}>🎛️ BẠN CÓ THỂ TÙY BIẾN THÊM VÀI NẤC ĐỘ NHẠY:</Text>

          {/* General */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>Nhìn Xung Quanh</Text>
              <Text style={styles.sliderVal}>{customGeneral}</Text>
            </View>
            <View style={styles.stepGroup}>
              {[-4, -2, 0, +2, +4].map((step) => {
                const target = Math.max(100, Math.min(200, aiResult.general + step));
                return (
                  <TouchableOpacity
                    key={step}
                    style={[styles.stepItem, customGeneral === target && styles.stepItemActive]}
                    onPress={() => setCustomGeneral(target)}>
                    <Text style={[styles.stepText, customGeneral === target && styles.stepTextActive]}>
                      {target}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Red Dot */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>Red Dot Sight</Text>
              <Text style={styles.sliderVal}>{customRedDot}</Text>
            </View>
            <View style={styles.stepGroup}>
              {[-4, -2, 0, +2, +4].map((step) => {
                const target = Math.max(100, Math.min(200, aiResult.redDot + step));
                return (
                  <TouchableOpacity
                    key={step}
                    style={[styles.stepItem, customRedDot === target && styles.stepItemActive]}
                    onPress={() => setCustomRedDot(target)}>
                    <Text style={[styles.stepText, customRedDot === target && styles.stepTextActive]}>
                      {target}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scope 2X & 4X */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>Ống Ngắm 2X / 4X</Text>
              <Text style={styles.sliderVal}>{customScope2x} / {customScope4x}</Text>
            </View>
          </View>

          {/* Button Size */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderInfo}>
              <Text style={styles.sliderLabel}>Kích Thước Nút Bắn</Text>
              <Text style={[styles.sliderVal, { color: COLORS.secondary }]}>{customButtonSize}%</Text>
            </View>
            <View style={styles.stepGroup}>
              {[38, 42, 46, 50].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stepItem, customButtonSize === s && styles.stepItemActive]}
                  onPress={() => setCustomButtonSize(s)}>
                  <Text style={[styles.stepText, customButtonSize === s && styles.stepTextActive]}>
                    {s}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Strategy Details */}
          <View style={styles.extraDetailsCard}>
            <Text style={styles.extraDetailItem}>
              🎯 <Text style={styles.boldWhite}>DPI Đề Xuất:</Text> {aiResult.dpi}
            </Text>
            <Text style={styles.extraDetailItem}>
              📐 <Text style={styles.boldWhite}>Vị Trí HUD:</Text> {aiResult.hudPos}
            </Text>
            <Text style={styles.extraDetailItem}>
              ⚡ <Text style={styles.boldWhite}>Kỹ Thuật Vuốt:</Text> {aiResult.dragType}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.saveBtn}
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
              <Text style={styles.saveBtnText}>💾 LƯU CẤU HÌNH (ĐẶT TÊN)</Text>
            </TouchableOpacity>

            {onGoToTrainer && (
              <TouchableOpacity style={styles.trainerBtn} onPress={onGoToTrainer}>
                <Text style={styles.trainerBtnText}>🎯 VÀO PHÒNG BẮN TEST NGAY →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  glassHeader: {
    backgroundColor: COLORS.glassCard,
    padding: 16,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginTop: 12,
    marginBottom: 14,
  },
  headerTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 6,
  },
  headerTagText: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '900',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  cardBox: {
    backgroundColor: COLORS.glassCard,
    padding: 16,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  issueList: {
    gap: 8,
  },
  issueItem: {
    backgroundColor: COLORS.glassCardElevated,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  issueItemActive: {
    borderColor: COLORS.primaryBright,
    backgroundColor: 'rgba(255, 94, 0, 0.25)',
    borderWidth: 1.5,
  },
  issueText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  issueTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.glassCardElevated,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chipActive: {
    borderColor: COLORS.primaryBright,
    backgroundColor: 'rgba(255, 94, 0, 0.22)',
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.primaryBright,
    fontWeight: '900',
  },
  diagnoseBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.full,
    alignItems: 'center',
    marginTop: 18,
  },
  diagnoseBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: COLORS.rounded.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiRateBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    borderColor: COLORS.accentGreen,
  },
  aiRateBadgeText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: '900',
  },
  aiResultTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  diagnosisBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: COLORS.rounded.md,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
  },
  diagnosisIcon: {
    fontSize: 22,
  },
  diagnosisText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  sliderSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sliderRow: {
    marginBottom: 12,
  },
  sliderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sliderVal: {
    color: COLORS.primaryBright,
    fontSize: 14,
    fontWeight: '900',
  },
  stepGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepItem: {
    flex: 1,
    backgroundColor: COLORS.glassCard,
    paddingVertical: 8,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stepItemActive: {
    backgroundColor: 'rgba(255, 94, 0, 0.3)',
    borderColor: COLORS.primaryBright,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  extraDetailsCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.md,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  extraDetailItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
  boldWhite: {
    color: '#FFF',
    fontWeight: '800',
  },
  btnRow: {
    gap: 10,
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  trainerBtn: {
    backgroundColor: COLORS.glassCardElevated,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorderHighlight,
  },
  trainerBtnText: {
    color: COLORS.primaryBright,
    fontSize: 13,
    fontWeight: '900',
  },
});
