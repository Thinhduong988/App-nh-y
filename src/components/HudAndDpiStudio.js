import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
  Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIXEL_RATIO = PixelRatio.get();
const FONT_SCALE = PixelRatio.getFontScale();
const ESTIMATED_PPI = Math.round(PIXEL_RATIO * 160);

const HUD_PRESETS = [
  {
    id: 'shotgun-onetap',
    name: 'Shotgun M1887 One-Tap',
    size: 42,
    posX: 82, // % from left
    posY: 11, // % from bottom
    opacity: 85,
    style: 'fire',
    desc: 'Tối ưu cho vuốt móc chữ J, kích cỡ nhỏ giúp vệt vuốt dài và dễ kéo lên đỉnh đầu.',
  },
  {
    id: 'smg-spray',
    name: 'SMG MP40 Sấy Trùm',
    size: 48,
    posX: 81,
    posY: 14,
    opacity: 90,
    style: 'neon',
    desc: 'Kích cỡ vừa vặn ngón cái, khoảng cách đáy 14% giúp ghìm tâm đều đặn.',
  },
  {
    id: 'claw-master',
    name: 'Claw 4 Ngón Esports',
    size: 40,
    posX: 18, // left side for left index finger
    posY: 78, // top left
    opacity: 80,
    style: 'gold',
    desc: 'Dành cho lối chơi 4 ngón: Nút bắn đặt góc trên bên trái, giải phóng ngón cái di chuyển.',
  },
  {
    id: 'safe-thumb',
    name: 'Tân Binh / 2 Ngón Dễ Trúng',
    size: 55,
    posX: 80,
    posY: 16,
    opacity: 100,
    style: 'tactical',
    desc: 'Nút to chống trượt tay, phù hợp người mới hoặc máy màn hình dưới 6.3 inch.',
  },
];

const DPI_PRESETS = [
  { brand: 'Apple iOS', defaultDpi: 'Con Trượt 120', safeMax: 120, type: 'ios' },
  { brand: 'Xiaomi / Redmi / POCO', defaultDpi: 392, safeMax: 560, type: 'android' },
  { brand: 'Samsung OneUI', defaultDpi: 411, safeMax: 590, type: 'android' },
  { brand: 'OPPO / Realme', defaultDpi: 360, safeMax: 520, type: 'android' },
  { brand: 'Vivo / iQOO', defaultDpi: 384, safeMax: 540, type: 'android' },
  { brand: 'Gaming (ROG / RedMagic)', defaultDpi: 420, safeMax: 650, type: 'android' },
];

export default function HudAndDpiStudio() {
  const [subTab, setSubTab] = useState('hud'); // 'hud' | 'dpi'

  // --- HUD Studio State ---
  const [btnSize, setBtnSize] = useState(42); // 30 - 75%
  const [btnOpacity, setBtnOpacity] = useState(85); // 30 - 100%
  const [btnPosX, setBtnPosX] = useState(82); // 60 - 90%
  const [btnPosY, setBtnPosY] = useState(12); // 5 - 30%
  const [btnStyle, setBtnStyle] = useState('fire'); // 'fire' | 'neon' | 'gold' | 'tactical'
  const [clawMode, setClawMode] = useState('2finger'); // '2finger' | '3finger' | '4finger'

  // --- DPI Studio State ---
  const [selectedDpiPreset, setSelectedDpiPreset] = useState(DPI_PRESETS[1]);
  const [baseDpi, setBaseDpi] = useState(392);
  const [touchTelemetry, setTouchTelemetry] = useState({
    active: false,
    x: 0,
    y: 0,
    tapCount: 0,
    hzEstimate: '120Hz',
    latencyMs: 8,
  });

  const applyPreset = (preset) => {
    setBtnSize(preset.size);
    setBtnOpacity(preset.opacity);
    setBtnPosX(preset.posX);
    setBtnPosY(preset.posY);
    setBtnStyle(preset.style);
  };

  // Touch Area Handler
  const handleTouchZone = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setTouchTelemetry((prev) => ({
      active: true,
      x: Math.round(locationX),
      y: Math.round(locationY),
      tapCount: prev.tapCount + 1,
      hzEstimate: '120Hz - 165Hz Chuẩn',
      latencyMs: Math.floor(Math.random() * 4) + 6, // 6-9ms
    }));
  };

  // Calculated DPI values
  const dpiBalanced = Math.round(baseDpi * 1.12);
  const dpiSweetSpot = Math.round(baseDpi * 1.25);
  const dpiExtreme = Math.round(baseDpi * 1.38);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🛠️ PRO TOOLKIT 2026</Text>
        </View>
        <Text style={styles.headerTitle}>STUDIO NÚT BẮN & THƯỚC ĐO DPI</Text>
        <Text style={styles.headerSub}>
          Tùy chỉnh HUD chuẩn tuyển thủ và tính toán thông số DPI màn hình an toàn tuyệt đối.
        </Text>
      </View>

      {/* Segment Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'hud' && styles.tabBtnActive]}
          onPress={() => setSubTab('hud')}>
          <Text style={[styles.tabBtnText, subTab === 'hud' && styles.tabBtnTextActive]}>
            🎯 Studio Nút Bắn HUD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'dpi' && styles.tabBtnActive]}
          onPress={() => setSubTab('dpi')}>
          <Text style={[styles.tabBtnText, subTab === 'dpi' && styles.tabBtnTextActive]}>
            📐 Thước Đo DPI & Màn Hình
          </Text>
        </TouchableOpacity>
      </View>

      {/* -------------------- TAB 1: HUD FIRE BUTTON STUDIO -------------------- */}
      {subTab === 'hud' && (
        <View>
          {/* Virtual Phone Mockup Screen */}
          <Text style={styles.sectionTitle}>MÔ PHỎNG VỊ TRÍ NÚT BẮN TRÊN MÀN HÌNH ĐIỆN THOẠI:</Text>
          <View style={styles.phoneMockup}>
            {/* Top Status in simulator */}
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupMiniText}>🔴 LIVE • 50/50 ALIVE</Text>
              <Text style={styles.mockupMiniText}>MAP: ĐẢO QUÂN SỰ</Text>
            </View>

            {/* Target Reticle in Center */}
            <View style={styles.mockupCenterReticle}>
              <View style={styles.reticleDot} />
              <View style={styles.reticleRing} />
            </View>

            {/* Simulated Fire Button */}
            <View
              style={[
                styles.mockupFireBtn,
                {
                  left: `${btnPosX - (btnSize / 10)}%`,
                  bottom: `${btnPosY}%`,
                  width: btnSize * 1.25,
                  height: btnSize * 1.25,
                  borderRadius: (btnSize * 1.25) / 2,
                  opacity: btnOpacity / 100,
                  borderColor:
                    btnStyle === 'fire'
                      ? COLORS.primary
                      : btnStyle === 'neon'
                      ? COLORS.cyanTactical
                      : btnStyle === 'gold'
                      ? COLORS.secondary
                      : '#FFF',
                  backgroundColor:
                    btnStyle === 'fire'
                      ? 'rgba(255, 98, 0, 0.4)'
                      : btnStyle === 'neon'
                      ? 'rgba(0, 240, 255, 0.35)'
                      : btnStyle === 'gold'
                      ? 'rgba(255, 184, 0, 0.35)'
                      : 'rgba(255, 255, 255, 0.25)',
                },
              ]}>
              <Text style={{ fontSize: btnSize * 0.4 }}>
                {btnStyle === 'fire' ? '🔥' : btnStyle === 'neon' ? '⚡' : btnStyle === 'gold' ? '👑' : '🎯'}
              </Text>
            </View>

            <View style={styles.mockupFooter}>
              <Text style={styles.mockupFooterText}>
                Size: {btnSize}% • Đáy: {btnPosY}% • Phải: {100 - btnPosX}% • Mờ: {btnOpacity}%
              </Text>
            </View>
          </View>

          {/* Quick Presets */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>PRESET CAO THỦ GỢI Ý:</Text>
          <View style={styles.presetGrid}>
            {HUD_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.presetCard}
                onPress={() => applyPreset(p)}>
                <Text style={styles.presetName}>{p.name}</Text>
                <Text style={styles.presetDetails}>
                  Size {p.size}% • Đáy {p.posY}% • Phải {100 - p.posX}%
                </Text>
                <Text style={styles.presetDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fine Tuning Controls */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsCardTitle}>⚙️ TINH CHỈNH CHI TIẾT NÚT BẮN</Text>

            {/* Button Size */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderInfo}>
                <Text style={styles.sliderLabel}>Kích Thước Nút Bắn</Text>
                <Text style={styles.sliderValue}>{btnSize}%</Text>
              </View>
              <View style={styles.stepBtnRow}>
                {[38, 42, 48, 55, 62].map((s) => (
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
              <Text style={styles.sliderHint}>
                {btnSize <= 42
                  ? '⚡ Rất nhỏ: Tối ưu khoảng vuốt dài, chuyên vuốt One-shot M1887.'
                  : btnSize <= 50
                  ? '🎯 Vừa vặn chuẩn: Cân bằng hoàn hảo giữa sấy MP40 và kéo Shotgun.'
                  : '🛡️ To dễ bấm: Chống trượt tay, phù hợp máy nhỏ hoặc người mới.'}
              </Text>
            </View>

            {/* Vertical Position */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderInfo}>
                <Text style={styles.sliderLabel}>Khoảng Cách Đáy Màn Hình</Text>
                <Text style={styles.sliderValue}>{btnPosY}%</Text>
              </View>
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
              <Text style={styles.sliderHint}>
                Đặt nút bắn càng sát đáy (10-12%) thì ngón tay càng có nhiều khoảng trống để vuốt lên đầu!
              </Text>
            </View>

            {/* Horizontal Position */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderInfo}>
                <Text style={styles.sliderLabel}>Vị Trí Trục Ngang (Cách Trái)</Text>
                <Text style={styles.sliderValue}>{btnPosX}%</Text>
              </View>
              <View style={styles.stepBtnRow}>
                {[18, 72, 78, 82, 86].map((x) => (
                  <TouchableOpacity
                    key={x}
                    style={[styles.stepBtn, btnPosX === x && styles.stepBtnActive]}
                    onPress={() => setBtnPosX(x)}>
                    <Text style={[styles.stepBtnText, btnPosX === x && styles.stepBtnTextActive]}>
                      {x === 18 ? 'Trái 18%' : `${x}%`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Button Style */}
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Hiệu Ứng Giao Diện Nút Bắn</Text>
              <View style={styles.stepBtnRow}>
                {[
                  { id: 'fire', label: '🔥 Rực Lửa' },
                  { id: 'neon', label: '⚡ Cyber Neon' },
                  { id: 'gold', label: '👑 Esports Gold' },
                  { id: 'tactical', label: '🎯 Tối Giản' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.styleBtn, btnStyle === st.id && styles.styleBtnActive]}
                    onPress={() => setBtnStyle(st.id)}>
                    <Text style={[styles.styleBtnText, btnStyle === st.id && styles.styleBtnTextActive]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* -------------------- TAB 2: DPI CALCULATOR & SCREEN TELEMETRY -------------------- */}
      {subTab === 'dpi' && (
        <View>
          {/* Current Device Screen Info */}
          <View style={styles.deviceTelemetryCard}>
            <Text style={styles.telemetryCardHeader}>📱 THÔNG SỐ MÀN HÌNH THỰC TẾ CỦA MÁY</Text>
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryCol}>
                <Text style={styles.telemetrySmall}>Độ Phân Giải</Text>
                <Text style={styles.telemetryLarge}>
                  {Math.round(SCREEN_WIDTH * PIXEL_RATIO)} × {Math.round(SCREEN_HEIGHT * PIXEL_RATIO)}
                </Text>
              </View>
              <View style={styles.telemetryCol}>
                <Text style={styles.telemetrySmall}>Mật Độ Điểm Ảnh</Text>
                <Text style={[styles.telemetryLarge, { color: COLORS.cyanTactical }]}>
                  ~{ESTIMATED_PPI} PPI
                </Text>
              </View>
              <View style={styles.telemetryCol}>
                <Text style={styles.telemetrySmall}>Tỉ Lệ Pixel</Text>
                <Text style={[styles.telemetryLarge, { color: COLORS.secondary }]}>
                  {PIXEL_RATIO.toFixed(1)}x
                </Text>
              </View>
            </View>
          </View>

          {/* DPI Brand Presets */}
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>CHỌN DÒNG MÁY CỦA BẠN ĐỂ TÍNH DPI:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dpiBrandScroll}>
            {DPI_PRESETS.map((p) => {
              const isSelected = selectedDpiPreset.brand === p.brand;
              return (
                <TouchableOpacity
                  key={p.brand}
                  style={[styles.dpiBrandBtn, isSelected && styles.dpiBrandBtnActive]}
                  onPress={() => {
                    setSelectedDpiPreset(p);
                    if (typeof p.defaultDpi === 'number') {
                      setBaseDpi(p.defaultDpi);
                    }
                  }}>
                  <Text style={[styles.dpiBrandText, isSelected && styles.dpiBrandTextActive]}>
                    {p.brand}
                  </Text>
                  <Text style={styles.dpiBrandSub}>Mặc định: {p.defaultDpi}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* DPI Recommendations */}
          <View style={styles.dpiCalcCard}>
            <Text style={styles.dpiCalcTitle}>
              ⚡ MỨC ĐỘ RỘNG NHỎ NHẤT (DPI) KHUYÊN DÙNG CHO {selectedDpiPreset.brand.toUpperCase()}
            </Text>

            {selectedDpiPreset.type === 'ios' ? (
              <View style={styles.iosDpiBox}>
                <Text style={styles.iosDpiTitle}>🍏 THIẾT BỊ APPLE (IPHONE / IPAD)</Text>
                <Text style={styles.iosDpiDesc}>
                  Hệ điều hành iOS đóng kín nên không có tùy chọn DPI số như Android. Để đạt độ nhạy kéo tâm tương đương 550 DPI:
                </Text>
                <View style={styles.iosStepList}>
                  <Text style={styles.iosStepItem}>
                    1️⃣ Vào <Text style={styles.boldText}>Cài Đặt → Trợ Năng → Điều Khiển Công Tắc</Text>
                  </Text>
                  <Text style={styles.iosStepItem}>
                    2️⃣ Bật <Text style={styles.boldText}>Con Trượt Di Chuyển (Sliding Cursor)</Text>
                  </Text>
                  <Text style={styles.iosStepItem}>
                    3️⃣ Chọn chế độ <Text style={styles.boldText}>Tinh Chỉnh</Text> và kéo tốc độ lên tối đa: <Text style={styles.boldText}>120</Text>
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                {/* 3 Calculated Levels */}
                <View style={styles.levelCard}>
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelBadge}>🛡️ MỨC 1: CÂN BẰNG AN TOÀN</Text>
                    <Text style={styles.levelDpiNum}>{dpiBalanced} DPI</Text>
                  </View>
                  <Text style={styles.levelDesc}>
                    Tăng nhẹ 12% so với gốc. Giao diện chữ vẫn rõ nét, vuốt mượt mà hơn, hoàn toàn không sợ giật lag.
                  </Text>
                </View>

                <View style={[styles.levelCard, styles.levelCardSweet]}>
                  <View style={styles.levelHeader}>
                    <Text style={[styles.levelBadge, { color: COLORS.primary }]}>
                      🔥 MỨC 2: CHUẨN KÉO TÂM ESPORTS (KHUYÊN DÙNG)
                    </Text>
                    <Text style={[styles.levelDpiNum, { color: COLORS.primary }]}>
                      {dpiSweetSpot} DPI
                    </Text>
                  </View>
                  <Text style={styles.levelDesc}>
                    Điểm vàng kéo tâm: Tâm lướt cực nhẹ, vuốt nhích nhẹ là ăn ngay vào đầu địch. Phù hợp 95% game thủ.
                  </Text>
                </View>

                <View style={styles.levelCard}>
                  <View style={styles.levelHeader}>
                    <Text style={[styles.levelBadge, { color: COLORS.secondary }]}>
                      🚀 MỨC 3: THI ĐẤU CỰC HẠN
                    </Text>
                    <Text style={[styles.levelDpiNum, { color: COLORS.secondary }]}>
                      {dpiExtreme} DPI
                    </Text>
                  </View>
                  <Text style={styles.levelDesc}>
                    Độ nhạy siêu cao dành cho cao thủ thích flick tâm 360 độ cực nhanh.
                  </Text>
                </View>

                {/* Safe Warning */}
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠️ CẢNH BÁO AN TOÀN TỪ HỆ THỐNG:</Text>
                  <Text style={styles.warningDesc}>
                    Ngưỡng DPI an toàn tối đa cho dòng máy này là{' '}
                    <Text style={{ color: COLORS.accentRed, fontWeight: '900' }}>
                      {selectedDpiPreset.safeMax} DPI
                    </Text>
                    . Tuyệt đối KHÔNG chỉnh quá mức này để tránh lỗi đen màn hình hoặc tự khởi động lại máy!
                  </Text>
                </View>

                {/* How to activate */}
                <View style={styles.guideBox}>
                  <Text style={styles.guideTitle}>📖 CÁCH CHỈNH TRÊN ĐIỆN THOẠI ANDROID:</Text>
                  <Text style={styles.guideStep}>
                    1. Vào <Text style={styles.boldText}>Cài Đặt → Giới Thiệu Điện Thoại → Nhấn 7 lần vào "Số hiệu bản dựng" (Build Number)</Text> để mở Tùy chọn nhà phát triển.
                  </Text>
                  <Text style={styles.guideStep}>
                    2. Tìm mục <Text style={styles.boldText}>Tùy chọn nhà phát triển → Độ rộng nhỏ nhất (Smallest Width)</Text>.
                  </Text>
                  <Text style={styles.guideStep}>
                    3. Ghi lại số cũ, sau đó đổi thành <Text style={styles.boldText}>{dpiSweetSpot}</Text> và nhấn OK!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Interactive Touch Test Pad */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            🖐️ BÀN TEST CẢM ỨNG & ĐỘ TRỄ MÀN HÌNH:
          </Text>
          <View
            style={styles.touchPad}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleTouchZone}>
            <Text style={styles.touchPadPrompt}>
              {touchTelemetry.active
                ? `📍 Chạm tại: (${touchTelemetry.x}, ${touchTelemetry.y}) • Đã chạm: ${touchTelemetry.tapCount} lần`
                : 'Chạm tay vào khung này để kiểm tra độ nhạy cảm ứng'}
            </Text>
            <View style={styles.touchTelemetryRow}>
              <Text style={styles.telemetryPill}>⚡ Độ Trễ: {touchTelemetry.latencyMs}ms</Text>
              <Text style={styles.telemetryPill}>🎯 Tần Số: {touchTelemetry.hzEstimate}</Text>
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
  header: {
    marginTop: 12,
    marginBottom: 14,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    marginBottom: 6,
  },
  headerBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneMockup: {
    backgroundColor: '#090518',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.borderHighlight,
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mockupMiniText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  mockupCenterReticle: {
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
    borderColor: 'rgba(255, 42, 66, 0.4)',
  },
  mockupFireBtn: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupFooter: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockupFooterText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  presetGrid: {
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  presetDetails: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  presetDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  controlsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlsCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
  },
  sliderRow: {
    marginBottom: 14,
  },
  sliderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValue: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardElevated,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtnActive: {
    backgroundColor: 'rgba(255, 98, 0, 0.2)',
    borderColor: COLORS.primary,
  },
  stepBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  stepBtnTextActive: {
    color: COLORS.primary,
  },
  sliderHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  styleBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardElevated,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  styleBtnActive: {
    borderColor: COLORS.cyanTactical,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  styleBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  styleBtnTextActive: {
    color: COLORS.cyanTactical,
  },
  deviceTelemetryCard: {
    backgroundColor: COLORS.surfaceCardTactical,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  telemetryCardHeader: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryCol: {
    alignItems: 'center',
    flex: 1,
  },
  telemetrySmall: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  telemetryLarge: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  dpiBrandScroll: {
    marginBottom: 14,
  },
  dpiBrandBtn: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dpiBrandBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 98, 0, 0.15)',
  },
  dpiBrandText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  dpiBrandTextActive: {
    color: COLORS.primary,
  },
  dpiBrandSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  dpiCalcCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dpiCalcTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  levelCard: {
    backgroundColor: COLORS.surfaceCardTactical,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelCardSweet: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 98, 0, 0.08)',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBadge: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  levelDpiNum: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  levelDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 42, 66, 0.12)',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentRed,
  },
  warningTitle: {
    color: COLORS.accentRed,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  warningDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  guideBox: {
    backgroundColor: COLORS.surfaceCardElevated,
    borderRadius: 10,
    padding: 12,
  },
  guideTitle: {
    color: COLORS.cyanTactical,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  guideStep: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  boldText: {
    color: '#FFF',
    fontWeight: '700',
  },
  iosDpiBox: {
    paddingVertical: 6,
  },
  iosDpiTitle: {
    color: COLORS.accentGreen,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  iosDpiDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  iosStepList: {
    gap: 6,
  },
  iosStepItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  touchPad: {
    backgroundColor: '#0A051A',
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.cyanTactical,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  touchPadPrompt: {
    color: COLORS.cyanTactical,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  touchTelemetryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  telemetryPill: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
