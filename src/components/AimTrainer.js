import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from '../theme/colors';
import { SOUNDS } from '../utils/soundEffects';

const WEAPONS = [
  {
    id: 'shotgun',
    name: 'M1887 (Shotgun)',
    icon: '💥',
    subTitle: 'Vuốt móc chữ J',
    damage: 288,
    idealSpeed: [1100, 2400],
    idealDist: [80, 210],
  },
  {
    id: 'smg',
    name: 'MP40 (SMG)',
    icon: '⚡',
    subTitle: 'Kéo thẳng nhanh',
    damage: 168,
    idealSpeed: [850, 1900],
    idealDist: [70, 180],
  },
  {
    id: 'rifle',
    name: 'AK47 (Súng Trường)',
    icon: '🎯',
    subTitle: 'Kéo êm ghìm giật',
    damage: 142,
    idealSpeed: [650, 1550],
    idealDist: [55, 150],
  },
  {
    id: 'sniper',
    name: 'AWM (Tầm Xa)',
    icon: '🔭',
    subTitle: 'Flick tâm 1 viên',
    damage: 300,
    idealSpeed: [950, 2250],
    idealDist: [65, 170],
  },
];

export default function AimTrainer({ onBack, onApplyToGenerator }) {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(dimensions.width > dimensions.height);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [stats, setStats] = useState({
    shots: 0,
    headshots: 0,
    streak: 0,
    lastSpeed: 0,
  });

  const [feedback, setFeedback] = useState(null);

  // Drag Gesture Reference
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [dragVector, setDragVector] = useState({ dx: 0, dy: 0, active: false });

  // Animations
  const damageAnim = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const crosshairY = useRef(new Animated.Value(0)).current;
  const crosshairX = useRef(new Animated.Value(0)).current;
  const recoilBloom = useRef(new Animated.Value(1)).current;

  // Listen to orientation changes and screen dimensions
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setIsLandscape(window.width > window.height);
    });

    return () => {
      subscription?.remove?.();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // Toggle Screen Orientation
  const handleToggleOrientation = async () => {
    try {
      if (isLandscape) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      }
    } catch (e) {
      setIsLandscape(!isLandscape);
    }
  };

  // TOUCH HANDLERS ON THE BOTTOM-RIGHT FIRE BUTTON
  const handleTouchStart = (e) => {
    const touch = e.nativeEvent;
    dragStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    setDragVector({ dx: 0, dy: 0, active: true });

    // 1. Play real gunshot sound
    SOUNDS.playWeaponShot(selectedWeapon.id);

    // 2. Crosshair recoil kick & bloom
    crosshairY.setValue(-12);
    Animated.sequence([
      Animated.timing(recoilBloom, { toValue: 1.5, duration: 40, useNativeDriver: true }),
      Animated.timing(recoilBloom, { toValue: 1.0, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleTouchMove = (e) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setDragVector({ dx, dy, active: true });

    // Move crosshair with thumb drag (upward pull + horizontal tilt)
    const liftY = Math.min(95, Math.max(0, -dy * 0.5));
    const liftX = Math.max(-40, Math.min(40, dx * 0.35));
    crosshairY.setValue(-liftY);
    crosshairX.setValue(liftX);
  };

  const handleTouchEnd = (e) => {
    const touch = e.nativeEvent;
    const duration = Math.max(35, Date.now() - dragStartRef.current.time);
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setDragVector({ dx: 0, dy: 0, active: false });

    // Reset crosshair position smoothly
    Animated.parallel([
      Animated.spring(crosshairY, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.spring(crosshairX, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();

    // Calculate drag distance (dragging up = negative dy)
    const distance = Math.max(0, -dy);
    const speed = Math.round((distance / duration) * 1000); // px/sec

    evaluateDrag(distance, speed, duration, dx);
  };

  const evaluateDrag = (distance, speed, duration, dx) => {
    const [minSpeed, maxSpeed] = selectedWeapon.idealSpeed;
    const [minDist, maxDist] = selectedWeapon.idealDist;

    let type = 'BODY';
    let damage = 45;
    let label = '🟡 DÍNH NGỰC (45)';
    let tip = 'Kéo nhanh & dứt khoát hơn để tâm thoát khỏi ngực!';

    // Shotgun checks J-curve drag (swipe right/left then whip straight up)
    const isJCurve = selectedWeapon.id === 'shotgun' && Math.abs(dx) > 15;

    if (distance < 28 || speed < 300) {
      type = 'BODY';
      damage = 45;
      label = '🟡 DÍNH NGỰC (45)';
      tip = 'Lực kéo quá yếu hoặc tay kéo chậm!';
    } else if (distance > maxDist * 1.38 || speed > maxSpeed * 1.38) {
      type = 'MISS';
      damage = 0;
      label = '⚪ VỌT QUA ĐẦU (TRƯỢT)';
      tip = 'Kéo quá mạnh lên trời! Hãy dừng ngón tay đúng ngang tầm đầu.';
    } else if (
      (distance >= minDist * 0.82 && distance <= maxDist * 1.28 && speed >= minSpeed * 0.82 && speed <= maxSpeed * 1.28) ||
      (selectedWeapon.id === 'shotgun' && isJCurve && speed >= 950)
    ) {
      // 100% AUTHENTIC HEADSHOT
      type = 'HEAD';
      damage = selectedWeapon.damage;
      label = `🔴 HEADSHOT (${damage})`;
      tip = 'Xuất sắc! Khóa cứng đỉnh đầu chuẩn 100% Free Fire!';

      // Play Free Fire Headshot Ding/Crit sound!
      SOUNDS.playHeadshotCrit();

      Animated.sequence([
        Animated.timing(targetScale, { toValue: 1.25, duration: 50, useNativeDriver: true }),
        Animated.spring(targetScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    } else {
      type = 'BODY';
      damage = 54;
      label = '🟡 TRÚNG CỔ (54)';
      tip = 'Gần tới đầu rồi! Vuốt dứt khoát thêm một chút là ăn trọn đầu!';
    }

    damageAnim.setValue(0);
    Animated.spring(damageAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    setStats((prev) => {
      const isHead = type === 'HEAD';
      return {
        shots: prev.shots + 1,
        headshots: prev.headshots + (isHead ? 1 : 0),
        streak: isHead ? prev.streak + 1 : 0,
        lastSpeed: speed,
      };
    });

    setFeedback({ type, damage, label, tip, speed, distance });
  };

  const headshotRate = stats.shots > 0 ? Math.round((stats.headshots / stats.shots) * 100) : 0;

  return (
    <View style={styles.screenRoot}>
      <StatusBar hidden={isLandscape} barStyle="light-content" />

      {/* TOP HEADER: LIQUID FROSTED GLASS BAR */}
      <View style={[styles.topBar, isLandscape && styles.topBarLandscape]}>
        {onBack && (
          <TouchableOpacity
            style={styles.backBtnBig}
            onPress={onBack}
            activeOpacity={0.7}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        )}

        {/* Weapons Pills Selector */}
        <View style={styles.weaponPills}>
          {WEAPONS.map((w) => {
            const isSel = selectedWeapon.id === w.id;
            return (
              <TouchableOpacity
                key={w.id}
                style={[styles.weaponPill, isSel && styles.weaponPillActive]}
                onPress={() => {
                  setSelectedWeapon(w);
                  SOUNDS.playWeaponShot(w.id);
                }}>
                <Text style={styles.weaponPillIcon}>{w.icon}</Text>
                <Text style={[styles.weaponPillText, isSel && styles.weaponPillTextActive]}>
                  {w.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Orientation Switcher Button */}
        <TouchableOpacity style={styles.orientBtn} onPress={handleToggleOrientation}>
          <Text style={styles.orientIcon}>{isLandscape ? '📱 Màn dọc' : '🎮 Màn ngang'}</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN COMBAT BATTLEFIELD (FREE FIRE REAL GAME VIEW) */}
      <View style={[styles.battlefield, isLandscape && styles.battlefieldLandscape]}>
        {/* FREE FIRE TOP HUD: HP BAR & STATS */}
        <View style={[styles.ffTopHud, isLandscape && styles.ffTopHudLandscape]}>
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>HP</Text>
            <View style={styles.hpBarBg}>
              <View style={styles.hpBarFill} />
            </View>
            <Text style={styles.hpNumber}>200/200</Text>
          </View>

          <View style={styles.statsGlassPill}>
            <Text style={styles.statsHeadshotText}>ĐẦU: {headshotRate}%</Text>
            <Text style={styles.statsStreakText}>🔥 COMBO: {stats.streak}</Text>
          </View>
        </View>

        {/* ENEMY TARGET IN CENTER */}
        <Animated.View
          style={[
            styles.enemyContainer,
            isLandscape && styles.enemyContainerLandscape,
            {
              transform: [{ scale: targetScale }],
            },
          ]}>
          {/* Hitbox Head (Đầu mục tiêu) */}
          <View
            style={[
              styles.enemyHead,
              feedback?.type === 'HEAD' && styles.enemyHeadHit,
            ]}>
            <Text style={styles.headEmoji}>💀</Text>
            {feedback?.type === 'HEAD' && (
              <View style={styles.headshotGlowRing} />
            )}
          </View>
          <View style={styles.enemyTorso}>
            <Text style={styles.chestBadge}>FREE FIRE</Text>
          </View>
        </Animated.View>

        {/* FLOATING RED/YELLOW DAMAGE NUMBERS (FREE FIRE POPUP) */}
        {feedback && (
          <Animated.View
            style={[
              styles.damagePopup,
              isLandscape && styles.damagePopupLandscape,
              {
                opacity: damageAnim,
                transform: [
                  {
                    translateY: damageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -55],
                    }),
                  },
                ],
              },
            ]}>
            <Text
              style={[
                styles.ffDamageNumber,
                feedback.type === 'HEAD' && styles.damageRed,
                feedback.type === 'BODY' && styles.damageYellow,
                feedback.type === 'MISS' && styles.damageWhite,
              ]}>
              {feedback.damage > 0 ? feedback.damage : 'TRƯỢT'}
            </Text>
            <Text style={styles.feedbackHintText}>{feedback.tip}</Text>
          </Animated.View>
        )}

        {/* DYNAMIC FREE FIRE RETICLE / CROSSHAIR */}
        <Animated.View
          style={[
            styles.aimReticle,
            isLandscape && styles.aimReticleLandscape,
            {
              transform: [
                { translateY: crosshairY },
                { translateX: crosshairX },
                { scale: recoilBloom },
              ],
            },
          ]}>
          <View style={[styles.reticleDot, feedback?.type === 'HEAD' && styles.reticleDotHead]} />
          {/* 4 surrounding Free Fire tick marks */}
          <View style={styles.tickTop} />
          <View style={styles.tickBottom} />
          <View style={styles.tickLeft} />
          <View style={styles.tickRight} />
        </Animated.View>

        {/* LEFT HUD: JOYSTICK DECORATION */}
        <View style={[styles.leftVirtualControl, isLandscape && styles.leftVirtualControlLandscape]}>
          <View style={styles.joystickBase}>
            <View style={styles.joystickKnob} />
          </View>
          <Text style={styles.leftControlHint}>DI CHUYỂN</Text>
        </View>

        {/* RIGHT HUD: AUTHENTIC FREE FIRE FIRE BUTTON (BOTTOM-RIGHT) */}
        <View style={[styles.rightFireSection, isLandscape && styles.rightFireSectionLandscape]}>
          <Text style={styles.fireDragHint}>
            {dragVector.active ? `⚡ ${stats.lastSpeed} px/s` : 'VUỐT KÉO LÊN ĐẦU'}
          </Text>

          {/* Drag Trajectory Indicator */}
          {dragVector.active && (
            <View
              style={[
                styles.dragBeam,
                {
                  height: Math.min(160, Math.max(12, -dragVector.dy)),
                  transform: [
                    {
                      rotate: `${Math.round((dragVector.dx / (Math.abs(dragVector.dy) || 1)) * 35)}deg`,
                    },
                  ],
                },
              ]}
            />
          )}

          {/* Interactive Fire Button (Right Thumb Position) */}
          <View
            style={styles.fireButtonTouchable}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}>
            <View style={styles.fireButtonGlassOuter}>
              <View style={styles.fireButtonGlassInner}>
                <Text style={styles.fireButtonIcon}>🔥</Text>
                <Text style={styles.fireButtonLabel}>BẮN</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* BOTTOM ACTION BAR: MINIMALIST iOS GLASS BAR (Chỉ hiện khi dọc) */}
      {!isLandscape && (
        <View style={styles.bottomBar}>
          <View style={styles.telemetryMini}>
            <Text style={styles.telemetryMiniText}>
              Lượt bắn: <Text style={styles.whiteBold}>{stats.shots}</Text> • Tốc độ:{' '}
              <Text style={styles.accentBold}>{stats.lastSpeed} px/s</Text>
            </Text>
          </View>

          {onApplyToGenerator && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                let force = 'Vuốt Vừa (Chuẩn)';
                if (stats.lastSpeed > 1700) force = 'Vuốt Nhanh / Mạnh (One-Shot)';
                else if (stats.lastSpeed < 850) force = 'Vuốt Nhẹ / Chậm (Ghim Cận Chiến)';
                onApplyToGenerator(force);
              }}>
              <Text style={styles.applyBtnText}>⚡ Đưa lực tay vào AI Coach →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.glassCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  topBarLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  backBtnBig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
  weaponPills: {
    flexDirection: 'row',
    gap: 6,
  },
  weaponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  weaponPillActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  weaponPillIcon: {
    fontSize: 14,
  },
  weaponPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  weaponPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  orientBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  orientIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // FREE FIRE BATTLEFIELD LAYOUT
  battlefield: {
    flex: 1,
    backgroundColor: '#07080B',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  battlefieldLandscape: {
    height: '100%',
  },

  // TOP HUD
  ffTopHud: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  ffTopHudLandscape: {
    top: 8,
    left: 28,
    right: 28,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hpLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 6,
  },
  hpBarBg: {
    width: 90,
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 6,
  },
  hpBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
  },
  hpNumber: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statsGlassPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 10,
  },
  statsHeadshotText: {
    color: COLORS.accentRed,
    fontSize: 11,
    fontWeight: '900',
  },
  statsStreakText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
  },

  // ENEMY DUMMY IN CENTER
  enemyContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: '30%',
  },
  enemyContainerLandscape: {
    top: '20%',
  },
  enemyHead: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  enemyHeadHit: {
    backgroundColor: 'rgba(255, 59, 48, 0.6)',
    borderColor: '#FFF',
    borderWidth: 3,
  },
  headshotGlowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    opacity: 0.8,
  },
  headEmoji: {
    fontSize: 26,
  },
  enemyTorso: {
    width: 96,
    height: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestBadge: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // AIM RETICLE / CROSSHAIR
  aimReticle: {
    position: 'absolute',
    top: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  aimReticleLandscape: {
    top: '32%',
  },
  reticleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  reticleDotHead: {
    backgroundColor: COLORS.accentRed,
  },
  tickTop: {
    position: 'absolute',
    top: -16,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tickBottom: {
    position: 'absolute',
    bottom: -16,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tickLeft: {
    position: 'absolute',
    left: -16,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tickRight: {
    position: 'absolute',
    right: -16,
    width: 8,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  // DAMAGE NUMBERS (FREE FIRE STYLE)
  damagePopup: {
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
    zIndex: 99,
  },
  damagePopupLandscape: {
    top: '12%',
  },
  ffDamageNumber: {
    fontSize: 44,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 8,
  },
  damageRed: {
    color: '#FF2A42', // Headshot red
  },
  damageYellow: {
    color: '#FFB800', // Body yellow
  },
  damageWhite: {
    color: '#FFFFFF',
  },
  feedbackHintText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },

  // LEFT JOYSTICK CONTROLS
  leftVirtualControl: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    alignItems: 'center',
  },
  leftVirtualControlLandscape: {
    left: 36,
    bottom: 24,
  },
  joystickBase: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickKnob: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftControlHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  // RIGHT HUD: FIRE BUTTON IN BOTTOM-RIGHT CORNER (NOT IN THE MIDDLE!)
  rightFireSection: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    alignItems: 'center',
  },
  rightFireSectionLandscape: {
    right: 36,
    bottom: 20,
  },
  fireDragHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  dragBeam: {
    position: 'absolute',
    bottom: 96,
    width: 4,
    backgroundColor: COLORS.primaryBright,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  fireButtonTouchable: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonGlassOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255, 106, 0, 0.65)',
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fireButtonGlassInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
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

  // BOTTOM ACTION BAR
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.glassCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  telemetryMini: {
    flex: 1,
  },
  telemetryMiniText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  whiteBold: {
    color: '#FFF',
    fontWeight: '800',
  },
  accentBold: {
    color: COLORS.primaryBright,
    fontWeight: '900',
  },
  applyBtn: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  applyBtnText: {
    color: COLORS.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },
});
