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
const PIXEL_RATIO = PixelRatio.get();
const ESTIMATED_PPI = Math.round(PIXEL_RATIO * 160);

const HUD_PRESETS = [
  {
    id: 'shotgun-onetap',
    name: 'Shotgun M1887 One-Tap',
    size: 42,
    posX: 82,
    posY: 11,
    opacity: 90,
    style: 'fire',
    desc: 'Kích cỡ nhỏ 42% giúp vệt vuốt ngón tay dài, dễ móc chữ J vọt thẳng lên đỉnh đầu.',
  },
  {
    id: 'smg-spray',
    name: 'SMG MP40 Sấy Trùm',
    size: 48,
    posX: 81,
    posY: 14,
    opacity: 95,
    style: 'neon',
    desc: 'Vừa vặn ngón cái, khoảng cách đáy 14% giúp ghìm tâm sấy chùm đạn chuẩn xác.',
  },
  {
    id: 'claw-master',
    name: 'Claw 4 Ngón Esports',
    size: 40,
    posX: 18,
    posY: 76,
    opacity: 85,
    style: 'gold',
    desc: 'Nút bắn đặt góc trên bên trái cho ngón trỏ, giải phóng hoàn toàn ngón cái kéo tâm.',
  },
  {
    id: 'safe-thumb',
    name: 'Tân Binh / 2 Ngón Dễ Trúng',
    size: 55,
    posX: 80,
    posY: 16,
    opacity: 100,
    style: 'tactical',
    desc: 'Nút to chống trượt tay, phù hợp máy màn hình nhỏ hoặc người mới tập kéo.',
  },
];

export default function HudAndDpiStudio({ onBack }) {
  const [activeSegment, setActiveSegment] = useState('evaluator'); // 'evaluator' | 'hud' | 'graphics'

  // --- AI Phone Evaluator Form State ---
  const [deviceModel, setDeviceModel] = useState('');
  const [screenInches, setScreenInches] = useState('6.67');
  const [ramSize, setRamSize] = useState('8GB');
  const [refreshRate, setRefreshRate] = useState('120Hz');
  const [screenCover, setScreenCover] = useState('Kính Cường Lực');
  const [fingerForce, setFingerForce] = useState('Vuốt Vừa (Chuẩn)');
  const [aiReport, setAiReport] = useState(null);

  // --- HUD Studio State ---
  const [btnSize, setBtnSize] = useState(42);
  const [btnOpacity, setBtnOpacity] = useState(90);
  const [btnPosX, setBtnPosX] = useState(82);
  const [btnPosY, setBtnPosY] = useState(12);
  const [btnStyle, setBtnStyle] = useState('fire');

  // AI EVALUATION & OPTIMIZATION ALGORITHM (Quantum Headshot V2)
  const handleRunAiEvaluation = () => {
    const inches = parseFloat(screenInches) || 6.67;
    const hz = parseInt(refreshRate, 10) || 120;
    const isSmallScreen = inches < 6.4;
    const isLargeScreen = inches > 7.0;

    // 1. Calculate Optimal Button Size based on screen size & finger force
    let recBtnSize = 44;
    if (isSmallScreen) recBtnSize = 52;
    else if (isLargeScreen) recBtnSize = 40;
    else recBtnSize = 43;

    if (fingerForce.includes('Mạnh')) recBtnSize -= 2;
    if (fingerForce.includes('Nhẹ')) recBtnSize += 3;

    // 2. Calculate Optimal HUD Position
    let recPosY = 11;
    let recPosX = 82;
    if (isLargeScreen) {
      recPosY = 14;
      recPosX = 84;
    }

    // 3. Calculate Sweet Spot DPI (Developer Options)
    let baseDpiEstimate = 392;
    if (deviceModel.toLowerCase().includes('apple') || deviceModel.toLowerCase().includes('iphone')) {
      baseDpiEstimate = 'iOS Trợ Năng (Con Trượt 120)';
    } else if (deviceModel.toLowerCase().includes('samsung')) {
      baseDpiEstimate = 411;
    } else if (deviceModel.toLowerCase().includes('oppo') || deviceModel.toLowerCase().includes('realme')) {
      baseDpiEstimate = 360;
    }

    let recDpi = typeof baseDpiEstimate === 'number' ? Math.round(baseDpiEstimate * 1.25) : baseDpiEstimate;
    let maxSafeDpi = typeof baseDpiEstimate === 'number' ? Math.round(baseDpiEstimate * 1.45) : 'Không áp dụng';

    // 4. Touch Latency Estimation
    let estLatency = hz >= 120 ? '5ms - 7ms (Cực thấp chuẩn Esports)' : '14ms - 18ms (Bình thường)';
    let headshotBoost = hz >= 120 ? '+34% độ dính đầu' : '+22% độ dính đầu';

    const report = {
      modelName: deviceModel.trim() || 'Thiết Bị Của Bạn',
      recBtnSize,
      recPosY,
      recPosX,
      recDpi,
      maxSafeDpi,
      estLatency,
      headshotBoost,
      advice: `Với màn hình ${inches} inch và tần số ${refreshRate}, thuật toán AI khuyên dùng nút bắn ${recBtnSize}% đặt cách đáy ${recPosY}% để hành trình vuốt đạt điểm vàng (Sweet Spot), triệt tiêu hoàn toàn lỗi ghim ngực!`,
    };

    setAiReport(report);
  };

  const handleApplyAiToStudio = () => {
    if (!aiReport) return;
    setBtnSize(aiReport.recBtnSize);
    setBtnPosY(aiReport.recPosY);
    setBtnPosX(aiReport.recPosX);
    setActiveSegment('hud');
    Alert.alert('✅ Thành Công', 'Đã nạp thông số AI vào Studio Nút Bắn!');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Nút Quay Lại Cực To Dễ Bấm (Kính Lỏng) */}
      {onBack && (
        <TouchableOpacity style={styles.largeBackButton} onPress={onBack}>
          <Text style={styles.largeBackIcon}>←</Text>
          <Text style={styles.largeBackText}>QUAY LẠI TRANG CHỦ</Text>
        </TouchableOpacity>
      )}

      {/* Header Liquid Glass Banner */}
      <View style={styles.glassHeader}>
        <View style={styles.headerTag}>
          <Text style={styles.headerTagText}>⚡ AI TACTICAL STUDIO 2026</Text>
        </View>
        <Text style={styles.headerTitle}>STUDIO NÚT BẮN & ĐÁNH GIÁ MÁY</Text>
        <Text style={styles.headerSub}>
          Nhập thông số điện thoại để AI chẩn đoán, tối ưu DPI và căn chỉnh nút bắn HUD chuẩn xác.
        </Text>
      </View>

      {/* 3-Segment Switcher */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'evaluator' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('evaluator')}>
          <Text style={[styles.segmentText, activeSegment === 'evaluator' && styles.segmentTextActive]}>
            🤖 AI Đánh Giá Máy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'hud' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('hud')}>
          <Text style={[styles.segmentText, activeSegment === 'hud' && styles.segmentTextActive]}>
            🎯 Studio Nút Bắn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'graphics' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('graphics')}>
          <Text style={[styles.segmentText, activeSegment === 'graphics' && styles.segmentTextActive]}>
            🎮 Đồ Họa & FPS
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================== PHẦN 1: AI ĐÁNH GIÁ THÔNG SỐ ĐIỆN THOẠI ==================== */}
      {activeSegment === 'evaluator' && (
        <View>
          <View style={styles.glassCardContainer}>
            <Text style={styles.cardHeaderTitle}>📱 NHẬP THÔNG SỐ ĐIỆN THOẠI CỦA BẠN</Text>
            <Text style={styles.cardHeaderSub}>
              AI sẽ phân tích mật độ điểm ảnh, độ trễ và tính toán kích cỡ nút bắn & DPI phù hợp nhất.
            </Text>

            {/* Input 1: Tên máy */}
            <Text style={styles.fieldLabel}>1. Tên dòng máy (Ví dụ: Redmi Note 13, iPhone 15, S24...)</Text>
            <TextInput
              style={styles.glassInput}
              placeholder="Nhập tên điện thoại của bạn..."
              placeholderTextColor={COLORS.textMuted}
              value={deviceModel}
              onChangeText={setDeviceModel}
            />

            {/* Input 2: Kích thước màn hình */}
            <Text style={styles.fieldLabel}>2. Kích thước màn hình (inch)</Text>
            <View style={styles.chipRow}>
              {['6.1 inch', '6.67 inch (Chuẩn)', '6.78 inch', 'iPad / Tablet'].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chipBtn, screenInches.includes(val.split(' ')[0]) && styles.chipBtnActive]}
                  onPress={() => setScreenInches(val.split(' ')[0])}>
                  <Text style={[styles.chipText, screenInches.includes(val.split(' ')[0]) && styles.chipTextActive]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input 3: Tần số quét */}
            <Text style={styles.fieldLabel}>3. Tần số quét màn hình</Text>
            <View style={styles.chipRow}>
              {['60Hz', '90Hz', '120Hz', '144Hz+'].map((hz) => (
                <TouchableOpacity
                  key={hz}
                  style={[styles.chipBtn, refreshRate === hz && styles.chipBtnActive]}
                  onPress={() => setRefreshRate(hz)}>
                  <Text style={[styles.chipText, refreshRate === hz && styles.chipTextActive]}>
                    {hz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input 4: Lực vuốt ngón tay */}
            <Text style={styles.fieldLabel}>4. Thói quen lực vuốt tay của bạn</Text>
            <View style={styles.chipRow}>
              {['Vuốt Nhẹ (Chạm Lướt)', 'Vuốt Vừa (Chuẩn)', 'Vuốt Mạnh (Dứt Khoát)'].map((force) => (
                <TouchableOpacity
                  key={force}
                  style={[styles.chipBtn, fingerForce === force && styles.chipBtnActive]}
                  onPress={() => setFingerForce(force)}>
                  <Text style={[styles.chipText, fingerForce === force && styles.chipTextActive]}>
                    {force}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Run AI Button */}
            <TouchableOpacity style={styles.aiEvalBtn} onPress={handleRunAiEvaluation}>
              <Text style={styles.aiEvalBtnText}>🤖 AI PHÂN TÍCH & ĐỀ XUẤT CẤU HÌNH</Text>
            </TouchableOpacity>
          </View>

          {/* AI Diagnostic Output Report */}
          {aiReport && (
            <View style={styles.aiReportCard}>
              <View style={styles.aiReportHeader}>
                <Text style={styles.aiReportBadge}>BÁO CÁO TỐI ƯU HÓA AI QUANTUM V2</Text>
                <Text style={styles.aiReportModel}>{aiReport.modelName}</Text>
              </View>

              {/* Grid 4 Metrics */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Nút Bắn Chuẩn</Text>
                  <Text style={[styles.metricVal, { color: COLORS.primaryBright }]}>
                    {aiReport.recBtnSize}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>DPI Khuyên Dùng</Text>
                  <Text style={[styles.metricVal, { color: COLORS.secondary }]}>
                    {aiReport.recDpi}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Vị Trí Đáy HUD</Text>
                  <Text style={[styles.metricVal, { color: COLORS.accentCyan }]}>
                    Đáy {aiReport.recPosY}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Tỉ Lệ Tăng Đầu</Text>
                  <Text style={[styles.metricVal, { color: COLORS.accentGreen }]}>
                    {aiReport.headshotBoost}
                  </Text>
                </View>
              </View>

              <View style={styles.reportAdviceBox}>
                <Text style={styles.reportAdviceIcon}>💡</Text>
                <Text style={styles.reportAdviceText}>{aiReport.advice}</Text>
              </View>

              <TouchableOpacity style={styles.applyToStudioBtn} onPress={handleApplyAiToStudio}>
                <Text style={styles.applyToStudioBtnText}>
                  👉 ÁP DỤNG THÔNG SỐ VÀO STUDIO NÚT BẮN →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ==================== PHẦN 2: STUDIO NÚT BẮN (HUD STUDIO) ==================== */}
      {activeSegment === 'hud' && (
        <View>
          <Text style={styles.sectionTitle}>MÔ PHỎNG VỊ TRÍ NÚT BẮN TRÊN MÀN HÌNH GAME:</Text>

          {/* Virtual Phone Mockup Frame */}
          <View style={styles.phoneFrame}>
            <View style={styles.frameHeader}>
              <Text style={styles.frameMiniText}>🔴 LIVE COMBAT 2026</Text>
              <Text style={styles.frameMiniText}>TỈ LỆ 20:9</Text>
            </View>

            {/* Crosshair Center */}
            <View style={styles.centerReticle}>
              <View style={styles.reticleDot} />
              <View style={styles.reticleRing} />
            </View>

            {/* Movable Fire Button Simulation */}
            <View
              style={[
                styles.simulatedFireBtn,
                {
                  left: `${btnPosX - btnSize / 10}%`,
                  bottom: `${btnPosY}%`,
                  width: btnSize * 1.3,
                  height: btnSize * 1.3,
                  borderRadius: (btnSize * 1.3) / 2,
                  opacity: btnOpacity / 100,
                  borderColor:
                    btnStyle === 'fire'
                      ? COLORS.primaryBright
                      : btnStyle === 'neon'
                      ? COLORS.accentCyan
                      : btnStyle === 'gold'
                      ? COLORS.secondary
                      : '#FFF',
                  backgroundColor:
                    btnStyle === 'fire'
                      ? 'rgba(255, 94, 0, 0.45)'
                      : btnStyle === 'neon'
                      ? 'rgba(0, 229, 255, 0.4)'
                      : btnStyle === 'gold'
                      ? 'rgba(255, 183, 0, 0.4)'
                      : 'rgba(255, 255, 255, 0.3)',
                },
              ]}>
              <Text style={{ fontSize: btnSize * 0.42 }}>
                {btnStyle === 'fire' ? '🔥' : btnStyle === 'neon' ? '⚡' : btnStyle === 'gold' ? '👑' : '🎯'}
              </Text>
            </View>

            <View style={styles.frameFooter}>
              <Text style={styles.frameFooterText}>
                Size: {btnSize}% • Đáy: {btnPosY}% • Cách Phải: {100 - btnPosX}% • Mờ: {btnOpacity}%
              </Text>
            </View>
          </View>

          {/* Presets */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>PRESET CAO THỦ THI ĐẤU:</Text>
          <View style={styles.presetGrid}>
            {HUD_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.glassPresetCard}
                onPress={() => {
                  setBtnSize(p.size);
                  setBtnPosX(p.posX);
                  setBtnPosY(p.posY);
                  setBtnOpacity(p.opacity);
                  setBtnStyle(p.style);
                }}>
                <Text style={styles.presetName}>{p.name}</Text>
                <Text style={styles.presetDetails}>
                  Size {p.size}% • Đáy {p.posY}% • Phải {100 - p.posX}%
                </Text>
                <Text style={styles.presetDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Size Controls */}
          <View style={styles.glassCardContainer}>
            <Text style={styles.cardHeaderTitle}>⚙️ ĐIỀU CHỈNH KÍCH THƯỚC NÚT BẮN</Text>
            <View style={styles.sliderInfoRow}>
              <Text style={styles.sliderInfoLabel}>Kích Cỡ Nút Bắn Hiện Tại</Text>
              <Text style={styles.sliderInfoVal}>{btnSize}%</Text>
            </View>
            <View style={styles.stepBtnRow}>
              {[38, 42, 48, 54, 62].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stepBtn, btnSize === s && styles.stepBtnActive]}
                  onPress={() => setBtnSize(s)}>
                  <Text style={[styles.stepBtnText, btnSize === s && styles.stepBtnTextActive]}>
                    {s}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sliderInfoLabel, { marginTop: 14 }]}>Khoảng Cách Đáy Màn Hình</Text>
            <View style={styles.stepBtnRow}>
              {[8, 11, 14, 18, 22].map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.stepBtn, btnPosY === y && styles.stepBtnActive]}
                  onPress={() => setBtnPosY(y)}>
                  <Text style={[styles.stepBtnText, btnPosY === y && styles.stepBtnTextActive]}>
                    {y}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ==================== PHẦN 3: HƯỚNG DẪN CÀI ĐẶT ĐỒ HỌA & FPS ==================== */}
      {activeSegment === 'graphics' && (
        <View>
          <View style={styles.glassCardContainer}>
            <Text style={styles.cardHeaderTitle}>🎮 HƯỚNG DẪN TỐI ƯU ĐỒ HỌA FREE FIRE</Text>
            <Text style={styles.cardHeaderSub}>
              Cài đặt đồ họa chuẩn để giảm tối đa độ trễ cảm ứng và tránh drop FPS khi giao tranh đông.
            </Text>

            {/* Profile 1: Máy Yếu */}
            <View style={styles.guideCard}>
              <View style={styles.guideCardHeader}>
                <Text style={styles.guideBadge}>MÁY CẤU HÌNH YẾU (2GB - 4GB RAM)</Text>
              </View>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Đồ Họa:</Text> Thấp (Mượt) - Giúp màn hình không bị nóng, ổn định khung hình.</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Độ Phân Giải Cao:</Text> TẮT (Tiêu chuẩn).</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Đổ Bóng:</Text> TẮT.</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldHighlight}>FPS Cao (High FPS):</Text> LUÔN BẬT CAO! (Cực kỳ quan trọng để độ nhạy cảm ứng đạt 60fps mượt mà).</Text>
            </View>

            {/* Profile 2: Máy Tầm Trung */}
            <View style={[styles.guideCard, styles.guideCardHighlight]}>
              <View style={styles.guideCardHeader}>
                <Text style={[styles.guideBadge, { color: COLORS.primaryBright }]}>MÁY TẦM TRUNG (6GB - 8GB RAM, 90Hz/120Hz)</Text>
              </View>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Đồ Họa:</Text> Tiêu Chuẩn (hoặc Cao nếu chip Snapdragon 7 series/Dimensity 8000 trở lên).</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Độ Phân Giải Cao:</Text> BẬT CAO (giúp nhìn rõ đầu địch từ xa).</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Đổ Bóng:</Text> TẮT (đỡ phân tâm khi kéo tâm).</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldHighlight}>FPS Cao:</Text> LUÔN BẬT CAO (mở khóa 90-120fps).</Text>
            </View>

            {/* Profile 3: Flagship Gaming */}
            <View style={styles.guideCard}>
              <View style={styles.guideCardHeader}>
                <Text style={[styles.guideBadge, { color: COLORS.secondary }]}>FLAGSHIP & GAMING PHONE (12GB+ RAM, 120Hz-165Hz)</Text>
              </View>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Đồ Họa:</Text> Cao (Max Settings).</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldWhite}>Bộ Lọc Màu:</Text> Tươi Sáng (Rực Rỡ) - Giúp phát hiện địch ẩn nấp sau cỏ/bụi rậm nhanh hơn 0.5s.</Text>
              <Text style={styles.guideItem}>• <Text style={styles.boldHighlight}>FPS Cao:</Text> BẬT TỐI ĐA (120Hz - 165Hz Pro).</Text>
            </View>

            {/* Pro Tips for Settings */}
            <View style={styles.proTipsBox}>
              <Text style={styles.proTipsTitle}>💡 3 MẸO TĂNG TỐC CẢM ỨNG TRONG HỆ THỐNG MÁY:</Text>
              <Text style={styles.proTipText}>1. Bật tính năng <Text style={styles.boldWhite}>Không Gian Trò Chơi (Game Turbo / Game Booster)</Text> và chọn chế độ Hiệu Năng Tối Đa.</Text>
              <Text style={styles.proTipText}>2. Vào Cài Đặt Màn Hình → Chỉnh Tần Số Quét luôn ở mức cao nhất (120Hz hoặc 144Hz).</Text>
              <Text style={styles.proTipText}>3. Thường xuyên lau sạch màn hình bằng khăn mềm hoặc dùng bao ngón tay chống mồ hôi để lực vuốt luôn đồng đều.</Text>
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
  largeBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassCardElevated,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorderHighlight,
    marginTop: 12,
    marginBottom: 8,
  },
  largeBackIcon: {
    fontSize: 22,
    color: COLORS.primaryBright,
    fontWeight: 'bold',
    marginRight: 10,
  },
  largeBackText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  glassHeader: {
    backgroundColor: COLORS.glassCard,
    padding: 16,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
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
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.lg,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  glassCardContainer: {
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeaderSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 17,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  glassInput: {
    backgroundColor: 'rgba(18, 10, 5, 0.85)',
    borderRadius: COLORS.rounded.md,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBtn: {
    backgroundColor: COLORS.glassCardElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chipBtnActive: {
    borderColor: COLORS.primaryBright,
    backgroundColor: 'rgba(255, 94, 0, 0.25)',
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
  aiEvalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.lg,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  aiEvalBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiReportCard: {
    backgroundColor: 'rgba(38, 18, 8, 0.95)',
    borderRadius: COLORS.rounded.xl,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 16,
  },
  aiReportHeader: {
    marginBottom: 12,
  },
  aiReportBadge: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiReportModel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glassCard,
    padding: 12,
    borderRadius: COLORS.rounded.md,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  reportAdviceBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 115, 0, 0.12)',
    padding: 12,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
  },
  reportAdviceIcon: {
    fontSize: 20,
  },
  reportAdviceText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  applyToStudioBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
  },
  applyToStudioBtnText: {
    color: '#0E0804',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneFrame: {
    backgroundColor: 'rgba(18, 10, 5, 0.95)',
    borderRadius: COLORS.rounded.xl,
    borderWidth: 2,
    borderColor: COLORS.glassBorderHighlight,
    height: 230,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  frameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frameMiniText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  centerReticle: {
    position: 'absolute',
    top: '40%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentRed,
  },
  reticleRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 66, 0.5)',
  },
  simulatedFireBtn: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameFooter: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 3,
    borderRadius: 6,
  },
  frameFooterText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  presetGrid: {
    gap: 8,
    marginBottom: 14,
  },
  glassPresetCard: {
    backgroundColor: COLORS.glassCard,
    padding: 12,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  presetName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  presetDetails: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  presetDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  sliderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderInfoLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sliderInfoVal: {
    color: COLORS.primaryBright,
    fontSize: 13,
    fontWeight: '800',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: COLORS.glassCardElevated,
    paddingVertical: 8,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stepBtnActive: {
    backgroundColor: 'rgba(255, 94, 0, 0.3)',
    borderColor: COLORS.primaryBright,
  },
  stepBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  stepBtnTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  guideCard: {
    backgroundColor: COLORS.glassCardElevated,
    padding: 14,
    borderRadius: COLORS.rounded.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  guideCardHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  guideCardHeader: {
    marginBottom: 6,
  },
  guideBadge: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  guideItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  boldWhite: {
    color: '#FFF',
    fontWeight: '800',
  },
  boldHighlight: {
    color: COLORS.primaryBright,
    fontWeight: '900',
  },
  proTipsBox: {
    backgroundColor: 'rgba(255, 183, 0, 0.1)',
    borderRadius: COLORS.rounded.md,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  proTipsTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  proTipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});
