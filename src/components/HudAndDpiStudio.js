import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  PixelRatio,
  Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HUD_PRESETS = [
  {
    id: 'shotgun-onetap',
    name: 'Shotgun M1887 One-Tap',
    size: 42,
    posX: 82,
    posY: 12,
    opacity: 90,
    desc: 'Kích cỡ nhỏ 42% giúp vệt vuốt dài, dễ móc chữ J vọt thẳng lên đầu.',
  },
  {
    id: 'smg-spray',
    name: 'SMG MP40 Sấy Trùm',
    size: 48,
    posX: 81,
    posY: 14,
    opacity: 95,
    desc: 'Vừa vặn ngón cái, khoảng cách đáy 14% giúp ghìm tâm sấy chùm đạn chuẩn xác.',
  },
  {
    id: 'claw-master',
    name: 'Claw 4 Ngón Esports',
    size: 40,
    posX: 18,
    posY: 76,
    opacity: 85,
    desc: 'Nút bắn đặt góc trên bên trái cho ngón trỏ, giải phóng ngón cái di chuyển.',
  },
  {
    id: 'safe-thumb',
    name: 'Tân Binh 2 Ngón Dễ Trúng',
    size: 55,
    posX: 80,
    posY: 16,
    opacity: 100,
    desc: 'Nút to chống trượt tay, phù hợp máy màn hình nhỏ hoặc người mới tập kéo.',
  },
];

export default function HudAndDpiStudio({ onBack }) {
  const [activeSegment, setActiveSegment] = useState('evaluator'); // 'evaluator' | 'hud' | 'graphics'

  // --- AI Phone Evaluator State ---
  const [deviceModel, setDeviceModel] = useState('');
  const [screenInches, setScreenInches] = useState('6.67');
  const [refreshRate, setRefreshRate] = useState('120Hz');
  const [fingerForce, setFingerForce] = useState('Vuốt Vừa (Chuẩn)');
  const [aiReport, setAiReport] = useState(null);

  // --- HUD Studio State ---
  const [btnSize, setBtnSize] = useState(42);
  const [btnOpacity, setBtnOpacity] = useState(90);
  const [btnPosX, setBtnPosX] = useState(82);
  const [btnPosY, setBtnPosY] = useState(12);

  const handleRunAiEvaluation = () => {
    const inches = parseFloat(screenInches) || 6.67;
    const hz = parseInt(refreshRate, 10) || 120;
    const isSmall = inches < 6.4;
    const isLarge = inches > 7.0;

    let recBtnSize = isSmall ? 52 : isLarge ? 40 : 43;
    if (fingerForce.includes('Mạnh')) recBtnSize -= 2;
    if (fingerForce.includes('Nhẹ')) recBtnSize += 3;

    let baseDpi = 392;
    if (deviceModel.toLowerCase().includes('apple') || deviceModel.toLowerCase().includes('iphone')) {
      baseDpi = 'iOS Trợ Năng (Con Trượt 120)';
    } else if (deviceModel.toLowerCase().includes('samsung')) {
      baseDpi = 411;
    } else if (deviceModel.toLowerCase().includes('oppo') || deviceModel.toLowerCase().includes('realme')) {
      baseDpi = 360;
    }

    const recDpi = typeof baseDpi === 'number' ? Math.round(baseDpi * 1.25) : baseDpi;
    const maxSafe = typeof baseDpi === 'number' ? Math.round(baseDpi * 1.45) : 'Không áp dụng';

    setAiReport({
      modelName: deviceModel.trim() || 'Thiết Bị Của Bạn',
      recBtnSize,
      recPosY: 12,
      recPosX: 82,
      recDpi,
      maxSafe,
      latency: hz >= 120 ? '5ms (Chuẩn Esports)' : '16ms (Chuẩn 60Hz)',
      advice: `Màn hình ${inches}" với tần số ${refreshRate}: nút bắn ${recBtnSize}% đặt góc phải cách đáy 12% là điểm vàng giúp tâm thoát ngực và dính đầu 99.8%!`,
    });
  };

  const handleApplyToStudio = () => {
    if (!aiReport) return;
    setBtnSize(aiReport.recBtnSize);
    setBtnPosY(aiReport.recPosY);
    setBtnPosX(aiReport.recPosX);
    setActiveSegment('hud');
    Alert.alert('✅ Thành Công', 'Đã áp dụng thông số vào Studio Nút Bắn!');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* iOS-Style Sleek Back Button */}
      {onBack && (
        <TouchableOpacity style={styles.backBtnRow} onPress={onBack}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      )}

      {/* Header iOS Liquid Glass */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>TỐI ƯU CẢM ỨNG & THIẾT BỊ</Text>
        <Text style={styles.headerTitle}>Studio Nút Bắn & DPI</Text>
      </View>

      {/* Segment Selector (iOS 26 Frosted Glass Pill) */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentItem, activeSegment === 'evaluator' && styles.segmentItemActive]}
          onPress={() => setActiveSegment('evaluator')}>
          <Text style={[styles.segmentText, activeSegment === 'evaluator' && styles.segmentTextActive]}>
            🤖 Đánh Giá Máy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentItem, activeSegment === 'hud' && styles.segmentItemActive]}
          onPress={() => setActiveSegment('hud')}>
          <Text style={[styles.segmentText, activeSegment === 'hud' && styles.segmentTextActive]}>
            🎯 Nút Bắn HUD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentItem, activeSegment === 'graphics' && styles.segmentItemActive]}
          onPress={() => setActiveSegment('graphics')}>
          <Text style={[styles.segmentText, activeSegment === 'graphics' && styles.segmentTextActive]}>
            🎮 Đồ Họa & FPS
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= PHẦN 1: AI ĐÁNH GIÁ THÔNG SỐ ĐIỆN THOẠI ================= */}
      {activeSegment === 'evaluator' && (
        <View>
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Thông số máy của bạn</Text>
            <Text style={styles.cardDesc}>
              Nhập thông tin máy để AI đề xuất DPI và kích cỡ nút bắn chuẩn nhất.
            </Text>

            {/* Input model */}
            <Text style={styles.fieldLabel}>Tên điện thoại</Text>
            <TextInput
              style={styles.inputField}
              placeholder="VD: iPhone 15, Redmi K70, Galaxy S24..."
              placeholderTextColor={COLORS.textDim}
              value={deviceModel}
              onChangeText={setDeviceModel}
            />

            {/* Screen inches */}
            <Text style={styles.fieldLabel}>Kích thước màn hình</Text>
            <View style={styles.pillGroup}>
              {['6.1"', '6.67" (Chuẩn)', '6.78"', 'iPad'].map((inch) => (
                <TouchableOpacity
                  key={inch}
                  style={[styles.pillBtn, screenInches.includes(inch.replace('"', '').split(' ')[0]) && styles.pillBtnActive]}
                  onPress={() => setScreenInches(inch.replace('"', '').split(' ')[0])}>
                  <Text style={[styles.pillText, screenInches.includes(inch.replace('"', '').split(' ')[0]) && styles.pillTextActive]}>
                    {inch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Refresh rate */}
            <Text style={styles.fieldLabel}>Tần số quét màn hình</Text>
            <View style={styles.pillGroup}>
              {['60Hz', '90Hz', '120Hz', '144Hz+'].map((hz) => (
                <TouchableOpacity
                  key={hz}
                  style={[styles.pillBtn, refreshRate === hz && styles.pillBtnActive]}
                  onPress={() => setRefreshRate(hz)}>
                  <Text style={[styles.pillText, refreshRate === hz && styles.pillTextActive]}>
                    {hz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Button Analyze */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRunAiEvaluation}>
              <Text style={styles.primaryBtnText}>Đánh Giá & Đề Xuất Cấu Hình</Text>
            </TouchableOpacity>
          </View>

          {/* AI Result Report */}
          {aiReport && (
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportModelText}>{aiReport.modelName}</Text>
                <View style={styles.badgeSuccess}>
                  <Text style={styles.badgeSuccessText}>Chuẩn 100%</Text>
                </View>
              </View>

              <View style={styles.metricGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Nút Bắn Chuẩn</Text>
                  <Text style={styles.metricValPrimary}>{aiReport.recBtnSize}%</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>DPI Khuyên Dùng</Text>
                  <Text style={styles.metricVal}>{aiReport.recDpi}</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Vị Trí HUD</Text>
                  <Text style={styles.metricVal}>Đáy 12%</Text>
                </View>
              </View>

              <Text style={styles.adviceText}>{aiReport.advice}</Text>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleApplyToStudio}>
                <Text style={styles.secondaryBtnText}>Áp dụng vào Studio Nút Bắn →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ================= PHẦN 2: STUDIO NÚT BẮN HUD ================= */}
      {activeSegment === 'hud' && (
        <View>
          {/* Simulated Screen with Bottom-Right Fire Button */}
          <View style={styles.phoneSimulator}>
            <View style={styles.simHeader}>
              <Text style={styles.simHeaderText}>VỊ TRÍ NÚT BẮN CHUẨN GÓC DƯỚI BÊN PHẢI (FREE FIRE HUD)</Text>
            </View>

            {/* Center Crosshair */}
            <View style={styles.simReticle}>
              <View style={styles.simDot} />
            </View>

            {/* Simulated Fire Button in Bottom-Right Corner */}
            <View
              style={[
                styles.simFireButton,
                {
                  right: `${100 - btnPosX}%`,
                  bottom: `${btnPosY}%`,
                  width: btnSize * 1.35,
                  height: btnSize * 1.35,
                  borderRadius: (btnSize * 1.35) / 2,
                  opacity: btnOpacity / 100,
                },
              ]}>
              <Text style={{ fontSize: btnSize * 0.45 }}>🔥</Text>
            </View>
          </View>

          {/* Preset Buttons */}
          <Text style={styles.sectionHeader}>Preset Cao Thủ</Text>
          <View style={styles.presetGrid}>
            {HUD_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.presetCard}
                onPress={() => {
                  setBtnSize(p.size);
                  setBtnPosX(p.posX);
                  setBtnPosY(p.posY);
                  setBtnOpacity(p.opacity);
                }}>
                <Text style={styles.presetTitle}>{p.name}</Text>
                <Text style={styles.presetSub}>Nút {p.size}% • Đáy {p.posY}%</Text>
                <Text style={styles.presetDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Slider Size Controls */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Kích Cỡ Nút Bắn: {btnSize}%</Text>
            <View style={styles.pillGroup}>
              {[38, 42, 46, 50, 56].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pillBtn, btnSize === s && styles.pillBtnActive]}
                  onPress={() => setBtnSize(s)}>
                  <Text style={[styles.pillText, btnSize === s && styles.pillTextActive]}>{s}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ================= PHẦN 3: HƯỚNG DẪN ĐỒ HỌA & FPS ================= */}
      {activeSegment === 'graphics' && (
        <View>
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Cài Đặt Đồ Họa Chuẩn Thi Đấu</Text>
            <Text style={styles.cardDesc}>Tối ưu hóa để giảm tối đa độ trễ cảm ứng màn hình.</Text>

            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>📱 MÁY YẾU (2GB - 4GB RAM)</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>Đồ Họa:</Text> Thấp (Mượt) để máy không bị nóng.</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>FPS Cao:</Text> BẮT BUỘC BẬT (để cảm ứng nhận lệnh 60fps mượt).</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>Đổ Bóng:</Text> Tắt.</Text>
            </View>

            <View style={[styles.guideBox, styles.guideBoxActive]}>
              <Text style={[styles.guideTitle, { color: COLORS.primaryBright }]}>⚡ MÁY TẦM TRUNG (6GB - 8GB, 90Hz/120Hz)</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>Đồ Họa:</Text> Tiêu Chuẩn (hoặc Cao nếu chip mạnh).</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>Độ Phân Giải:</Text> Cao (nhìn rõ đầu địch từ xa).</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>FPS Cao:</Text> Bật Cao (mở khóa 90-120fps).</Text>
            </View>

            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>👑 FLAGSHIP (12GB+ RAM, 120Hz-165Hz)</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>Đồ Họa:</Text> Cao / Rực Rỡ (nhận diện địch nhanh).</Text>
              <Text style={styles.guideText}>• <Text style={styles.bold}>FPS Cao:</Text> Bật Tối Đa.</Text>
            </View>
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
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginTop: 8,
    marginBottom: 12,
  },
  backChevron: {
    fontSize: 26,
    color: COLORS.primaryBright,
    marginRight: 6,
    marginTop: -2,
    fontWeight: '300',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    marginBottom: 16,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: COLORS.rounded.full,
    padding: 3,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: COLORS.rounded.full,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  glassCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.full,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: COLORS.rounded.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reportModelText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: COLORS.rounded.full,
  },
  badgeSuccessText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 12,
    borderRadius: COLORS.rounded.md,
    marginBottom: 12,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  metricVal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  metricValPrimary: {
    color: COLORS.primaryBright,
    fontSize: 16,
    fontWeight: '900',
  },
  adviceText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    paddingVertical: 12,
    borderRadius: COLORS.rounded.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryBtnText: {
    color: COLORS.primaryBright,
    fontSize: 13,
    fontWeight: '800',
  },
  phoneSimulator: {
    height: 220,
    backgroundColor: '#07080B',
    borderRadius: COLORS.rounded.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  simHeader: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
  },
  simHeaderText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simReticle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentRed,
  },
  simFireButton: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primaryBright,
    backgroundColor: 'rgba(255, 106, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  presetGrid: {
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    backgroundColor: COLORS.glassCard,
    padding: 14,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  presetTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  presetSub: {
    color: COLORS.primaryBright,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  presetDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  guideBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: COLORS.rounded.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  guideBoxActive: {
    borderColor: 'rgba(255, 106, 0, 0.4)',
  },
  guideTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  guideText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    color: '#FFF',
    fontWeight: '700',
  },
});
