import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
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

const HUD_PRESETS = [
  { id: 'shotgun-onetap', name: 'Shotgun One-Tap', size: 40, opacity: 90, desc: 'Cỡ nút nhỏ 40% giúp vệt vuốt dài, dễ móc chữ J đỉnh đầu.' },
  { id: 'smg-spray', name: 'MP40 Sấy Trùm', size: 46, opacity: 95, desc: 'Vừa vặn ngón cái, ghìm cụm đạn đỏ ổn định.' },
  { id: 'claw-4finger', name: 'Claw 4 Ngón', size: 38, opacity: 85, desc: 'Nút bắn góc trên cho ngón trỏ, xoay góc cực thoáng.' },
  { id: 'beginner', name: 'Tân Binh 2 Ngón', size: 54, opacity: 100, desc: 'Nút to chống trượt tay, dễ bấm trúng.' },
];

export default function TrainingAndHudStudio({ onBack, initialButtonSize = 42 }) {
  // Main Segment: 'TRAINER' (Luyện tâm) | 'HUD_STUDIO' (Căn chỉnh nút bắn) | 'EVALUATOR' (Đánh giá máy & DPI) | 'GRAPHICS' (Đồ họa & FPS)
  const [activeSegment, setActiveSegment] = useState('TRAINER');

  // Screen Dimensions & Orientation
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(dimensions.width > dimensions.height);

  // Weapon & Aim Trainer States
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [stats, setStats] = useState({
    shots: 0,
    headshots: 0,
    streak: 0,
    lastSpeed: 0,
  });
  const [feedback, setFeedback] = useState(null);

  // Fire Button Customization (HUD)
  const [btnSize, setBtnSize] = useState(initialButtonSize);
  const [btnOpacity, setBtnOpacity] = useState(90);

  // AI Phone Evaluator States
  const [deviceModel, setDeviceModel] = useState('');
  const [screenInches, setScreenInches] = useState('6.67');
  const [refreshRate, setRefreshRate] = useState('120Hz');
  const [fingerForce, setFingerForce] = useState('Vuốt Vừa (Chuẩn)');
  const [aiReport, setAiReport] = useState(null);

  // Touch Gesture References
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [dragVector, setDragVector] = useState({ dx: 0, dy: 0, active: false });

  // Animations
  const damageAnim = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const crosshairY = useRef(new Animated.Value(0)).current;
  const crosshairX = useRef(new Animated.Value(0)).current;
  const recoilBloom = useRef(new Animated.Value(1)).current;

  // Listen to dimension changes
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

  // TÍNH NĂNG XOAY MÀN HÌNH THÀNH NÚT RIÊNG (Dedicated Screen Rotation Function)
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
      Animated.timing(recoilBloom, { toValue: 1.45, duration: 40, useNativeDriver: true }),
      Animated.timing(recoilBloom, { toValue: 1.0, duration: 110, useNativeDriver: true }),
    ]).start();
  };

  const handleTouchMove = (e) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - dragStartRef.current.x;
    const dy = touch.pageY - dragStartRef.current.y;
    setDragVector({ dx, dy, active: true });

    // Move crosshair with thumb drag
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
      // 100% HEADSHOT!
      type = 'HEAD';
      damage = selectedWeapon.damage;
      label = `🔴 HEADSHOT (${damage})`;
      tip = 'Xuất sắc! Khóa cứng đỉnh đầu chuẩn 100% Free Fire!';

      // Play Free Fire Headshot Ding!
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

  // Run AI Phone Evaluator
  const handleRunAiEvaluation = () => {
    const inches = parseFloat(screenInches) || 6.67;
    const isSmall = inches < 6.4;
    const isLarge = inches > 7.0;

    let recBtnSize = isSmall ? 50 : isLarge ? 40 : 42;
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
    const maxSafe = typeof baseDpi === 'number' ? Math.round(baseDpi * 1.45) : '120';

    setAiReport({
      modelName: deviceModel.trim() || 'Thiết Bị Của Bạn',
      recBtnSize,
      recDpi,
      maxSafe,
      hudPos: 'Đáy 11% • Phải 18%',
      touchRate: refreshRate === '144Hz+' ? '360Hz - 720Hz' : '240Hz',
    });
  };

  const headshotRate = stats.shots > 0 ? Math.round((stats.headshots / stats.shots) * 100) : 0;

  // Real-time scaled fire button dimensions
  const computedButtonWidth = Math.max(68, Math.min(115, (btnSize / 42) * 88));

  return (
    <View style={styles.screenRoot}>
      <StatusBar hidden={isLandscape} barStyle="light-content" />

      {/* TOP HEADER: LIQUID FROSTED GLASS BAR WITH DEDICATED ROTATION BUTTON */}
      <View style={[styles.topBar, isLandscape && styles.topBarLandscape]}>
        {onBack && (
          <TouchableOpacity style={styles.backBtnBig} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        )}

        {/* Unified Mode Segment Selector */}
        {!isLandscape && (
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeSegment === 'TRAINER' && styles.segmentBtnActive]}
              onPress={() => setActiveSegment('TRAINER')}>
              <Text style={[styles.segmentBtnText, activeSegment === 'TRAINER' && styles.segmentBtnTextActive]}>
                🎯 Luyện Kéo Tâm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeSegment === 'HUD_STUDIO' && styles.segmentBtnActive]}
              onPress={() => setActiveSegment('HUD_STUDIO')}>
              <Text style={[styles.segmentBtnText, activeSegment === 'HUD_STUDIO' && styles.segmentBtnTextActive]}>
                📐 Nút Bắn & DPI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeSegment === 'EVALUATOR' && styles.segmentBtnActive]}
              onPress={() => setActiveSegment('EVALUATOR')}>
              <Text style={[styles.segmentBtnText, activeSegment === 'EVALUATOR' && styles.segmentBtnTextActive]}>
                📱 Đo Máy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeSegment === 'GRAPHICS' && styles.segmentBtnActive]}
              onPress={() => setActiveSegment('GRAPHICS')}>
              <Text style={[styles.segmentBtnText, activeSegment === 'GRAPHICS' && styles.segmentBtnTextActive]}>
                🎮 Đồ Họa
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NÚT XOAY MÀN HÌNH RIÊNG BIỆT (DEDICATED ROTATE BUTTON) */}
        <TouchableOpacity
          style={styles.dedicatedRotateBtn}
          activeOpacity={0.8}
          onPress={handleToggleOrientation}>
          <Text style={styles.rotateBtnIcon}>🔄</Text>
          <Text style={styles.rotateBtnText}>
            {isLandscape ? 'Màn Dọc' : 'Xoay Ngang'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= MODE 1: COMBAT AIM TRAINER ARENA ================= */}
      {activeSegment === 'TRAINER' && (
        <View style={[styles.battlefield, isLandscape && styles.battlefieldLandscape]}>
          {/* WEAPON SELECTOR ROW (TOP OF COMBAT) */}
          <View style={[styles.combatWeaponBar, isLandscape && styles.combatWeaponBarLandscape]}>
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

            {/* In-battle quick HUD Button Size Pill */}
            <TouchableOpacity
              style={styles.quickHudPill}
              onPress={() => {
                const nextSize = btnSize >= 52 ? 38 : btnSize + 4;
                setBtnSize(nextSize);
              }}>
              <Text style={styles.quickHudPillText}>🔘 Nút: {btnSize}% ↺</Text>
            </TouchableOpacity>
          </View>

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
            <View style={[styles.enemyHead, feedback?.type === 'HEAD' && styles.enemyHeadHit]}>
              <Text style={styles.headEmoji}>💀</Text>
              {feedback?.type === 'HEAD' && <View style={styles.headshotGlowRing} />}
            </View>
            <View style={styles.enemyTorso}>
              <Text style={styles.chestBadge}>FREE FIRE</Text>
            </View>
          </Animated.View>

          {/* FLOATING DAMAGE NUMBERS (FREE FIRE POPUP) */}
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

          {/* RIGHT HUD: AUTHENTIC FREE FIRE FIRE BUTTON (BOTTOM-RIGHT CORNER) */}
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

            {/* Interactive Fire Button (Right Thumb Position, Live Scaled to btnSize) */}
            <View
              style={[
                styles.fireButtonTouchable,
                {
                  width: computedButtonWidth + 10,
                  height: computedButtonWidth + 10,
                  borderRadius: (computedButtonWidth + 10) / 2,
                },
              ]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleTouchStart}
              onResponderMove={handleTouchMove}
              onResponderRelease={handleTouchEnd}>
              <View
                style={[
                  styles.fireButtonGlassOuter,
                  {
                    width: computedButtonWidth,
                    height: computedButtonWidth,
                    borderRadius: computedButtonWidth / 2,
                    opacity: btnOpacity / 100,
                  },
                ]}>
                <View
                  style={[
                    styles.fireButtonGlassInner,
                    {
                      width: computedButtonWidth * 0.78,
                      height: computedButtonWidth * 0.78,
                      borderRadius: (computedButtonWidth * 0.78) / 2,
                    },
                  ]}>
                  <Text style={styles.fireButtonIcon}>🔥</Text>
                  <Text style={styles.fireButtonLabel}>{btnSize}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ================= MODE 2: HUD STUDIO (TÙY CHỈNH NÚT BẮN) ================= */}
      {activeSegment === 'HUD_STUDIO' && !isLandscape && (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Mockup Preview Area */}
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>🔘 Mô Phỏng Cỡ Nút Bắn Thực Tế</Text>
            <View
              style={[
                styles.mockFireBtn,
                {
                  width: computedButtonWidth,
                  height: computedButtonWidth,
                  borderRadius: computedButtonWidth / 2,
                  opacity: btnOpacity / 100,
                },
              ]}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
              <Text style={styles.mockBtnText}>{btnSize}%</Text>
            </View>
            <Text style={styles.previewSub}>
              Đang chọn: <Text style={{ color: COLORS.primaryBright, fontWeight: 'bold' }}>{btnSize}%</Text> • Độ mờ: {btnOpacity}%
            </Text>
          </View>

          {/* Quick HUD Presets */}
          <Text style={styles.sectionHeaderTitle}>⚡ CÁC MẪU NÚT BẮN CHUẨN ESPORTS</Text>
          <View style={styles.presetsGrid}>
            {HUD_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.presetCard, btnSize === p.size && styles.presetCardActive]}
                onPress={() => {
                  setBtnSize(p.size);
                  setBtnOpacity(p.opacity);
                }}>
                <View style={styles.presetTopRow}>
                  <Text style={styles.presetName}>{p.name}</Text>
                  <Text style={styles.presetBadge}>{p.size}%</Text>
                </View>
                <Text style={styles.presetDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Slider Size Controls */}
          <View style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Kích Thước Nút Bắn (%)</Text>
            <View style={styles.sizeStepperRow}>
              {[38, 40, 42, 45, 48, 52, 55, 60].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stepperPill, btnSize === s && styles.stepperPillActive]}
                  onPress={() => setBtnSize(s)}>
                  <Text style={[styles.stepperPillText, btnSize === s && styles.stepperPillTextActive]}>
                    {s}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                setActiveSegment('TRAINER');
                Alert.alert('✅ Đã Áp Dụng', `Cỡ nút ${btnSize}% đã sẵn sàng trong phòng tập!`);
              }}>
              <Text style={styles.primaryActionBtnText}>VÀO BẮN THỬ NGAY →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ================= MODE 3: ĐÁNH GIÁ MÁY & DPI (EVALUATOR) ================= */}
      {activeSegment === 'EVALUATOR' && !isLandscape && (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Thông số máy của bạn</Text>
            <Text style={styles.cardDesc}>
              Nhập thông tin máy để AI đề xuất DPI và kích cỡ nút bắn chuẩn xác.
            </Text>

            <Text style={styles.fieldLabel}>Tên điện thoại</Text>
            <TextInput
              style={styles.inputField}
              placeholder="VD: iPhone 16 Pro, Redmi K70, Galaxy S24..."
              placeholderTextColor={COLORS.textMuted}
              value={deviceModel}
              onChangeText={setDeviceModel}
            />

            <Text style={styles.fieldLabel}>Kích thước màn hình</Text>
            <View style={styles.pillGroup}>
              {['6.1"', '6.67" (Chuẩn)', '6.78"', 'iPad'].map((inch) => (
                <TouchableOpacity
                  key={inch}
                  style={[styles.stepperPill, screenInches.includes(inch.replace('"', '').split(' ')[0]) && styles.stepperPillActive]}
                  onPress={() => setScreenInches(inch.replace('"', '').split(' ')[0])}>
                  <Text style={[styles.stepperPillText, screenInches.includes(inch.replace('"', '').split(' ')[0]) && styles.stepperPillTextActive]}>
                    {inch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tần số quét màn hình</Text>
            <View style={styles.pillGroup}>
              {['60Hz', '90Hz', '120Hz', '144Hz+'].map((hz) => (
                <TouchableOpacity
                  key={hz}
                  style={[styles.stepperPill, refreshRate === hz && styles.stepperPillActive]}
                  onPress={() => setRefreshRate(hz)}>
                  <Text style={[styles.stepperPillText, refreshRate === hz && styles.stepperPillTextActive]}>
                    {hz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleRunAiEvaluation}>
              <Text style={styles.primaryActionBtnText}>ĐÁNH GIÁ & ĐỀ XUẤT CẤU HÌNH</Text>
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

              <View style={styles.reportGrid}>
                <View style={styles.reportStatBox}>
                  <Text style={styles.reportStatLabel}>Cỡ nút bắn tối ưu</Text>
                  <Text style={styles.reportStatVal}>{aiReport.recBtnSize}%</Text>
                </View>
                <View style={styles.reportStatBox}>
                  <Text style={styles.reportStatLabel}>DPI Khuyên dùng</Text>
                  <Text style={styles.reportStatVal}>{aiReport.recDpi}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyReportBtn}
                onPress={() => {
                  setBtnSize(aiReport.recBtnSize);
                  setActiveSegment('TRAINER');
                  Alert.alert('✅ Thành Công', `Đã cài cỡ nút ${aiReport.recBtnSize}% vào Phòng Luyện Tâm!`);
                }}>
                <Text style={styles.applyReportBtnText}>Áp dụng vào Luyện Tâm ngay →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ================= MODE 4: GRAPHICS & FPS GUIDE ================= */}
      {activeSegment === 'GRAPHICS' && !isLandscape && (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>🎮 Thiết Lập Đồ Họa & FPS Free Fire</Text>
            <Text style={styles.cardDesc}>
              Cài đặt đồ họa chuẩn giúp cảm ứng nhạy hơn và kéo tâm mượt mà không bị drop FPS.
            </Text>

            <View style={styles.guideStepBox}>
              <Text style={styles.guideStepTitle}>1. Máy Cấu Hình Thấp (RAM ≤ 4GB, 60Hz)</Text>
              <Text style={styles.guideStepText}>• Đồ họa: <Text style={styles.whiteBold}>Thấp (Mượt)</Text></Text>
              <Text style={styles.guideStepText}>• Độ phân giải cao: <Text style={styles.whiteBold}>Tắt</Text></Text>
              <Text style={styles.guideStepText}>• FPS Cao: <Text style={[styles.whiteBold, { color: COLORS.accentGreen }]}>BẮT BUỘC BẬT CAO</Text> (Tăng độ nhạy cảm ứng)</Text>
            </View>

            <View style={styles.guideStepBox}>
              <Text style={styles.guideStepTitle}>2. Máy Tầm Trung (RAM 6GB–8GB, 90Hz–120Hz)</Text>
              <Text style={styles.guideStepText}>• Đồ họa: <Text style={styles.whiteBold}>Tiêu Chuẩn</Text></Text>
              <Text style={styles.guideStepText}>• Đổ bóng: <Text style={styles.whiteBold}>Tắt</Text> (Giảm giật khung hình khi giao tranh)</Text>
              <Text style={styles.guideStepText}>• FPS Cao: <Text style={[styles.whiteBold, { color: COLORS.accentGreen }]}>Bật Cao</Text></Text>
            </View>

            <View style={styles.guideStepBox}>
              <Text style={styles.guideStepTitle}>3. Máy Flagship / iPhone 120Hz</Text>
              <Text style={styles.guideStepText}>• Đồ họa: <Text style={styles.whiteBold}>Ultra / Cao</Text></Text>
              <Text style={styles.guideStepText}>• FPS Cao: <Text style={[styles.whiteBold, { color: COLORS.accentGreen }]}>Cực Cao (120FPS)</Text></Text>
              <Text style={styles.guideStepText}>• Lọc màu: <Text style={styles.whiteBold}>Rực rỡ</Text> (Dễ nhìn đầu địch từ xa)</Text>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
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
    gap: 8,
  },
  topBarLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  backBtnBig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backChevron: {
    fontSize: 24,
    color: COLORS.primaryBright,
    marginRight: 4,
    marginTop: -2,
    fontWeight: '300',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Segment Selector
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },

  // DEDICATED ROTATE BUTTON (Nút xoay màn hình riêng biệt)
  dedicatedRotateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  rotateBtnIcon: {
    fontSize: 16,
  },
  rotateBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Battlefield Combat Area
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
  combatWeaponBar: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  combatWeaponBarLandscape: {
    top: 6,
    left: 24,
    right: 24,
  },
  weaponPills: {
    flexDirection: 'row',
    gap: 6,
  },
  weaponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  weaponPillActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  weaponPillIcon: {
    fontSize: 13,
  },
  weaponPillText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  weaponPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  quickHudPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  quickHudPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Free Fire Top HUD
  ffTopHud: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  ffTopHudLandscape: {
    top: 40,
    left: 24,
    right: 24,
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

  // Enemy Dummy
  enemyContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: '32%',
  },
  enemyContainerLandscape: {
    top: '22%',
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
    backgroundColor: 'rgba(255, 59, 48, 0.65)',
    borderColor: '#FFF',
    borderWidth: 3,
  },
  headshotGlowRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
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

  // Aim Reticle
  aimReticle: {
    position: 'absolute',
    top: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  aimReticleLandscape: {
    top: '34%',
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

  // Damage Numbers
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
  damageRed: { color: '#FF2A42' },
  damageYellow: { color: '#FFB800' },
  damageWhite: { color: '#FFFFFF' },
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

  // Left Controls
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

  // RIGHT FIRE BUTTON (BOTTOM-RIGHT CORNER)
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
  },
  fireButtonTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonGlassOuter: {
    borderWidth: 2,
    borderColor: 'rgba(255, 106, 0, 0.65)',
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonGlassInner: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireButtonIcon: { fontSize: 22 },
  fireButtonLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    marginTop: -2,
  },

  // HUD Studio & Evaluator Scroll Container
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  previewBox: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  mockFireBtn: {
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mockBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  previewSub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sectionHeaderTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  presetsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  presetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  presetBadge: {
    color: COLORS.primaryBright,
    fontWeight: '900',
    fontSize: 13,
  },
  presetDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  glassCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  sizeStepperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stepperPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stepperPillActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  stepperPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepperPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportModelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSuccessText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: 'bold',
  },
  reportGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  reportStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  reportStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reportStatVal: {
    color: COLORS.primaryBright,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  applyReportBtn: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  applyReportBtnText: {
    color: COLORS.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },

  // Graphics Guide
  guideStepBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  guideStepTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  guideStepText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  whiteBold: {
    color: '#FFF',
    fontWeight: '700',
  },
});
