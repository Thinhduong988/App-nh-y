import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEAPONS = [
  {
    id: 'shotgun',
    name: 'Shotgun (M1887 / M1014)',
    icon: '💥',
    desc: 'Cần vuốt dứt khoát hoặc móc chữ J nhanh',
    idealSpeed: [1100, 2400],
    idealDistance: [90, 210],
    damage: 288,
  },
  {
    id: 'smg',
    name: 'SMG (MP40 / UMP)',
    icon: '⚡',
    desc: 'Kéo thẳng tốc độ cao, nhịp đều',
    idealSpeed: [850, 1850],
    idealDistance: [75, 175],
    damage: 168,
  },
  {
    id: 'rifle',
    name: 'Súng Trường (AK / SCAR)',
    icon: '🎯',
    desc: 'Vuốt êm, ghìm tâm giữ cự ly vừa & xa',
    idealSpeed: [600, 1400],
    idealDistance: [55, 140],
    damage: 132,
  },
];

export default function AimTrainer({ onApplyToGenerator }) {
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [gameMode, setGameMode] = useState('practice'); // 'practice' | 'challenge'
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    shots: 0,
    headshots: 0,
    bodyshots: 0,
    misses: 0,
    streak: 0,
    maxStreak: 0,
    lastSpeed: 0,
    lastDistance: 0,
    lastTimeMs: 0,
  });

  // Feedback State
  const [lastFeedback, setLastFeedback] = useState(null); // { type: 'HEAD'|'BODY'|'MISS', text: '', damage: 0, advice: '' }

  // Drag Gesture State
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [currentDragVector, setCurrentDragVector] = useState({ dx: 0, dy: 0, active: false });

  // Animations
  const damageAnim = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const targetColorFlash = useRef(new Animated.Value(0)).current;

  // Challenge Mode Timer
  useEffect(() => {
    let timer;
    if (isPlaying && gameMode === 'challenge' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, gameMode, timeLeft]);

  const handleStartChallenge = () => {
    setTimeLeft(30);
    setStats({
      shots: 0,
      headshots: 0,
      bodyshots: 0,
      misses: 0,
      streak: 0,
      maxStreak: 0,
      lastSpeed: 0,
      lastDistance: 0,
      lastTimeMs: 0,
    });
    setLastFeedback(null);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeLeft(30);
    setStats({
      shots: 0,
      headshots: 0,
      bodyshots: 0,
      misses: 0,
      streak: 0,
      maxStreak: 0,
      lastSpeed: 0,
      lastDistance: 0,
      lastTimeMs: 0,
    });
    setLastFeedback(null);
  };

  // Touch handlers on the Fire Button
  const handleTouchStart = (e) => {
    if (gameMode === 'challenge' && !isPlaying) {
      setIsPlaying(true);
    }
    const touch = e.nativeEvent;
    dragStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    setCurrentDragVector({ dx: 0, dy: 0, active: true });
  };

  const handleTouchMove = (e) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setCurrentDragVector({ dx, dy, active: true });
  };

  const handleTouchEnd = (e) => {
    const touch = e.nativeEvent;
    const endTime = Date.now();
    const duration = Math.max(35, endTime - dragStartRef.current.time);
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setCurrentDragVector({ dx: 0, dy: 0, active: false });

    // Since pulling up to the head means moving towards the top of screen, dy is negative.
    const dragDistance = Math.max(0, -dy);
    const speed = Math.round((dragDistance / duration) * 1000); // px/sec

    evaluateDrag(dragDistance, speed, duration, dx);
  };

  const evaluateDrag = (distance, speed, duration, dx) => {
    const [minSpeed, maxSpeed] = selectedWeapon.idealSpeed;
    const [minDist, maxDist] = selectedWeapon.idealDistance;

    let resultType = 'BODY';
    let damage = 45;
    let feedbackTitle = '🟡 GHIM NGỰC';
    let advice = 'Lực kéo còn yếu hoặc quá chậm. Cần vuốt nhanh & dứt khoát hơn!';

    // Evaluation logic
    if (distance < 30 || speed < 350) {
      // Too short / barely dragged
      resultType = 'BODY';
      damage = 38;
      feedbackTitle = '🟡 GHIM NGỰC (TÂM NẰM DƯỚI)';
      advice = 'Tâm dính chặt ở ngực địch! Hãy tăng tốc độ vuốt ngón tay lên.';
    } else if (distance > maxDist * 1.35 || speed > maxSpeed * 1.3) {
      // Over-drag: went over the head
      resultType = 'MISS';
      damage = 0;
      feedbackTitle = '⚪ VỌT QUA ĐẦU (TRƯỢT)';
      advice = 'Lực kéo quá trớn bay lên trời! Hãy kéo êm hơn hoặc giảm độ nhạy nhìn xung quanh.';
    } else if (
      distance >= minDist * 0.85 &&
      distance <= maxDist * 1.2 &&
      speed >= minSpeed * 0.85 &&
      speed <= maxSpeed * 1.2
    ) {
      // Sweet Spot -> HEADSHOT!
      resultType = 'HEAD';
      damage = selectedWeapon.damage;
      feedbackTitle = '🔴 HEADSHOT ĐỎ CHÓI (100% ĐẦU)';
      advice = 'Hoàn hảo! Tốc độ vuốt và điểm dừng đạt chuẩn tuyển thủ Esports.';
    } else if (distance < minDist) {
      resultType = 'BODY';
      damage = 52;
      feedbackTitle = '🟡 GHIM CỔ / NGỰC TRÊN';
      advice = 'Gần tới đầu rồi! Vuốt thêm một khoảng ngắn nữa là dính trọn đầu.';
    } else {
      resultType = 'MISS';
      damage = 0;
      feedbackTitle = '⚪ TRƯỢT LỆCH TÂM';
      advice = 'Đường vuốt bị lệch khỏi trục ngắm. Chú ý hướng vuốt thẳng lên đỉnh đầu.';
    }

    // Trigger Animations
    damageAnim.setValue(0);
    Animated.spring(damageAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    if (resultType === 'HEAD') {
      Animated.sequence([
        Animated.timing(targetScale, { toValue: 1.2, duration: 80, useNativeDriver: true }),
        Animated.spring(targetScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }

    // Update Statistics
    setStats((prev) => {
      const isHead = resultType === 'HEAD';
      const isBody = resultType === 'BODY';
      const isMiss = resultType === 'MISS';
      const currentStreak = isHead ? prev.streak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, currentStreak);

      return {
        shots: prev.shots + 1,
        headshots: prev.headshots + (isHead ? 1 : 0),
        bodyshots: prev.bodyshots + (isBody ? 1 : 0),
        misses: prev.misses + (isMiss ? 1 : 0),
        streak: currentStreak,
        maxStreak: newMaxStreak,
        lastSpeed: speed,
        lastDistance: Math.round(distance),
        lastTimeMs: duration,
      };
    });

    setLastFeedback({
      type: resultType,
      title: feedbackTitle,
      damage,
      advice,
      speed,
      distance: Math.round(distance),
      duration,
    });
  };

  const headshotRate = stats.shots > 0 ? Math.round((stats.headshots / stats.shots) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTag}>
          <Text style={styles.headerTagText}>🎯 AIM TRAINER ESPORTS 2026</Text>
        </View>
        <Text style={styles.headerTitle}>GIẢ LẬP LUYỆN TẬP KÉO TÂM</Text>
        <Text style={styles.headerSub}>
          Mô phỏng cảm biến chạm thực tế: Đo hành trình vuốt, tốc độ và phân tích độ chuẩn xác Headshot.
        </Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, gameMode === 'practice' && styles.modeBtnActive]}
          onPress={() => {
            setGameMode('practice');
            setIsPlaying(false);
          }}>
          <Text style={[styles.modeBtnText, gameMode === 'practice' && styles.modeBtnTextActive]}>
            🥋 Luyện Tự Do
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, gameMode === 'challenge' && styles.modeBtnActive]}
          onPress={() => {
            setGameMode('challenge');
            handleStartChallenge();
          }}>
          <Text style={[styles.modeBtnText, gameMode === 'challenge' && styles.modeBtnTextActive]}>
            ⏱️ Thử Thách 30s {gameMode === 'challenge' && `(${timeLeft}s)`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weapon Selector */}
      <Text style={styles.sectionLabel}>CHỌN VŨ KHÍ LUYỆN TẬP:</Text>
      <View style={styles.weaponRow}>
        {WEAPONS.map((w) => {
          const isSelected = selectedWeapon.id === w.id;
          return (
            <TouchableOpacity
              key={w.id}
              style={[styles.weaponCard, isSelected && styles.weaponCardActive]}
              onPress={() => setSelectedWeapon(w)}>
              <Text style={styles.weaponIcon}>{w.icon}</Text>
              <Text style={[styles.weaponName, isSelected && styles.weaponNameActive]}>{w.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.weaponDescText}>💡 {selectedWeapon.desc}</Text>

      {/* Interactive Combat Field */}
      <View style={styles.combatArena}>
        {/* Enemy Dummy Target */}
        <Animated.View
          style={[
            styles.targetContainer,
            {
              transform: [{ scale: targetScale }],
            },
          ]}>
          <View
            style={[
              styles.targetHead,
              lastFeedback?.type === 'HEAD' && styles.targetHeadHit,
            ]}>
            <Text style={styles.headIcon}>💀</Text>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
          </View>
          <View style={styles.targetNeck} />
          <View
            style={[
              styles.targetBody,
              lastFeedback?.type === 'BODY' && styles.targetBodyHit,
            ]}>
            <Text style={styles.bodyArmorIcon}>🛡️</Text>
          </View>
        </Animated.View>

        {/* Floating Damage Popup */}
        {lastFeedback && (
          <Animated.View
            style={[
              styles.damagePopup,
              {
                opacity: damageAnim,
                transform: [
                  {
                    translateY: damageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -35],
                    }),
                  },
                ],
              },
            ]}>
            <Text
              style={[
                styles.damageNumber,
                lastFeedback.type === 'HEAD' && styles.damageHead,
                lastFeedback.type === 'BODY' && styles.damageBody,
                lastFeedback.type === 'MISS' && styles.damageMiss,
              ]}>
              {lastFeedback.damage > 0 ? `-${lastFeedback.damage}` : 'MISS'}
            </Text>
            <Text style={styles.damageTypeBadge}>{lastFeedback.title}</Text>
          </Animated.View>
        )}

        {/* Live Drag Trail Indicator */}
        {currentDragVector.active && (
          <View
            style={[
              styles.dragIndicatorLine,
              {
                height: Math.min(180, Math.max(10, -currentDragVector.dy)),
                transform: [
                  {
                    rotate: `${Math.round((currentDragVector.dx / (Math.abs(currentDragVector.dy) || 1)) * 30)}deg`,
                  },
                ],
              },
            ]}
          />
        )}

        {/* Interactive Fire Button Area */}
        <View style={styles.fireAreaContainer}>
          <Text style={styles.firePrompt}>
            👇 Đặt ngón tay vào nút và VUỐT NHANH LÊN ĐẦU
          </Text>

          <View
            style={styles.fireButtonTouchable}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}>
            <View style={styles.fireButtonOuter}>
              <View style={styles.fireButtonInner}>
                <Text style={styles.fireButtonIcon}>🔥</Text>
                <Text style={styles.fireButtonLabel}>BẮN</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Telemetry & Analysis Panel */}
      {lastFeedback && (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>📊 PHÂN TÍCH LỰC VUỐT VỪA THỰC HIỆN</Text>
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Tốc Độ Vuốt</Text>
              <Text style={[styles.telemetryValue, { color: COLORS.cyanTactical }]}>
                {lastFeedback.speed} px/s
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Độ Dài Vuốt</Text>
              <Text style={[styles.telemetryValue, { color: COLORS.secondary }]}>
                {lastFeedback.distance} px
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>Thời Gian Kéo</Text>
              <Text style={[styles.telemetryValue, { color: COLORS.plasmaPurple }]}>
                {lastFeedback.duration} ms
              </Text>
            </View>
          </View>

          <View style={styles.adviceBox}>
            <Text style={styles.adviceIcon}>💡</Text>
            <Text style={styles.adviceText}>{lastFeedback.advice}</Text>
          </View>
        </View>
      )}

      {/* Live Stats Scoreboard */}
      <View style={styles.statsBoard}>
        <View style={styles.statCol}>
          <Text style={styles.statBigNum}>{stats.shots}</Text>
          <Text style={styles.statSubText}>Lượt Bắn</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statBigNum, { color: COLORS.accentRed }]}>{headshotRate}%</Text>
          <Text style={styles.statSubText}>Tỉ Lệ Đỏ</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statBigNum, { color: COLORS.secondary }]}>{stats.streak}</Text>
          <Text style={styles.statSubText}>Combo Đỏ</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statBigNum, { color: COLORS.accentGreen }]}>{stats.maxStreak}</Text>
          <Text style={styles.statSubText}>Kỷ Lục</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🔄 Làm Mới Thống Kê</Text>
        </TouchableOpacity>

        {onApplyToGenerator && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => {
              // Map speed to generator drag force
              let force = 'Vuốt Vừa (Chuẩn)';
              if (stats.lastSpeed > 1700) force = 'Vuốt Nhanh / Mạnh (One-Shot)';
              else if (stats.lastSpeed < 800) force = 'Vuốt Nhẹ / Chậm (Ghim Cận Chiến)';
              onApplyToGenerator(force);
            }}>
            <Text style={styles.applyBtnText}>⚡ Đưa Lực Vào Bộ Tạo 5D →</Text>
          </TouchableOpacity>
        )}
      </View>

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
  headerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 98, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 6,
  },
  headerTagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255, 98, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  modeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: COLORS.primary,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  weaponRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  weaponCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weaponCardActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: COLORS.cyanTactical,
  },
  weaponIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  weaponName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  weaponNameActive: {
    color: COLORS.cyanTactical,
  },
  weaponDescText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  combatArena: {
    backgroundColor: '#0C071E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    height: 380,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  targetContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  targetHead: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#251545',
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetHeadHit: {
    backgroundColor: 'rgba(255, 42, 66, 0.5)',
    borderColor: '#FFF',
    borderWidth: 3,
  },
  crosshairH: {
    position: 'absolute',
    width: 76,
    height: 1,
    backgroundColor: 'rgba(255, 42, 66, 0.6)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 76,
    backgroundColor: 'rgba(255, 42, 66, 0.6)',
  },
  headIcon: {
    fontSize: 26,
  },
  targetNeck: {
    width: 14,
    height: 8,
    backgroundColor: '#1E1038',
  },
  targetBody: {
    width: 110,
    height: 74,
    backgroundColor: '#1C1033',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBodyHit: {
    backgroundColor: 'rgba(255, 184, 0, 0.4)',
    borderColor: COLORS.secondary,
  },
  bodyArmorIcon: {
    fontSize: 22,
  },
  damagePopup: {
    position: 'absolute',
    top: 30,
    alignItems: 'center',
    zIndex: 99,
  },
  damageNumber: {
    fontSize: 34,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
  damageHead: {
    color: '#FF2A42',
  },
  damageBody: {
    color: '#FFB800',
  },
  damageMiss: {
    color: '#FFFFFF',
  },
  damageTypeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  dragIndicatorLine: {
    position: 'absolute',
    bottom: 95,
    width: 4,
    backgroundColor: COLORS.cyanTactical,
    borderRadius: 2,
    shadowColor: COLORS.cyanTactical,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  fireAreaContainer: {
    alignItems: 'center',
    width: '100%',
  },
  firePrompt: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  fireButtonTouchable: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 98, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  fireButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonIcon: {
    fontSize: 22,
  },
  fireButtonLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -2,
  },
  analysisCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  analysisTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  telemetryItem: {
    alignItems: 'center',
    flex: 1,
  },
  telemetryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  telemetryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  adviceBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.plasmaPurple,
  },
  adviceIcon: {
    fontSize: 18,
  },
  adviceText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  statsBoard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCardTactical,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statBigNum: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1.3,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
