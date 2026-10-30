import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from '../theme/colors';
import { SOUNDS } from '../utils/soundEffects';

const WEAPONS = [
  {
    id: 'shotgun',
    name: 'Shotgun (M1887 / M1014)',
    icon: '💥',
    desc: 'Giật tức thì cực mạnh, cần vuốt móc chữ J dứt khoát lên đầu',
    idealSpeed: [1200, 2400],
    idealDistance: [90, 210],
    damage: 288,
    recoilKick: 38,
    spread: 32,
  },
  {
    id: 'smg',
    name: 'SMG (MP40 / UMP)',
    icon: '⚡',
    desc: 'Sấy tốc độ cao 18v/s, tâm giật leo dốc cần kéo thẳng ghìm đều tay',
    idealSpeed: [900, 1900],
    idealDistance: [80, 180],
    damage: 168,
    recoilKick: 22,
    spread: 20,
  },
  {
    id: 'rifle',
    name: 'Súng Trường (AK47 / SCAR)',
    icon: '🎯',
    desc: 'Giật dọc lớn, cần vuốt êm ghìm tâm giữ cự ly tầm trung & xa',
    idealSpeed: [650, 1450],
    idealDistance: [60, 150],
    damage: 142,
    recoilKick: 28,
    spread: 24,
  },
  {
    id: 'sniper',
    name: 'Trường Tầm Xa (AWM / Woodpecker)',
    icon: '🔭',
    desc: 'Uy lực 1 viên chết ngay, flick tâm dứt khoát vào đầu rồi delay nạp đạn',
    idealSpeed: [1000, 2200],
    idealDistance: [70, 170],
    damage: 300,
    recoilKick: 45,
    spread: 12,
  },
];

export default function AimTrainer({ onBack, onApplyToGenerator }) {
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [gameMode, setGameMode] = useState('practice'); // 'practice' | 'challenge'
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // To freeze parent ScrollView

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

  const [lastFeedback, setLastFeedback] = useState(null);

  // Drag Gesture Ref
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [currentDragVector, setCurrentDragVector] = useState({ dx: 0, dy: 0, active: false });

  // Recoil & Animation States
  const damageAnim = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const recoilOffset = useRef(new Animated.Value(0)).current;
  const crosshairSpread = useRef(new Animated.Value(24)).current;

  // Window Resize Listener
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
      setIsLandscape(window.width > window.height);
    });
    return () => {
      subscription?.remove();
      // Reset orientation back to portrait when unmounting
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // Landscape Mode Toggle
  const handleToggleOrientation = async () => {
    try {
      if (isLandscape) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      }
    } catch (err) {
      // Fallback for web or devices that don't support locking
      setIsLandscape(!isLandscape);
    }
  };

  // Challenge Timer
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

  // TOUCH INTERACTION ON FIRE BUTTON (CRITICAL FIX: NO SCROLL INTERFERENCE)
  const handleTouchStart = (e) => {
    setIsDragging(true);
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

    // 1. Play Weapon Gunshot Audio
    SOUNDS.playWeaponShot(selectedWeapon.id);

    // 2. Trigger Weapon Recoil Kick & Crosshair Bloom
    recoilOffset.setValue(selectedWeapon.recoilKick);
    crosshairSpread.setValue(selectedWeapon.spread * 1.5);
    Animated.parallel([
      Animated.timing(recoilOffset, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(crosshairSpread, {
        toValue: selectedWeapon.spread,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleTouchMove = (e) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setCurrentDragVector({ dx, dy, active: true });
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    const touch = e.nativeEvent;
    const endTime = Date.now();
    const duration = Math.max(35, endTime - dragStartRef.current.time);
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setCurrentDragVector({ dx: 0, dy: 0, active: false });

    // Invert dy: pulling upwards means negative dy -> positive drag distance
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
    let advice = 'Lực kéo chưa đủ dứt khoát! Vuốt nhanh hơn để tâm bay thoát ngực.';

    if (distance < 25 || speed < 350) {
      resultType = 'BODY';
      damage = 38;
      feedbackTitle = '🟡 DÍNH CHẶT Ở NGỰC (QUÁ CHẬM)';
      advice = 'Tâm bị hút chặt vào ngực! Tăng độ nhạy Red Dot +6 và vẩy ngón tay nhanh hơn.';
    } else if (distance > maxDist * 1.35 || speed > maxSpeed * 1.35) {
      resultType = 'MISS';
      damage = 0;
      feedbackTitle = '⚪ VỌT QUA ĐẦU (LÊN TRỜI)';
      advice = 'Lực kéo quá đà bay lên trời! Hãy giảm độ nhạy nhìn xung quanh 3-5 điểm hoặc tăng kích thước nút bắn.';
    } else if (
      distance >= minDist * 0.85 &&
      distance <= maxDist * 1.25 &&
      speed >= minSpeed * 0.85 &&
      speed <= maxSpeed * 1.25
    ) {
      // 🎯 PERFECT HEADSHOT!
      resultType = 'HEAD';
      damage = selectedWeapon.damage;
      feedbackTitle = '🔴 HEADSHOT ĐỎ CHÓI (100% ĐẦU)';
      advice = 'Tuyệt hảo! Tốc độ vuốt và điểm dừng đối trọng ghìm tâm đạt chuẩn tuyển thủ Esports.';

      // Play Free Fire Headshot Ding/Crit sound!
      SOUNDS.playHeadshotCrit();

      Animated.sequence([
        Animated.timing(targetScale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
        Animated.spring(targetScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    } else if (distance < minDist) {
      resultType = 'BODY';
      damage = 58;
      feedbackTitle = '🟡 DÍNH CỔ / NGỰC TRÊN';
      advice = 'Sắp dính đầu rồi! Nhích thêm 1 đoạn ngắn nữa là dính trọn cụm số đỏ.';
    } else {
      resultType = 'MISS';
      damage = 0;
      feedbackTitle = '⚪ LỆCH HƯỚNG TÂM';
      advice = 'Đường vuốt bị lệch khỏi trục đỉnh đầu. Hãy vuốt thẳng theo trục bia ngắm.';
    }

    damageAnim.setValue(0);
    Animated.spring(damageAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

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
    <ScrollView
      style={styles.container}
      scrollEnabled={!isDragging} // CRITICAL FIX: Disable scroll while dragging fire button
      showsVerticalScrollIndicator={false}>
      {/* Nút Quay Lại Cực To Dễ Bấm (Kính Lỏng) */}
      {onBack && (
        <TouchableOpacity style={styles.largeBackButton} onPress={onBack}>
          <Text style={styles.largeBackIcon}>←</Text>
          <Text style={styles.largeBackText}>QUAY LẠI TRANG CHỦ</Text>
        </TouchableOpacity>
      )}

      {/* Header Liquid Glass Banner */}
      <View style={styles.glassHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>🔥 AIM TRAINER PRO 2026</Text>
          </View>

          {/* Toggle Screen Orientation (Landscape Gaming Mode) */}
          <TouchableOpacity style={styles.orientBtn} onPress={handleToggleOrientation}>
            <Text style={styles.orientBtnIcon}>{isLandscape ? '📱' : '🎮'}</Text>
            <Text style={styles.orientBtnText}>
              {isLandscape ? 'Màn Hình Dọc' : 'Quay Ngang Chơi Game'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>GIẢ LẬP KÉO TÂM & GHÌM VẬT LÝ</Text>
        <Text style={styles.headerSub}>
          Mô phỏng cơ chế giật súng, âm thanh súng Free Fire chân thực và cảm biến đo vuốt ngón tay.
        </Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.glassModeBtn, gameMode === 'practice' && styles.glassModeBtnActive]}
          onPress={() => {
            setGameMode('practice');
            setIsPlaying(false);
          }}>
          <Text style={[styles.modeText, gameMode === 'practice' && styles.modeTextActive]}>
            🥋 Luyện Tự Do
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.glassModeBtn, gameMode === 'challenge' && styles.glassModeBtnActive]}
          onPress={() => {
            setGameMode('challenge');
            handleStartChallenge();
          }}>
          <Text style={[styles.modeText, gameMode === 'challenge' && styles.modeTextActive]}>
            ⏱️ Thử Thách 30s {gameMode === 'challenge' && `(${timeLeft}s)`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weapon Selector */}
      <Text style={styles.sectionLabel}>CHỌN VŨ KHÍ FREE FIRE LUYỆN BẮN:</Text>
      <View style={styles.weaponGrid}>
        {WEAPONS.map((w) => {
          const isSelected = selectedWeapon.id === w.id;
          return (
            <TouchableOpacity
              key={w.id}
              style={[styles.glassWeaponCard, isSelected && styles.glassWeaponCardActive]}
              onPress={() => {
                setSelectedWeapon(w);
                SOUNDS.playWeaponShot(w.id);
              }}>
              <Text style={styles.weaponIcon}>{w.icon}</Text>
              <Text style={[styles.weaponName, isSelected && styles.weaponNameActive]}>{w.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.weaponNote}>💡 {selectedWeapon.desc}</Text>

      {/* INTERACTIVE COMBAT ARENA (NO SCROLL INTERFERENCE) */}
      <View style={[styles.combatArena, isLandscape && styles.combatArenaLandscape]}>
        {/* Recoil Status Badge */}
        <View style={styles.arenaHeaderRow}>
          <Text style={styles.recoilBadgeText}>
            🔫 ĐỘ GIẬT: +{selectedWeapon.recoilKick}px • SÁT THƯƠNG: {selectedWeapon.damage}
          </Text>
          <Text style={styles.soundIndicator}>🔊 ÂM THANH BẬT</Text>
        </View>

        {/* Target Enemy Dummy with Physics Recoil */}
        <Animated.View
          style={[
            styles.targetDummyWrapper,
            {
              transform: [{ scale: targetScale }, { translateY: recoilOffset }],
            },
          ]}>
          <View
            style={[
              styles.targetHead,
              lastFeedback?.type === 'HEAD' && styles.targetHeadHit,
            ]}>
            <Text style={styles.headSkull}>💀</Text>
            {/* Dynamic Recoil Crosshair */}
            <Animated.View
              style={[
                styles.dynamicCrosshair,
                {
                  width: crosshairSpread,
                  height: crosshairSpread,
                  borderRadius: crosshairSpread,
                },
              ]}
            />
          </View>
          <View style={styles.targetNeck} />
          <View
            style={[
              styles.targetTorso,
              lastFeedback?.type === 'BODY' && styles.targetTorsoHit,
            ]}>
            <Text style={styles.armorIcon}>🛡️</Text>
          </View>
        </Animated.View>

        {/* Damage Popup */}
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
                      outputRange: [15, -45],
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
              {lastFeedback.damage > 0 ? `-${lastFeedback.damage}` : 'TRƯỢT'}
            </Text>
            <View style={styles.critPill}>
              <Text style={styles.critPillText}>{lastFeedback.title}</Text>
            </View>
          </Animated.View>
        )}

        {/* Drag Vector Visualizer */}
        {currentDragVector.active && (
          <View
            style={[
              styles.dragBeam,
              {
                height: Math.min(220, Math.max(10, -currentDragVector.dy)),
                transform: [
                  {
                    rotate: `${Math.round((currentDragVector.dx / (Math.abs(currentDragVector.dy) || 1)) * 35)}deg`,
                  },
                ],
              },
            ]}
          />
        )}

        {/* FIRE BUTTON ZONE WITH FULL TOUCH CAPTURE */}
        <View style={styles.fireZoneContainer}>
          <Text style={styles.fireZoneHint}>
            👇 Đặt ngón tay và VUỐT NHANH LÊN ĐẦU (Kèm âm thanh súng)
          </Text>

          <View
            style={styles.fireButtonTouchArea}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}>
            <View style={styles.liquidFireButtonOuter}>
              <View style={styles.liquidFireButtonInner}>
                <Text style={styles.fireIcon}>🔥</Text>
                <Text style={styles.fireLabel}>BẮN</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Realtime Telemetry Analysis Card */}
      {lastFeedback && (
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryTitle}>📊 PHÂN TÍCH LỰC VUỐT VÀ GIA TỐC TAY</Text>
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>Tốc Độ Vuốt</Text>
              <Text style={[styles.telemetryBoxVal, { color: COLORS.primaryBright }]}>
                {lastFeedback.speed} px/s
              </Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>Độ Dài Vuốt</Text>
              <Text style={[styles.telemetryBoxVal, { color: COLORS.secondary }]}>
                {lastFeedback.distance} px
              </Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryBoxLabel}>Thời Gian</Text>
              <Text style={[styles.telemetryBoxVal, { color: COLORS.accentCyan }]}>
                {lastFeedback.duration} ms
              </Text>
            </View>
          </View>

          <View style={styles.aiAdviceRow}>
            <Text style={styles.aiAdviceIcon}>🤖</Text>
            <Text style={styles.aiAdviceText}>{lastFeedback.advice}</Text>
          </View>
        </View>
      )}

      {/* Score & Streak Bar */}
      <View style={styles.scoreGlassBar}>
        <View style={styles.scoreCol}>
          <Text style={styles.scoreVal}>{stats.shots}</Text>
          <Text style={styles.scoreLabel}>Đã Bắn</Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreVal, { color: COLORS.accentRed }]}>{headshotRate}%</Text>
          <Text style={styles.scoreLabel}>Tỉ Lệ Đỏ</Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreVal, { color: COLORS.secondary }]}>{stats.streak}</Text>
          <Text style={styles.scoreLabel}>Combo Đỏ</Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreVal, { color: COLORS.accentGreen }]}>{stats.maxStreak}</Text>
          <Text style={styles.scoreLabel}>Kỷ Lục</Text>
        </View>
      </View>

      {/* Quick Action Button to Pass to 5D Matrix */}
      {onApplyToGenerator && (
        <TouchableOpacity
          style={styles.applyForceBtn}
          onPress={() => {
            let force = 'Vuốt Vừa (Chuẩn)';
            if (stats.lastSpeed > 1700) force = 'Vuốt Nhanh / Mạnh (One-Shot)';
            else if (stats.lastSpeed < 850) force = 'Vuốt Nhẹ / Chậm (Ghim Cận Chiến)';
            onApplyToGenerator(force);
          }}>
          <Text style={styles.applyForceBtnText}>
            ⚡ ĐƯA LỰC TAY ({stats.lastSpeed} px/s) VÀO BỘ TẠO 5D →
          </Text>
        </TouchableOpacity>
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
  // Nút quay lại to rõ ràng
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  headerBadgeText: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 183, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    gap: 4,
  },
  orientBtnIcon: {
    fontSize: 14,
  },
  orientBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  glassModeBtn: {
    flex: 1,
    backgroundColor: COLORS.glassCard,
    paddingVertical: 12,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  glassModeBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  modeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modeTextActive: {
    color: COLORS.primaryBright,
    fontWeight: '900',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  weaponGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  glassWeaponCard: {
    width: '48.5%',
    backgroundColor: COLORS.glassCard,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: COLORS.rounded.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  glassWeaponCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 94, 0, 0.22)',
    borderWidth: 1.5,
  },
  weaponIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  weaponName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  weaponNameActive: {
    color: '#FFF',
    fontWeight: '900',
  },
  weaponNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  combatArena: {
    backgroundColor: 'rgba(18, 10, 5, 0.92)',
    borderRadius: COLORS.rounded.xl,
    borderWidth: 2,
    borderColor: COLORS.glassBorderHighlight,
    height: 390,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  combatArenaLandscape: {
    height: 300,
  },
  arenaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
  },
  recoilBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  soundIndicator: {
    color: COLORS.accentGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  targetDummyWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  targetHead: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(55, 25, 12, 0.85)',
    borderWidth: 2.5,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetHeadHit: {
    backgroundColor: 'rgba(255, 42, 66, 0.65)',
    borderColor: '#FFF',
    borderWidth: 3.5,
  },
  headSkull: {
    fontSize: 28,
  },
  dynamicCrosshair: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 94, 0, 0.7)',
  },
  targetNeck: {
    width: 16,
    height: 8,
    backgroundColor: '#261208',
  },
  targetTorso: {
    width: 116,
    height: 76,
    backgroundColor: 'rgba(38, 18, 8, 0.85)',
    borderRadius: COLORS.rounded.md,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTorsoHit: {
    backgroundColor: 'rgba(255, 183, 0, 0.5)',
    borderColor: COLORS.secondary,
  },
  armorIcon: {
    fontSize: 22,
  },
  damagePopup: {
    position: 'absolute',
    top: 24,
    alignItems: 'center',
    zIndex: 99,
  },
  damageNumber: {
    fontSize: 36,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 8,
  },
  damageHead: {
    color: '#FF2A42',
  },
  damageBody: {
    color: '#FFB700',
  },
  damageMiss: {
    color: '#FFFFFF',
  },
  critPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  critPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dragBeam: {
    position: 'absolute',
    bottom: 96,
    width: 5,
    backgroundColor: COLORS.primaryBright,
    borderRadius: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  fireZoneContainer: {
    alignItems: 'center',
    width: '100%',
  },
  fireZoneHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  fireButtonTouchArea: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidFireButtonOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primaryBright,
    backgroundColor: 'rgba(255, 94, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 10,
  },
  liquidFireButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireIcon: {
    fontSize: 22,
  },
  fireLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -2,
  },
  telemetryCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.lg,
    padding: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorderHighlight,
  },
  telemetryTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  telemetryBox: {
    alignItems: 'center',
    flex: 1,
  },
  telemetryBoxLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  telemetryBoxVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  aiAdviceRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 115, 0, 0.12)',
    borderRadius: COLORS.rounded.md,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
  },
  aiAdviceIcon: {
    fontSize: 20,
  },
  aiAdviceText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: '600',
  },
  scoreGlassBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassCard,
    borderRadius: COLORS.rounded.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVal: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  applyForceBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: COLORS.rounded.lg,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  applyForceBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
