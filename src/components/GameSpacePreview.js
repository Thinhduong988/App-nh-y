import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS, getAccentTheme } from '../theme/colors';

const PERF_MODES = {
  ECO: {
    id: 'ECO',
    label: 'Tiết kiệm pin',
    cpu: '1.42 GHz',
    fps: '60',
    gpu: '148 MHz',
    status: 'Ổn định • Giảm nhiệt',
    battery: '7.4 h',
    temp: '33°C',
  },
  BALANCED: {
    id: 'BALANCED',
    label: 'Cân bằng',
    cpu: '1.84 GHz',
    fps: '90',
    gpu: '190 MHz',
    status: 'Mượt ổn định',
    battery: '6.2 h',
    temp: '35°C',
  },
  MONSTER: {
    id: 'MONSTER',
    label: 'MONSTER',
    cpu: '2.09 GHz',
    fps: '120',
    gpu: '222 MHz',
    status: 'Mượt tuyệt đối',
    battery: '5.6 h',
    temp: '36°C',
  },
};

const GLASS_LEVELS = [
  { id: '20', label: '20% Siêu trong', bgAlpha: 0.72 },
  { id: '40', label: '40% Kính mờ', bgAlpha: 0.86 },
  { id: '70', label: '70% Nhám đậm', bgAlpha: 0.96 },
];

export default function GameSpacePreview({
  onBack,
  onOpenTrainer,
  onActivateNativeOverlay,
  hasNativeOverlay = false,
  accentId = 'orange',
}) {
  const accent = getAccentTheme(accentId);
  const [activeSubTab, setActiveSubTab] = useState('PERF'); // PERF | CHIP_Q | TOOLS | GAMECENTER
  const [perfMode, setPerfMode] = useState('MONSTER');
  const [glassLevel, setGlassLevel] = useState('40');
  const [touchBoost, setTouchBoost] = useState(true);
  const [crosshairAssist, setCrosshairAssist] = useState(false);

  const telemetry = PERF_MODES[perfMode];
  const activeGlass = GLASS_LEVELS.find((g) => g.id === glassLevel) || GLASS_LEVELS[1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Top Header matching Figma "Novo Game Space / iOS in-app preview" */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.headerTitle}>Game Space • Bản xem trước trong ứng dụng</Text>
            <Text style={styles.headerSub}>
              {Platform.OS === 'ios' || !hasNativeOverlay
                ? 'iOS không hỗ trợ menu nổi tùy ý trên Free Fire. Các số liệu bên dưới là minh họa.'
                : 'Xem trước giao diện Novo Game Space. Bạn có thể bật Overlay thật trên Android ở bên dưới.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.backPillBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backPillBtnText}>Về ứng dụng</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.segmentRow}>
          {[
            { id: 'PERF', label: 'Hiệu suất' },
            { id: 'CHIP_Q', label: 'Chip Q' },
            { id: 'TOOLS', label: 'Công cụ' },
            { id: 'GAMECENTER', label: 'GameCenter' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.segmentBtn,
                  isActive && { backgroundColor: COLORS.glassCardBright, borderColor: accent.border },
                ]}
                onPress={() => setActiveSubTab(tab.id)}>
                <Text style={[styles.segmentBtnText, isActive && { color: COLORS.text }]}>
                  {isActive ? `${tab.label} ✓` : tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Preview Card with Adjustable Glass Opacity */}
      <View
        style={[
          styles.previewShell,
          { backgroundColor: `rgba(17, 22, 34, ${activeGlass.bgAlpha})` },
        ]}>
        {/* Telemetry Summary */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetryTitle}>Hiệu suất • DEMO</Text>
            <View style={[styles.demoPill, { backgroundColor: accent.light, borderColor: accent.border }]}>
              <Text style={[styles.demoPillText, { color: accent.bright }]}>
                {Platform.OS === 'ios' ? 'iOS PREVIEW' : 'PREVIEW'}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>CPU</Text>
            <Text style={[styles.metricValue, { color: COLORS.accentCyan }]}>{telemetry.cpu}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>FPS LIVE</Text>
            <Text style={[styles.metricValue, { color: COLORS.accentGreen }]}>{telemetry.fps}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>GPU</Text>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>{telemetry.gpu}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.statusLine, { color: COLORS.accentGreen }]}>• {telemetry.status}</Text>
          <Text style={styles.metaLine}>• Thời lượng chơi: {telemetry.battery}</Text>
          <Text style={styles.metaLine}>• Pin: 73% (Nhiệt: {telemetry.temp})</Text>

          <View style={styles.hudMiniStrip}>
            <Text style={styles.hudMiniTitle}>BẢN ĐỒ QUÂN SỰ</Text>
            <Text style={styles.hudMiniSub}>5 / 20 • AWM Sniper • Thay đạn nhanh ★ HP 200 / 200</Text>
          </View>
        </View>

        {/* Sub-tab Interactive Panel */}
        {activeSubTab === 'PERF' && (
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>Chế độ hiệu suất - DEMO</Text>
            <View style={styles.modeRow}>
              {Object.values(PERF_MODES).map((mode) => {
                const isSelected = perfMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeBtn,
                      isSelected && { backgroundColor: COLORS.glassCardBright, borderColor: accent.primary },
                    ]}
                    onPress={() => setPerfMode(mode.id)}>
                    <Text style={[styles.modeBtnText, isSelected && { color: COLORS.text, fontWeight: '800' }]}>
                      {mode.label}{isSelected ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.platformCaption}>
              MAX 🔥 • Không thay đổi hiệu suất CPU/GPU của ứng dụng khác trên iOS.
            </Text>

            <Text style={[styles.controlTitle, { marginTop: 18 }]}>
              Độ mờ kính nổi (xuyên thấu màn hình game)
            </Text>
            <Text style={styles.controlSub}>
              Mô phỏng trong ứng dụng, không hiển thị trên Free Fire.
            </Text>
            <View style={styles.modeRow}>
              {GLASS_LEVELS.map((lvl) => {
                const isSelected = glassLevel === lvl.id;
                return (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[
                      styles.modeBtn,
                      isSelected && { backgroundColor: COLORS.glassCardBright, borderColor: accent.primary },
                    ]}
                    onPress={() => setGlassLevel(lvl.id)}>
                    <Text style={[styles.modeBtnText, isSelected && { color: COLORS.text, fontWeight: '800' }]}>
                      {lvl.label}{isSelected ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.platformCaption}>
              Giữ nền đục khi bật ở độ trong suốt cao để bảo đảm độ tương phản.
            </Text>
          </View>
        )}

        {activeSubTab === 'CHIP_Q' && (
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>Phản hồi cảm ứng • DEMO</Text>
            <Text style={styles.controlSub}>
              Minh họa cấu hình độ nhạy phản hồi chạm (Touch Sampling) cho phòng luyện tập trong app.
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleCard,
                touchBoost && { borderColor: accent.border, backgroundColor: accent.light },
              ]}
              onPress={() => setTouchBoost(!touchBoost)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleCardTitle}>Bù ma sát màn hình (Touch Response)</Text>
                <Text style={styles.toggleCardSub}>Áp dụng trong mô phỏng kéo tâm nội bộ</Text>
              </View>
              <Text style={[styles.toggleState, { color: touchBoost ? accent.bright : COLORS.textMuted }]}>
                {touchBoost ? 'BẬT' : 'TẮT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSubTab === 'TOOLS' && (
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>Công cụ hỗ trợ trong ứng dụng</Text>
            <TouchableOpacity
              style={[
                styles.toggleCard,
                crosshairAssist && { borderColor: accent.border, backgroundColor: accent.light },
              ]}
              onPress={() => setCrosshairAssist(!crosshairAssist)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleCardTitle}>🎯 Tâm ảo phòng tập (Fix lệch D-Pad)</Text>
                <Text style={styles.toggleCardSub}>Chỉ hiển thị trong Phòng Luyện Kéo Tâm</Text>
              </View>
              <Text style={[styles.toggleState, { color: crosshairAssist ? accent.bright : COLORS.textMuted }]}>
                {crosshairAssist ? 'BẬT' : 'TẮT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSubTab === 'GAMECENTER' && (
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>Giới hạn nền tảng iOS</Text>
            <Text style={styles.controlSub}>
              Apple App Review 2.5.1 không cho phép ứng dụng tạo lớp phủ nổi (overlay) lên trên Free Fire, dọn RAM ứng dụng khác hoặc chỉnh DPI hệ thống. Bạn có thể dùng Phòng Luyện Kéo Tâm & HUD ngay trong ứng dụng.
            </Text>
          </View>
        )}

        {hasNativeOverlay && onActivateNativeOverlay && (
          <TouchableOpacity
            style={[styles.secondaryCta, { borderColor: accent.border, backgroundColor: accent.light }]}
            onPress={onActivateNativeOverlay}
            activeOpacity={0.85}>
            <Text style={[styles.secondaryCtaText, { color: accent.bright }]}>
              ⚡ Bật GG Game Space Nổi Trên Android →
            </Text>
          </TouchableOpacity>
        )}

        {onOpenTrainer && (
          <TouchableOpacity
            style={[styles.primaryCta, { backgroundColor: accent.primary }]}
            onPress={onOpenTrainer}
            activeOpacity={0.85}>
            <Text style={[styles.primaryCtaText, { color: accent.textOnPrimary }]}>
              🎯 Mở Phòng Luyện Kéo Tâm & HUD →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footerDisclaimer}>
        Bản minh họa giao diện • Không thu thập số liệu thực từ Free Fire
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  backPillBtn: {
    backgroundColor: COLORS.glassCardElevated,
    borderRadius: COLORS.rounded.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  backPillBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  segmentBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  previewShell: {
    borderRadius: COLORS.rounded.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  telemetryCard: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  telemetryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  demoPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  metricName: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 10,
  },
  statusLine: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaLine: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 3,
  },
  hudMiniStrip: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  hudMiniTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  hudMiniSub: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  controlSection: {
    marginBottom: 16,
  },
  controlTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  controlSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minHeight: 44,
  },
  modeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  platformCaption: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minHeight: 56,
  },
  toggleCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleCardSub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  toggleState: {
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
  },
  secondaryCta: {
    borderRadius: COLORS.rounded.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1,
    marginBottom: 10,
  },
  secondaryCtaText: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryCta: {
    borderRadius: COLORS.rounded.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerDisclaimer: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
