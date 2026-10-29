import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Modal,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './src/theme/colors';
import { BRANDS, SUB_SERIES_MAP, MOCK_DATA, PRO_TIPS } from './src/data/sensitivityData';

export default function App() {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState('Splash'); // Splash, Auth, MainApp
  const [activeTab, setActiveTab] = useState('HomeTab'); // HomeTab, SensitivityTab, GeneratorTab, AccountTab

  // Sensitivity Navigation
  const [sensSubScreen, setSensSubScreen] = useState('BrandList'); // BrandList, SubSeriesList, DeviceList, DetailView
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedSubSeries, setSelectedSubSeries] = useState('All');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  // Storage & Profiles
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: 'Xạ Thủ Free Fire',
    rank: 'Đại Cao Thủ ★ 50',
    avatarLetter: 'FF',
    isLoggedIn: false,
  });

  // Generator Tool State (5D Matrix)
  const [genDeviceType, setGenDeviceType] = useState('Android Trung');
  const [genRefreshRate, setGenRefreshRate] = useState('120Hz');
  const [genDragForce, setGenDragForce] = useState('Vuốt Vừa (Chuẩn)');
  const [genFriction, setGenFriction] = useState('Kính Bóng Thường');
  const [genWeapon, setGenWeapon] = useState('Shotgun (M1887, M1014)');
  const [generatedResult, setGeneratedResult] = useState(null);

  // Edit Profile Modal
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempRank, setTempRank] = useState('');

  // SAVE & RENAME MODALS (Multi-save without limits)
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [configPendingSave, setConfigPendingSave] = useState(null);
  const [inputConfigName, setInputConfigName] = useState('');

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameTargetItem, setRenameTargetItem] = useState(null);
  const [inputRenameName, setInputRenameName] = useState('');

  // Initial Load from AsyncStorage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@my_saved_configs');
        if (savedData) setSavedConfigs(JSON.parse(savedData));

        const savedUser = await AsyncStorage.getItem('@user_profile');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUserProfile(parsed);
          if (parsed.isLoggedIn) {
            setCurrentScreen('MainApp');
          } else {
            setCurrentScreen('Auth');
          }
        } else {
          setCurrentScreen('Auth');
        }
      } catch (err) {
        console.error(err);
        setCurrentScreen('Auth');
      }
    };
    initializeApp();
  }, []);

  // OPEN SAVE MODAL (Cho phép đặt tên riêng cho từng cấu hình)
  const handleOpenSaveModal = (targetConfig) => {
    const target = targetConfig || selectedConfig;
    if (!target) {
      Alert.alert('⚠️ Chú ý', 'Chưa có cấu hình nào được chọn!');
      return;
    }
    setConfigPendingSave(target);
    const defaultName = target.deviceName || `Cấu hình ${target.brand || 'Free Fire'}`;
    setInputConfigName(defaultName);
    setIsSaveModalVisible(true);
  };

  // CONFIRM SAVE (Lưu không giới hạn số lượng với ID độc nhất)
  const handleConfirmSave = async () => {
    if (!configPendingSave) return;
    const finalTitle = inputConfigName.trim() || configPendingSave.deviceName || 'Cấu hình tùy chỉnh';

    try {
      const newConfigItem = {
        id: 'cfg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: finalTitle,
        brand: configPendingSave.brand || 'Tùy biến',
        date: new Date().toLocaleDateString('vi-VN'),
        config: configPendingSave,
      };

      const updated = [newConfigItem, ...savedConfigs];
      setSavedConfigs(updated);
      await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));

      setIsSaveModalVisible(false);
      setConfigPendingSave(null);
      Alert.alert(
        '🎉 Lưu Thành Công!',
        `Đã lưu cấu hình "${finalTitle}" vào Kho Cấu Hình của bạn.`
      );
    } catch (e) {
      Alert.alert('❌ Lỗi', 'Không thể lưu cấu hình lúc này.');
    }
  };

  // OPEN RENAME MODAL
  const handleOpenRenameModal = (item) => {
    setRenameTargetItem(item);
    setInputRenameName(item.title);
    setIsRenameModalVisible(true);
  };

  // CONFIRM RENAME
  const handleConfirmRename = async () => {
    if (!renameTargetItem || !inputRenameName.trim()) return;
    try {
      const updated = savedConfigs.map((c) =>
        c.id === renameTargetItem.id ? { ...c, title: inputRenameName.trim() } : c
      );
      setSavedConfigs(updated);
      await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));
      setIsRenameModalVisible(false);
      setRenameTargetItem(null);
      Alert.alert('✅ Thành công', 'Đã cập nhật tên cấu hình mới!');
    } catch (e) {
      Alert.alert('❌ Lỗi', 'Không thể đổi tên lúc này.');
    }
  };

  // DELETE CONFIG
  const handleDeleteConfig = (id, title) => {
    Alert.alert(
      '🗑️ Xác nhận xóa',
      `Bạn có muốn gỡ cấu hình "${title}" khỏi danh sách đã lưu?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = savedConfigs.filter((item) => item.id !== id);
              setSavedConfigs(updated);
              await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));
            } catch (e) {
              Alert.alert('❌ Lỗi', 'Không thể xóa cấu hình.');
            }
          },
        },
      ]
    );
  };

  // SHARE SENSITIVITY STRING
  const handleShareSensitivity = async (config) => {
    if (!config) return;
    try {
      const s2x = config.scope2x || Math.max(70, (config.redDot || 174) - 6);
      const s4x = config.scope4x || Math.max(60, (config.redDot || 174) - 14);
      const awm = config.awm || Math.max(40, Math.round((config.general || 188) * 0.40));
      const look = config.freeLook || Math.max(70, (config.general || 188) - 45);

      const text = `🎯 [ĐỘ NHẠY FREE FIRE ESPORTS 2026]
📱 Cấu hình: ${config.deviceName} (${config.brand})
━━━━━━━━━━━━━━━━━━━
• Nhìn xung quanh: ${config.general}/200
• Red Dot Sight: ${config.redDot}/200
• Ống ngắm 2X: ${s2x}/200
• Ống ngắm 4X: ${s4x}/200
• Ngắm AWM / Snip: ${awm}/200
• Góc nhìn tự do: ${look}/200
━━━━━━━━━━━━━━━━━━━
⚡ DPI Khuyên Dùng: ${config.dpi}
🔘 Cỡ nút bắn chuẩn: ${config.buttonSize}%
📍 Vị trí HUD: ${config.hudPos || 'Đáy 12% • Phải 19%'}
🔥 Kiểu vuốt tâm: ${config.dragType || 'Vuốt Chữ J Móc Nhanh'}
━━━━━━━━━━━━━━━━━━━
Đã qua kiểm thử phòng tập • Chuẩn Headshot OB 2026!`;

      await Share.share({ message: text });
    } catch (error) {
      console.error(error);
    }
  };

  // THUẬT TOÁN MA TRẬN KÉO TÂM 5 CHIỀU (5D HEADSHOT ENGINE OB 2026)
  const calculateAutoSensitivity = () => {
    let baseGen = 190;
    let baseDpi = 480;
    let safeMax = 520;

    if (genDeviceType === 'iPhone / iPad') {
      baseGen = 184;
      baseDpi = '120 (Trượt iOS)';
      safeMax = 120;
    } else if (genDeviceType === 'Android Flagship') {
      baseGen = 182;
      baseDpi = 510;
      safeMax = 550;
    } else if (genDeviceType === 'Android Trung') {
      baseGen = 190;
      baseDpi = 480;
      safeMax = 520;
    } else if (genDeviceType === 'Máy Cấu Hình Yếu') {
      baseGen = 198;
      baseDpi = 440;
      safeMax = 480;
    }

    let hzOffset = 0;
    if (genRefreshRate === '60Hz') hzOffset = 6;
    else if (genRefreshRate === '90Hz') hzOffset = 2;
    else if (genRefreshRate === '120Hz') hzOffset = -2;
    else if (genRefreshRate === '144Hz+') hzOffset = -4;

    let forceOffset = 0;
    if (genDragForce === 'Vuốt Mạnh (Dứt Khoát)') {
      forceOffset = -7;
    } else if (genDragForce === 'Vuốt Nhẹ (Lười Vuốt)') {
      forceOffset = +6;
    }

    let frictionOffset = 0;
    if (genFriction === 'Cường Lực Nhám') {
      frictionOffset = +4;
    } else if (genFriction === 'Bao Ngón Tay Gaming') {
      frictionOffset = -6;
    } else if (genFriction === 'Màn Hình Trần') {
      frictionOffset = +2;
    }

    let redDotOffset = 0;
    let btnSize = 44;
    let dragMethod = 'Vuốt Chữ J Móc Nhanh Góc 45°';
    let hudCoordinate = 'Cách đáy 11% • Cách phải 18%';

    if (genWeapon === 'Shotgun (M1887, M1014)') {
      redDotOffset = +4;
      btnSize = 42;
      dragMethod = 'Vuốt Chữ J Móc Sâu Cận Chiến';
      hudCoordinate = 'Cách đáy 10% • Cách phải 17%';
    } else if (genWeapon === 'SMG Sấy (MP40, UMP)') {
      redDotOffset = -2;
      btnSize = 44;
      dragMethod = 'Kéo Thẳng Đều Tay Giữ Đường Đạn';
      hudCoordinate = 'Cách đáy 12% • Cách phải 19%';
    } else if (genWeapon === 'Súng Trường (AK, Scar)') {
      redDotOffset = -4;
      btnSize = 46;
      dragMethod = 'Vuốt Nhẹ Hồi Tâm (Bắn 3 viên nhả)';
      hudCoordinate = 'Cách đáy 12% • Cách phải 20%';
    } else if (genWeapon === 'Gõ 1 Viên (Woodpecker, SVD)') {
      redDotOffset = +2;
      btnSize = 48;
      dragMethod = 'Đặt Tâm Ngực Hất Nhẹ Đỉnh Đầu (Tap 1 viên)';
      hudCoordinate = 'Cách đáy 13% • Cách phải 21%';
    }

    const finalGen = Math.min(200, Math.max(160, baseGen + hzOffset + forceOffset + frictionOffset));
    const finalRedDot = Math.min(200, Math.max(140, finalGen - 11 + redDotOffset));
    const final2x = Math.max(70, finalRedDot - 6);
    const final4x = Math.max(60, finalRedDot - 14);
    const finalAwm = Math.max(40, Math.round(finalGen * 0.40));
    const finalFreeLook = Math.max(70, finalGen - 45);

    const dpiDisplay = typeof baseDpi === 'number'
      ? `${baseDpi} (Giới hạn an toàn: <${safeMax})`
      : baseDpi;

    const result = {
      id: 'ai-custom-' + Date.now(),
      deviceName: `Độ Nhạy AI: ${genDeviceType} • ${genWeapon.split(' ')[0]}`,
      brand: 'AI Tối Ưu',
      general: finalGen,
      redDot: finalRedDot,
      scope2x: final2x,
      scope4x: final4x,
      awm: finalAwm,
      freeLook: finalFreeLook,
      dpi: dpiDisplay,
      safeDpiMax: safeMax,
      buttonSize: btnSize,
      hudPos: hudCoordinate,
      dragType: dragMethod,
      author: 'AI Headshot Engine v2',
      headshotRate: '99.4% Chuẩn Đầu',
    };

    setGeneratedResult(result);
  };

  // Filtered devices for Sensitivity Tab
  const globalFilteredDevices = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return MOCK_DATA.filter(
      (item) =>
        item.deviceName.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
    );
  }, [globalSearchQuery]);

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      const matchBrand = item.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchSeries = selectedSubSeries === 'All' || item.series === selectedSubSeries;
      const matchSearch =
        !deviceSearchQuery.trim() ||
        item.deviceName.toLowerCase().includes(deviceSearchQuery.toLowerCase());
      return matchBrand && matchSeries && matchSearch;
    });
  }, [selectedBrand, selectedSubSeries, deviceSearchQuery]);

  // Filtered saved configs
  const filteredSavedConfigs = useMemo(() => {
    if (!savedSearchQuery.trim()) return savedConfigs;
    const q = savedSearchQuery.toLowerCase();
    return savedConfigs.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.config?.deviceName && item.config.deviceName.toLowerCase().includes(q))
    );
  }, [savedConfigs, savedSearchQuery]);

  // Auth Handlers
  const handleLogin = async (asGuest = false) => {
    const profile = {
      name: asGuest ? 'Xạ Thủ Free Fire' : (tempName || 'Pro Player FF'),
      rank: 'Huyền Thoại ★★★',
      avatarLetter: asGuest ? 'FF' : (tempName ? tempName.charAt(0).toUpperCase() : 'VIP'),
      isLoggedIn: true,
    };
    setUserProfile(profile);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
    setCurrentScreen('MainApp');
    setActiveTab('HomeTab');
  };

  const handleLogout = async () => {
    const updated = { ...userProfile, isLoggedIn: false };
    setUserProfile(updated);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(updated));
    setCurrentScreen('Auth');
  };

  // Render Sliders in Detail View
  const renderFFSlider = (label, value) => {
    const percentage = Math.min(100, Math.max(0, (value / 200) * 100));
    return (
      <View style={styles.ffSliderContainer}>
        <View style={styles.sliderHeaderRow}>
          <Text style={styles.ffSliderLabel}>{label}</Text>
          <Text style={styles.ffSliderValue}>{value}</Text>
        </View>
        <View style={styles.ffTrackBackground}>
          <View style={[styles.ffTrackProgress, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  // ================= 1. AUTH SCREEN (COSMIC SCI-FI TAC) =================
  if (currentScreen === 'Auth') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        {/* Cosmic Background Elements */}
        <View style={styles.authCard}>
          <View style={styles.tacticalCornerTL} />
          <View style={styles.tacticalCornerBR} />

          <View style={styles.authLogoBadge}>
            <Text style={styles.authLogoIcon}>🎯</Text>
          </View>
          <Text style={styles.authTitle}>ĐỘ NHẠY FF PRO</Text>
          <Text style={styles.authSubtitle}>/// COSMIC GALAXY TACTICAL HUD 2026 ///</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên Nhân Vật / IGN</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên nhân vật trong game..."
              placeholderTextColor={COLORS.textMuted}
              value={tempName}
              onChangeText={setTempName}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => handleLogin(false)}>
            <Text style={styles.primaryButtonText}>⚡ KÍCH HOẠT HỆ THỐNG</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleLogin(true)}>
            <Text style={styles.secondaryButtonText}>Chơi Với Tư Cách Khách</Text>
          </TouchableOpacity>

          <Text style={styles.authFooterText}>
            ✓ Thuật toán Ma Trận 5D  •  ✓ Chuẩn Headshot Esports  •  ✓ 100% Sạch
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ================= 2. MAIN APP SCREENS =================
  const renderTabContent = () => {
    switch (activeTab) {
      // ---------------- TAB 1: TRANG CHỦ COSMIC GALAXY ----------------
      case 'HomeTab':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Header Cosmic HUD */}
            <View style={styles.homeHeaderRow}>
              <View>
                <Text style={styles.greetingText}>Xin chào, {userProfile.name} 👋</Text>
                <Text style={styles.rankBadgeText}>🏆 {userProfile.rank} • [TAC-ONLINE]</Text>
              </View>
              <TouchableOpacity
                style={styles.headerAvatar}
                onPress={() => setActiveTab('AccountTab')}>
                <Text style={styles.headerAvatarText}>{userProfile.avatarLetter}</Text>
              </TouchableOpacity>
            </View>

            {/* Banner Vũ Trụ Sci-Fi Tactical */}
            <View style={styles.cyberBanner}>
              <View style={styles.tacticalDecalRow}>
                <Text style={styles.tacticalDecalText}>/// GALAXY HEADSHOT CORE 2026 ///</Text>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>OB MỚI NHẤT</Text>
                </View>
              </View>
              <Text style={styles.bannerTitle}>THUẬT TOÁN MA TRẬN 5D</Text>
              <Text style={styles.bannerDesc}>
                Phân tích tần số quét, lực vuốt ngón tay và phụ kiện màn hình để khóa cứng tâm vào đầu địch.
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  setActiveTab('SensitivityTab');
                  setSensSubScreen('BrandList');
                }}>
                <Text style={styles.bannerActionBtnText}>CHỌN 230+ THIẾT BỊ →</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Dashboard */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{MOCK_DATA.length}+</Text>
                <Text style={styles.statLabel}>Thiết Bị</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.accentGreen }]}>99.4%</Text>
                <Text style={styles.statLabel}>Chuẩn Đầu</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.secondary }]}>200</Text>
                <Text style={styles.statLabel}>Thang Chuẩn</Text>
              </View>
            </View>

            {/* Quick Access Tools */}
            <Text style={styles.sectionTitle}>🛠️ CÔNG CỤ TÁC CHIẾN</Text>
            <View style={styles.quickToolsRow}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  setActiveTab('GeneratorTab');
                }}>
                <Text style={styles.toolIcon}>⚡</Text>
                <Text style={styles.toolTitle}>Tạo Độ Nhạy 5D</Text>
                <Text style={styles.toolDesc}>Cá nhân hóa theo tay & máy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  setActiveTab('AccountTab');
                }}>
                <Text style={styles.toolIcon}>💾</Text>
                <Text style={styles.toolTitle}>Cấu Hình Đã Lưu ({savedConfigs.length})</Text>
                <Text style={styles.toolDesc}>Đổi tên & quản lý không giới hạn</Text>
              </TouchableOpacity>
            </View>

            {/* Cẩm Nang Kéo Tâm Pro */}
            <Text style={styles.sectionTitle}>💡 BÍ QUYẾT KÉO TÂM ESPORTS</Text>
            {PRO_TIPS.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipBadge}>{tip.badge}</Text>
                  <Text style={styles.tipTitleText}>{tip.title}</Text>
                </View>
                <Text style={styles.tipDescText}>{tip.desc}</Text>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        );

      // ---------------- TAB 2: ĐỘ NHẠY (BỘ SƯU TẬP 230 MÁY) ----------------
      case 'SensitivityTab':
        // Sub-screen 1: Brand List & Search
        if (sensSubScreen === 'BrandList') {
          return (
            <View style={styles.tabContent}>
              <Text style={styles.screenMainTitle}>🎯 KHO THIẾT BỊ FREE FIRE</Text>
              <Text style={styles.screenSubTitle}>Chọn thương hiệu máy của bạn hoặc tìm kiếm nhanh:</Text>

              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên máy (vd: K70, iPhone 16, S24...)"
                  placeholderTextColor={COLORS.textMuted}
                  value={globalSearchQuery}
                  onChangeText={setGlobalSearchQuery}
                />
                {globalSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setGlobalSearchQuery('')}>
                    <Text style={{ color: COLORS.textMuted, paddingHorizontal: 8 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {globalSearchQuery.trim().length > 0 ? (
                <FlatList
                  data={globalFilteredDevices}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>🔍</Text>
                      <Text style={styles.emptyTitle}>Không tìm thấy dòng máy này</Text>
                      <Text style={styles.emptyDesc}>Hãy thử dùng tính năng "Tạo Độ Nhạy 5D" ở Tab Công cụ nhé!</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.deviceItemCard}
                      onPress={() => {
                        setSelectedConfig(item);
                        setSensSubScreen('DetailView');
                      }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceBrandBadge}>{item.brand}</Text>
                        <Text style={styles.deviceItemTitle}>{item.deviceName}</Text>
                        <Text style={styles.deviceItemSubtitle}>
                          🎯 {item.dragType}  •  ⚡ DPI: {item.dpi}
                        </Text>
                      </View>
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillText}>{item.general}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={BRANDS}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.brandItemCard}
                      onPress={() => {
                        setSelectedBrand(item.name);
                        setSensSubScreen('SubSeriesList');
                      }}>
                      <View style={styles.brandCardLeft}>
                        <View style={styles.brandIconCircle}>
                          <Text style={styles.brandIconText}>{item.icon}</Text>
                        </View>
                        <View>
                          <Text style={styles.brandTitleText}>{item.name}</Text>
                          <Text style={styles.brandSubText}>{item.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.brandArrow}>➔</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          );
        }

        // Sub-screen 2: Phân cấp dòng máy
        if (sensSubScreen === 'SubSeriesList') {
          const subList = SUB_SERIES_MAP[selectedBrand] || [];
          return (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => setSensSubScreen('BrandList')}>
                <Text style={styles.backButtonText}>← Quay Lại Hãng Khác</Text>
              </TouchableOpacity>

              <Text style={styles.screenMainTitle}>Hãng: {selectedBrand}</Text>
              <Text style={styles.screenSubTitle}>Chọn phân khúc dòng máy bạn đang dùng:</Text>

              <FlatList
                data={subList}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.brandItemCard}
                    onPress={() => {
                      setSelectedSubSeries(item.code);
                      setDeviceSearchQuery('');
                      setSensSubScreen('DeviceList');
                    }}>
                    <View>
                      <Text style={styles.brandTitleText}>{item.name}</Text>
                      <Text style={styles.brandSubText}>Nhấn để xem các mẫu máy cụ thể</Text>
                    </View>
                    <Text style={styles.brandArrow}>➔</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }

        // Sub-screen 3: Danh sách thiết bị cụ thể
        if (sensSubScreen === 'DeviceList') {
          return (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => setSensSubScreen('SubSeriesList')}>
                <Text style={styles.backButtonText}>← Quay Lại Phân Khúc</Text>
              </TouchableOpacity>

              <Text style={styles.screenMainTitle}>Danh Sách Máy ({filteredData.length})</Text>
              <Text style={styles.screenSubTitle}>Đã qua kiểm thử thực tế phòng tập Esports:</Text>

              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Lọc máy trong danh mục..."
                  placeholderTextColor={COLORS.textMuted}
                  value={deviceSearchQuery}
                  onChangeText={setDeviceSearchQuery}
                />
              </View>

              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItemCard}
                    onPress={() => {
                      setSelectedConfig(item);
                      setSensSubScreen('DetailView');
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceBrandBadge}>{item.brand}</Text>
                      <Text style={styles.deviceItemTitle}>{item.deviceName}</Text>
                      <Text style={styles.deviceItemSubtitle}>
                        🎯 {item.dragType}  •  Nút: {item.buttonSize}%
                      </Text>
                    </View>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>{item.general}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }

        // Sub-screen 4: Chi tiết cấu hình + Mô phỏng nút bắn HUD
        if (sensSubScreen === 'DetailView' && selectedConfig) {
          const generalVal = selectedConfig.general || 188;
          const redDotVal = selectedConfig.redDot || 174;
          const scope2x = selectedConfig.scope2x || Math.max(70, redDotVal - 6);
          const scope4x = selectedConfig.scope4x || Math.max(60, redDotVal - 14);
          const scopeAWM = selectedConfig.awm || Math.max(40, Math.round(generalVal * 0.40));
          const freeLook = selectedConfig.freeLook || Math.max(70, generalVal - 45);
          const btnSize = selectedConfig.buttonSize || 43;
          const hudCoord = selectedConfig.hudPos || 'Cách đáy 12% • Cách phải 19%';

          return (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => {
                  if (globalSearchQuery.trim()) {
                    setSensSubScreen('BrandList');
                  } else {
                    setSensSubScreen('DeviceList');
                  }
                }}>
                <Text style={styles.backButtonText}>← Quay Lại Danh Sách</Text>
              </TouchableOpacity>

              <View style={styles.detailHeaderCard}>
                <View style={styles.tacticalCornerTL} />
                <View style={styles.tacticalCornerBR} />
                <Text style={styles.detailBrandTag}>{selectedConfig.brand}</Text>
                <Text style={styles.detailTitle}>{selectedConfig.deviceName}</Text>
                <Text style={styles.detailAuthor}>Hiệu chuẩn: Esports Headshot Lab 2026</Text>
              </View>

              {/* Bảng thông số trong game */}
              <Text style={styles.sectionTitle}>🎯 CÀI ĐẶT ĐỘ NHẠY TRONG GAME (THANG 200)</Text>
              <View style={styles.inGamePanel}>
                {renderFFSlider('Nhìn xung quanh (General)', generalVal)}
                {renderFFSlider('Red Dot Sight (Ống ngắm đỏ)', redDotVal)}
                {renderFFSlider('Ống ngắm 2X', scope2x)}
                {renderFFSlider('Ống ngắm 4X', scope4x)}
                {renderFFSlider('Ống ngắm Súng ngắm (AWM / M82B)', scopeAWM)}
                {renderFFSlider('Góc nhìn tự do (Mắt)', freeLook)}
              </View>

              {/* Thông số hệ thống & Mô phỏng nút bắn */}
              <Text style={styles.sectionTitle}>⚙️ THIẾT LẬP HỆ THỐNG MÁY & HUD</Text>
              <View style={styles.hardwareCard}>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>DPI Khuyên Dùng:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.secondary }]}>{selectedConfig.dpi}</Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>Kích thước nút bắn:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.secondary }]}>{btnSize}% (Chuẩn Pro)</Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>Vị trí đặt nút bắn (HUD):</Text>
                  <Text style={styles.hardwareValue}>{hudCoord}</Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>Kiểu kéo tâm khuyên dùng:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.accentGreen }]}>
                    {selectedConfig.dragType || 'Kéo dứt khoát'}
                  </Text>
                </View>
              </View>

              {/* MÔ PHỎNG NÚT BẮN HUD (FIRE BUTTON VISUALIZER) */}
              <Text style={styles.sectionTitle}>🔘 MÔ PHỎNG NÚT BẮN & HƯỚNG VUỐT TÂM</Text>
              <View style={styles.hudSimulatorBox}>
                <View style={styles.hudCrosshair}>
                  <Text style={{ color: COLORS.cyanTactical, fontSize: 18 }}>┼</Text>
                  <Text style={styles.hudCrosshairText}>Đầu Mục Tiêu</Text>
                </View>

                {/* Hướng kéo */}
                <View style={styles.dragArrowContainer}>
                  <Text style={styles.dragArrowText}>▲</Text>
                  <Text style={styles.dragArrowLabel}>{selectedConfig.dragType || 'Hất mạnh'}</Text>
                </View>

                {/* Nút bắn mô phỏng kích thước thực */}
                <View
                  style={[
                    styles.simulatedFireButton,
                    {
                      width: btnSize * 1.5,
                      height: btnSize * 1.5,
                      borderRadius: (btnSize * 1.5) / 2,
                    },
                  ]}>
                  <Text style={styles.fireIcon}>🔥</Text>
                  <Text style={styles.simulatedSizeText}>{btnSize}%</Text>
                </View>
              </View>

              {/* Nút Lưu & Chia sẻ */}
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={styles.saveActionButton}
                  onPress={() => handleOpenSaveModal(selectedConfig)}>
                  <Text style={styles.actionButtonText}>💾 LƯU CẤU HÌNH NÀY</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareActionButton}
                  onPress={() => handleShareSensitivity(selectedConfig)}>
                  <Text style={styles.shareActionButtonText}>📤 CHIA SẺ THÔNG SỐ</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          );
        }
        return null;

      // ---------------- TAB 3: TẠO ĐỘ NHẠY BẰNG AI (MA TRẬN 5D) ----------------
      case 'GeneratorTab':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenMainTitle}>⚡ BỘ TẠO ĐỘ NHẠY MA TRẬN 5D</Text>
            <Text style={styles.screenSubTitle}>
              Thuật toán 5 chiều: Loại máy • Tần số quét • Lực vuốt tay • Phụ kiện • Vũ khí tủ
            </Text>

            {/* 1. Chọn Dòng Máy */}
            <Text style={styles.fieldSectionTitle}>1. Phân loại cấu hình thiết bị</Text>
            <View style={styles.chipRow}>
              {['iPhone / iPad', 'Android Flagship', 'Android Trung', 'Máy Cấu Hình Yếu'].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, genDeviceType === item && styles.activeChip]}
                    onPress={() => setGenDeviceType(item)}>
                    <Text
                      style={[
                        styles.chipText,
                        genDeviceType === item && styles.activeChipText,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* 2. Chọn Tần Số Quét */}
            <Text style={styles.fieldSectionTitle}>2. Tần số quét màn hình (Hz)</Text>
            <View style={styles.chipRow}>
              {['60Hz', '90Hz', '120Hz+', '144Hz'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, genRefreshRate === item && styles.activeChip]}
                  onPress={() => setGenRefreshRate(item)}>
                  <Text
                    style={[
                      styles.chipText,
                      genRefreshRate === item && styles.activeChipText,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Lực vuốt tay của người chơi */}
            <Text style={styles.fieldSectionTitle}>3. Lực vuốt tay thực tế của bạn</Text>
            <View style={styles.chipRow}>
              {['Vuốt Mạnh (Dứt Khoát)', 'Vuốt Vừa (Chuẩn)', 'Vuốt Nhẹ (Lười Vuốt)'].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, genDragForce === item && styles.activeChip]}
                    onPress={() => setGenDragForce(item)}>
                    <Text
                      style={[
                        styles.chipText,
                        genDragForce === item && styles.activeChipText,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* 4. Phụ kiện bề mặt màn hình */}
            <Text style={styles.fieldSectionTitle}>4. Phụ kiện & Độ trơn màn hình</Text>
            <View style={styles.chipRow}>
              {['Kính Bóng Thường', 'Cường Lực Nhám', 'Bao Ngón Tay Gaming', 'Màn Hình Trần'].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, genFriction === item && styles.activeChip]}
                    onPress={() => setGenFriction(item)}>
                    <Text
                      style={[
                        styles.chipText,
                        genFriction === item && styles.activeChipText,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* 5. Dòng súng sở trường */}
            <Text style={styles.fieldSectionTitle}>5. Vũ khí tủ của bạn</Text>
            <View style={styles.chipRow}>
              {[
                'Shotgun (M1887, M1014)',
                'SMG Sấy (MP40, UMP)',
                'Súng Trường (AK, Scar)',
                'Gõ 1 Viên (Woodpecker, SVD)',
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, genWeapon === item && styles.activeChip]}
                  onPress={() => setGenWeapon(item)}>
                  <Text
                    style={[
                      styles.chipText,
                      genWeapon === item && styles.activeChipText,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nút Tạo */}
            <TouchableOpacity style={styles.calcButton} onPress={calculateAutoSensitivity}>
              <Text style={styles.calcButtonText}>⚡ TÍNH TOÁN ĐỘ NHẠY MA TRẬN 5D</Text>
            </TouchableOpacity>

            {/* Kết quả AI */}
            {generatedResult && (
              <View style={styles.generatedResultCard}>
                <View style={styles.tacticalCornerTL} />
                <View style={styles.tacticalCornerBR} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={styles.generatedBadge}>
                    <Text style={styles.generatedBadgeText}>KẾT QUẢ AI TỐI ƯU</Text>
                  </View>
                  <Text style={{ color: COLORS.accentGreen, fontSize: 11, fontWeight: 'bold' }}>
                    {generatedResult.headshotRate}
                  </Text>
                </View>
                <Text style={styles.generatedTitle}>{generatedResult.deviceName}</Text>

                <View style={styles.generatedGrid}>
                  <View style={styles.genGridItem}>
                    <Text style={styles.genGridLabel}>Nhìn xung quanh</Text>
                    <Text style={styles.genGridValue}>{generatedResult.general}</Text>
                  </View>
                  <View style={styles.genGridItem}>
                    <Text style={styles.genGridLabel}>Red Dot Sight</Text>
                    <Text style={styles.genGridValue}>{generatedResult.redDot}</Text>
                  </View>
                  <View style={styles.genGridItem}>
                    <Text style={styles.genGridLabel}>Ống ngắm 2X / 4X</Text>
                    <Text style={styles.genGridValue}>{generatedResult.scope2x} / {generatedResult.scope4x}</Text>
                  </View>
                  <View style={styles.genGridItem}>
                    <Text style={styles.genGridLabel}>Nút Bắn Chuẩn</Text>
                    <Text style={styles.genGridValue}>{generatedResult.buttonSize}%</Text>
                  </View>
                </View>

                <View style={styles.genDragBox}>
                  <Text style={styles.genDragLabel}>DPI Khuyên Dùng:</Text>
                  <Text style={[styles.genDragValue, { color: COLORS.secondary }]}>{generatedResult.dpi}</Text>
                </View>

                <View style={styles.genDragBox}>
                  <Text style={styles.genDragLabel}>Vị trí nút (HUD):</Text>
                  <Text style={styles.genDragValue}>{generatedResult.hudPos}</Text>
                </View>

                <View style={styles.genDragBox}>
                  <Text style={styles.genDragLabel}>Kỹ thuật vuốt:</Text>
                  <Text style={[styles.genDragValue, { color: COLORS.accentGreen }]}>{generatedResult.dragType}</Text>
                </View>

                <View style={styles.actionButtonGroup}>
                  <TouchableOpacity
                    style={styles.saveActionButton}
                    onPress={() => handleOpenSaveModal(generatedResult)}>
                    <Text style={styles.actionButtonText}>💾 LƯU CẤU HÌNH (ĐẶT TÊN)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareActionButton}
                    onPress={() => handleShareSensitivity(generatedResult)}>
                    <Text style={styles.shareActionButtonText}>📤 CHIA SẺ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        );

      // ---------------- TAB 4: TÀI KHOẢN & QUẢN LÝ CẤU HÌNH (MULTI-SAVE) ----------------
      case 'AccountTab':
        const displayedList = showAllSaved ? filteredSavedConfigs : filteredSavedConfigs.slice(0, 5);

        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenMainTitle}>👤 HỒ SƠ & BỘ NHỚ CHIẾN THUẬT</Text>
            <Text style={styles.screenSubTitle}>Lưu & đổi tên không giới hạn các bộ độ nhạy của bạn</Text>

            {/* Profile Card */}
            <View style={styles.profileBox}>
              <View style={styles.tacticalCornerTL} />
              <View style={styles.tacticalCornerBR} />
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{userProfile.avatarLetter}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                <Text style={styles.profileRank}>{userProfile.rank}</Text>
                <Text style={styles.profileStatus}>Trạng thái: Sẵn sàng leo rank Thách Đấu</Text>
              </View>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => {
                  setTempName(userProfile.name);
                  setTempRank(userProfile.rank);
                  setIsEditProfileVisible(true);
                }}>
                <Text style={styles.editProfileBtnText}>SỬA</Text>
              </TouchableOpacity>
            </View>

            {/* Cấu hình đã lưu */}
            <View style={styles.savedSectionHeader}>
              <Text style={styles.savedSectionTitle}>
                ⭐ CẤU HÌNH CỦA TÔI ({savedConfigs.length})
              </Text>
            </View>

            {/* Tìm kiếm cấu hình đã lưu */}
            {savedConfigs.length > 2 && (
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm trong các cấu hình đã lưu..."
                  placeholderTextColor={COLORS.textMuted}
                  value={savedSearchQuery}
                  onChangeText={setSavedSearchQuery}
                />
              </View>
            )}

            {savedConfigs.length === 0 ? (
              <View style={styles.emptySavedBox}>
                <Text style={styles.emptySavedIcon}>🛸</Text>
                <Text style={styles.emptySavedText}>Chưa có cấu hình nào trong bộ nhớ.</Text>
                <Text style={styles.emptySavedSubText}>
                  Hãy vào tab "Độ Nhạy" hoặc "Tạo 5D" và bấm "Lưu cấu hình" để đặt tên và lưu lại nhé!
                </Text>
              </View>
            ) : (
              <>
                {displayedList.map((item) => (
                  <View key={item.id} style={styles.savedConfigCard}>
                    <View style={styles.tacticalCornerTL} />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.savedItemTitle}>{item.title}</Text>
                      <Text style={styles.savedItemDate}>🕒 Ngày lưu: {item.date}</Text>
                      <Text style={styles.savedItemStats}>
                        Nhìn: <Text style={{ color: COLORS.secondary }}>{item.config?.general}</Text>  |
                        RedDot: <Text style={{ color: COLORS.secondary }}>{item.config?.redDot}</Text>  |
                        Nút: <Text style={{ color: COLORS.accentGreen }}>{item.config?.buttonSize}%</Text>  |
                        DPI: {item.config?.dpi}
                      </Text>
                    </View>
                    <View style={styles.savedCardActions}>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => {
                          setSelectedConfig(item.config);
                          setActiveTab('SensitivityTab');
                          setSensSubScreen('DetailView');
                        }}>
                        <Text style={styles.viewBtnText}>XEM</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.renameBtn}
                        onPress={() => handleOpenRenameModal(item)}>
                        <Text style={styles.renameBtnText}>ĐỔI TÊN</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.delBtn}
                        onPress={() => handleDeleteConfig(item.id, item.title)}>
                        <Text style={styles.delBtnText}>XÓA</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {filteredSavedConfigs.length > 5 && (
                  <TouchableOpacity
                    style={styles.toggleSavedBtn}
                    onPress={() => setShowAllSaved(!showAllSaved)}>
                    <Text style={styles.toggleSavedBtnText}>
                      {showAllSaved
                        ? '▲ Thu gọn danh sách'
                        : `▼ Xem thêm ${filteredSavedConfigs.length - 5} cấu hình khác...`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Menu chính sách & an toàn */}
            <View style={styles.menuList}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() =>
                  Alert.alert(
                    '📜 Cam Kết An Toàn',
                    '1. Mọi thông số đều được tinh chỉnh dựa trên độ nhạy gốc của Free Fire.\n2. Ứng dụng TUYỆT ĐỐI không can thiệp, chỉnh sửa file .obb hay dùng phần mềm gian lận.\n3. Hoàn toàn an toàn cho tài khoản cá nhân.'
                  )
                }>
                <Text style={styles.menuRowText}>🛡️ Cam kết an toàn & Chống khóa tài khoản</Text>
                <Text style={styles.brandArrow}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() =>
                  Alert.alert(
                    '📱 Hướng dẫn chỉnh DPI an toàn',
                    '• Android: Cài đặt > Tùy chọn nhà phát triển > Chiều rộng tối thiểu > Nhập số DPI theo bảng.\n• iOS: Cài đặt > Trợ năng > Điều khiển công tắc > Tốc độ con trượt (đặt 120).'
                  )
                }>
                <Text style={styles.menuRowText}>📖 Hướng dẫn mở DPI chi tiết theo máy</Text>
                <Text style={styles.brandArrow}>➔</Text>
              </TouchableOpacity>
            </View>

            {/* Nút đăng xuất */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>ĐĂNG XUẤT TÀI KHOẢN</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Main Tab View */}
      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      {/* Bottom Navigation Bar (Cosmic Sci-Fi Tactical) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('HomeTab')}>
          <Text style={[styles.navIcon, activeTab === 'HomeTab' && styles.activeNavText]}>🏠</Text>
          <Text style={[styles.navLabel, activeTab === 'HomeTab' && styles.activeNavText]}>
            Trang Chủ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('SensitivityTab');
            setSensSubScreen('BrandList');
            setGlobalSearchQuery('');
          }}>
          <Text style={[styles.navIcon, activeTab === 'SensitivityTab' && styles.activeNavText]}>
            🎯
          </Text>
          <Text style={[styles.navLabel, activeTab === 'SensitivityTab' && styles.activeNavText]}>
            Độ Nhạy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('GeneratorTab')}>
          <Text style={[styles.navIcon, activeTab === 'GeneratorTab' && styles.activeNavText]}>
            ⚡
          </Text>
          <Text style={[styles.navLabel, activeTab === 'GeneratorTab' && styles.activeNavText]}>
            Tạo 5D
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('AccountTab')}>
          <Text style={[styles.navIcon, activeTab === 'AccountTab' && styles.activeNavText]}>
            👤
          </Text>
          <Text style={[styles.navLabel, activeTab === 'AccountTab' && styles.activeNavText]}>
            Tài Khoản
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: ĐẶT TÊN KHI LƯU CẤU HÌNH (LƯU KHÔNG GIỚI HẠN) */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.tacticalCornerTL} />
            <View style={styles.tacticalCornerBR} />

            <Text style={styles.modalTitle}>💾 LƯU CẤU HÌNH CHIẾN ĐẤU</Text>
            <Text style={styles.modalSubDesc}>
              Đặt tên riêng để phân biệt các bộ độ nhạy (bắn giải, solo shotgun, sấy tầm gần...):
            </Text>

            <Text style={styles.modalFieldLabel}>Tên Cấu Hình Của Bạn</Text>
            <TextInput
              style={styles.modalInput}
              value={inputConfigName}
              onChangeText={setInputConfigName}
              placeholder="VD: Shotgun One-Shot Bắn Giải..."
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Quick Tag Suggestions */}
            <Text style={styles.tagSectionLabel}>Gợi ý tên nhanh:</Text>
            <View style={styles.tagRow}>
              {['🔥 Bắn Giải', '🎯 Shotgun One-Shot', '⚡ Sấy MP40', '🏆 Leo Thách Đấu', '👑 Solo 1vs1'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagPill}
                  onPress={() => setInputConfigName(`${tag} • ${configPendingSave?.deviceName?.split(' ')[0] || 'FF'}`)}>
                  <Text style={styles.tagPillText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsSaveModalVisible(false)}>
                <Text style={styles.modalCancelText}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleConfirmSave}>
                <Text style={styles.modalSaveText}>LƯU VÀO KHO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ĐỔI TÊN CẤU HÌNH ĐÃ LƯU */}
      <Modal visible={isRenameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.tacticalCornerTL} />
            <View style={styles.tacticalCornerBR} />

            <Text style={styles.modalTitle}>✏️ ĐỔI TÊN CẤU HÌNH</Text>
            <Text style={styles.modalSubDesc}>Nhập tên mới cho bộ độ nhạy này:</Text>

            <TextInput
              style={styles.modalInput}
              value={inputRenameName}
              onChangeText={setInputRenameName}
              placeholder="Nhập tên mới..."
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRenameModalVisible(false)}>
                <Text style={styles.modalCancelText}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleConfirmRename}>
                <Text style={styles.modalSaveText}>CẬP NHẬT TÊN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CHỈNH SỬA PROFILE */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.tacticalCornerTL} />
            <View style={styles.tacticalCornerBR} />

            <Text style={styles.modalTitle}>👤 CHỈNH SỬA HỒ SƠ</Text>

            <Text style={styles.modalFieldLabel}>Tên Hiển Thị / IGN</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Nhập tên mới..."
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.modalFieldLabel}>Xếp Hạng (Rank)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempRank}
              onChangeText={setTempRank}
              placeholder="VD: Thách Đấu, Đại Cao Thủ..."
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditProfileVisible(false)}>
                <Text style={styles.modalCancelText}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={async () => {
                  const updated = {
                    ...userProfile,
                    name: tempName || userProfile.name,
                    rank: tempRank || userProfile.rank,
                    avatarLetter: (tempName || userProfile.name).charAt(0).toUpperCase(),
                  };
                  setUserProfile(updated);
                  await AsyncStorage.setItem('@user_profile', JSON.stringify(updated));
                  setIsEditProfileVisible(false);
                }}>
                <Text style={styles.modalSaveText}>LƯU THAY ĐỔI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ================= STYLES: COSMIC GALAXY X FREE FIRE SCI-FI TACTICAL =================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Tactical Corner Accents (Hiệu ứng viền vát góc sắc nhọn Sci-Fi)
  tacticalCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.secondary,
  },
  tacticalCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },

  // Auth Screen Styles
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4, // Sharp chamfered edges
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  authLogoBadge: {
    width: 68,
    height: 68,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 98, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowRadius: 12,
    shadowOpacity: 0.8,
  },
  authLogoIcon: {
    fontSize: 34,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 98, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  authSubtitle: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 4, // Sharp tactical
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  authFooterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },

  // Home Header
  homeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rankBadgeText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 4, // Sharp sci-fi
    backgroundColor: COLORS.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowRadius: 8,
    shadowOpacity: 0.6,
  },
  headerAvatarText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 16,
  },

  // Cosmic Galaxy Cyber Banner
  cyberBanner: {
    backgroundColor: '#120926',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  tacticalDecalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tacticalDecalText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  bannerBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  bannerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  bannerActionBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  bannerActionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Quick Tools
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.secondary,
    marginVertical: 12,
    letterSpacing: 1,
  },
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toolCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  toolTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  toolDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  // Tips
  tipCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  tipTitleText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  tipDescText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Common Screen Titles
  screenMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    marginTop: 6,
    letterSpacing: 1,
  },
  screenSubTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 10,
    fontSize: 13,
  },

  // Brand Cards
  brandItemCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  brandCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  brandIconText: {
    fontSize: 18,
  },
  brandTitleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  brandSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  brandArrow: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Back Button
  backButtonRow: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Device List Cards
  deviceItemCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  deviceBrandBadge: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceItemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  deviceItemSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  scorePill: {
    backgroundColor: 'rgba(255, 98, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  scorePillText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 15,
  },

  // Detail View Cards
  detailHeaderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    position: 'relative',
  },
  detailBrandTag: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  detailAuthor: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // Sliders Panel
  inGamePanel: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    marginBottom: 16,
  },
  ffSliderContainer: {
    marginBottom: 14,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ffSliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  ffSliderValue: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  ffTrackBackground: {
    height: 8,
    backgroundColor: '#0F0922',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  ffTrackProgress: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Hardware Card
  hardwareCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    marginBottom: 16,
  },
  hardwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(85, 54, 150, 0.3)',
  },
  hardwareLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  hardwareValue: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // HUD Simulator Box
  hudSimulatorBox: {
    backgroundColor: '#0A0518',
    borderRadius: 4,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    marginBottom: 20,
    minHeight: 180,
  },
  hudCrosshair: {
    alignItems: 'center',
    marginBottom: 8,
  },
  hudCrosshairText: {
    color: COLORS.cyanTactical,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: -2,
  },
  dragArrowContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  dragArrowText: {
    color: COLORS.accentGreen,
    fontSize: 15,
    fontWeight: 'bold',
  },
  dragArrowLabel: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: 'bold',
  },
  simulatedFireButton: {
    backgroundColor: 'rgba(255, 98, 0, 0.25)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  fireIcon: {
    fontSize: 16,
  },
  simulatedSizeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Action Buttons
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  saveActionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowRadius: 8,
    shadowOpacity: 0.7,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  shareActionButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 6,
  },
  shareActionButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Generator Tab Styles
  fieldSectionTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  activeChip: {
    backgroundColor: 'rgba(255, 98, 0, 0.2)',
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  calcButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowRadius: 12,
    shadowOpacity: 0.8,
  },
  calcButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  generatedResultCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowRadius: 15,
    shadowOpacity: 0.6,
    position: 'relative',
  },
  generatedBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  generatedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  generatedTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  generatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  genGridItem: {
    width: '48%',
    backgroundColor: '#0F0922',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  genGridLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  genGridValue: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  genDragBox: {
    backgroundColor: '#0F0922',
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  genDragLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 6,
  },
  genDragValue: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Account Tab Styles
  profileBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    marginBottom: 16,
    position: 'relative',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  profileAvatarText: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '900',
  },
  profileName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  profileRank: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  profileStatus: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  editProfileBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  editProfileBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  savedSectionHeader: {
    marginVertical: 10,
  },
  savedSectionTitle: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptySavedBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    marginBottom: 16,
  },
  emptySavedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptySavedText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySavedSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  savedConfigCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    position: 'relative',
  },
  savedItemTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  savedItemDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  savedItemStats: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  savedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 2,
    marginRight: 4,
  },
  viewBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  renameBtn: {
    backgroundColor: '#321D5E',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
    marginRight: 4,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  renameBtnText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  delBtn: {
    backgroundColor: '#4D1515',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
  },
  delBtnText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleSavedBtn: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  toggleSavedBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  menuList: {
    marginTop: 10,
  },
  menuRow: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
  },
  menuRowText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#2A0E18',
    borderWidth: 1,
    borderColor: '#731C34',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#FF6B8B',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Bottom Navigation Bar
  bottomBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderHighlight,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeNavText: {
    color: COLORS.activeTab,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 5, 14, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 4,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowRadius: 15,
    shadowOpacity: 0.5,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalSubDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
  },
  modalFieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: 12,
    fontSize: 13,
  },
  tagSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#20123D',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginRight: 6,
    marginBottom: 6,
  },
  tagPillText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Empty Search States
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
