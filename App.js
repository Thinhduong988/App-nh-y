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
  Platform,
  KeyboardAvoidingView,
  Linking,
  NativeModules,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_VERSION,
  COLORS,
  THEME_ACCENTS,
  getAccentTheme,
} from './src/theme/colors';
import { BRANDS, SUB_SERIES_MAP, MOCK_DATA, PRO_TIPS } from './src/data/sensitivityData';
import TrainingAndHudStudio from './src/components/TrainingAndHudStudio';
import AiSensitivityCoach from './src/components/AiSensitivityCoach';
import AiChatBubble from './src/components/AiChatBubble';
import GameSpacePreview from './src/components/GameSpacePreview';

const { FloatingOverlayModule } = NativeModules;

export const THEME_ACCENT_COLORS = [
  { id: 'green', name: 'Xanh lá', hex: THEME_ACCENTS.green.primary, legacyHex: '#00FFA3' },
  { id: 'red', name: 'Đỏ', hex: THEME_ACCENTS.red.primary, legacyHex: '#FF3B30' },
  { id: 'purple', name: 'Tím', hex: THEME_ACCENTS.purple.primary, legacyHex: '#AF52DE' },
  { id: 'orange', name: 'Cam', hex: THEME_ACCENTS.orange.primary, legacyHex: '#FF6B00' },
  { id: 'yellow', name: 'Vàng', hex: THEME_ACCENTS.yellow.primary, legacyHex: '#FFCC00' },
];

const resolveAccentFromSavedValue = (value) => {
  if (!value) return THEME_ACCENTS.orange;
  const normalized = String(value).toLowerCase();
  const matched = THEME_ACCENT_COLORS.find(
    (c) =>
      c.id === normalized ||
      c.hex.toLowerCase() === normalized ||
      c.legacyHex.toLowerCase() === normalized
  );
  return getAccentTheme(matched ? matched.id : normalized);
};

export default function App() {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState('Splash'); // Splash, Auth, MainApp
  const [activeTab, setActiveTab] = useState('HomeTab'); // HomeTab, SensitivityTab, GeneratorTab, TrainingHudTab, AccountTab
  const [themeColor, setThemeColor] = useState(THEME_ACCENTS.orange.primary);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [bubbleResetTrigger, setBubbleResetTrigger] = useState(0);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const activeAccent = useMemo(() => resolveAccentFromSavedValue(themeColor), [themeColor]);

  // Safe Tab Switcher (Ensures portrait mode when navigating between tabs)
  const handleTabSwitch = async (tabName) => {
    if (isLandscapeMode) {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscapeMode(false);
      } catch (e) {}
    }
    if (tabName === 'SensitivityTab') {
      setSensSubScreen('BrandList');
      setGlobalSearchQuery('');
    }
    setActiveTab(tabName);
  };

  // Sensitivity Navigation
  const [sensSubScreen, setSensSubScreen] = useState('BrandList'); // BrandList, SubSeriesList, DeviceList, DetailView
  const [sensNavSource, setSensNavSource] = useState('BrandList'); // 'BrandList' | 'DeviceList' | 'HomeTab' | 'AccountTab'
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedSubSeries, setSelectedSubSeries] = useState('All');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [brandListFilter, setBrandListFilter] = useState('ALL'); // 'ALL' | '2026' | 'GAMING' | 'MIDRANGE' | 'BUDGET' | 'IOS'
  const [detailWeaponMode, setDetailWeaponMode] = useState('ALL'); // 'ALL' | 'SHOTGUN' | 'SMG'

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

  // Cloud Sensitivity OTA & App Update System
  const CURRENT_APP_VERSION = APP_VERSION;
  const [allSensitivityData, setAllSensitivityData] = useState(MOCK_DATA);
  const [cloudSensitivityMeta, setCloudSensitivityMeta] = useState(null);
  const [newReleaseInfo, setNewReleaseInfo] = useState(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const mergeSensitivityData = (cloudConfigs) => {
    if (!Array.isArray(cloudConfigs) || cloudConfigs.length === 0) return;
    setAllSensitivityData((prev) => {
      const cloudIds = new Set(cloudConfigs.map((c) => c.id));
      const kept = prev.filter((item) => !cloudIds.has(item.id));
      return [...cloudConfigs, ...kept];
    });
  };

  // Categorized Devices Memos
  const devices2026 = useMemo(() => {
    return allSensitivityData.filter((item) => item.is2026);
  }, [allSensitivityData]);

  const devicesGaming = useMemo(() => {
    return allSensitivityData.filter(
      (item) =>
        ['REDMAGIC', 'ROGPHONE', 'POCO', 'iQOO'].includes(item.brand) ||
        (item.deviceName &&
          (item.deviceName.includes('GT') ||
            item.deviceName.includes('Pro') ||
            item.deviceName.includes('Ultra')))
    );
  }, [allSensitivityData]);

  const devicesMidrange = useMemo(() => {
    return allSensitivityData.filter(
      (item) =>
        ['REDMI', 'Realme', 'Vivo', 'OPPO', 'Samsung'].includes(item.brand) && !item.is2026
    );
  }, [allSensitivityData]);

  const devicesBudget = useMemo(() => {
    return allSensitivityData.filter(
      (item) =>
        ['Infinix', 'Tecno'].includes(item.brand) ||
        (item.deviceName &&
          (item.deviceName.includes('C') ||
            item.deviceName.includes('A') ||
            item.deviceName.includes('Spark') ||
            item.deviceName.includes('Hot') ||
            item.deviceName.includes('Smart')))
    );
  }, [allSensitivityData]);

  const devicesIos = useMemo(() => {
    return allSensitivityData.filter((item) => item.brand === 'Apple');
  }, [allSensitivityData]);

  const featuredDevices = useMemo(() => {
    return (devices2026.length > 0 ? devices2026 : allSensitivityData).slice(0, 3);
  }, [devices2026, allSensitivityData]);

  // Edit Profile Modal
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempRank, setTempRank] = useState('');

  // Game Space Preview & Android Native Overlay Controls
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [showGameTurboModal, setShowGameTurboModal] = useState(false);

  const handleRequestAllPermissions = async () => {
    if (!FloatingOverlayModule) {
      Alert.alert(
        'Không khả dụng trên iOS',
        'Apple không cho phép ứng dụng tạo lớp phủ nổi (Draw over apps) trên màn hình Free Fire. Bạn có thể dùng bản xem trước Game Space trong ứng dụng.'
      );
      return;
    }
    try {
      const hasOverlay = await FloatingOverlayModule.checkPermission();
      if (!hasOverlay) {
        Alert.alert(
          '1. Quyền Xuất Hiện Trên Cùng',
          'Cần bật quyền này để menu GG Game Space có thể hiển thị nép sát mép trái khi bạn đang chơi Free Fire.',
          [
            { text: 'Bật ngay', onPress: () => FloatingOverlayModule.requestPermission() },
            { text: 'Bỏ qua', style: 'cancel' },
          ]
        );
        return;
      }

      const hasWrite = await FloatingOverlayModule.checkWriteSettingsPermission?.();
      if (!hasWrite) {
        Alert.alert(
          '2. Quyền Sửa Đổi Cài Đặt Hệ Thống',
          'Để tính năng Khóa xoay màn hình và Khóa độ sáng 100% trong menu có thể thực sự hoạt động trên máy, vui lòng bật quyền "Sửa đổi cài đặt hệ thống".',
          [
            {
              text: 'Cấp quyền ngay',
              onPress: () => FloatingOverlayModule.requestWriteSettingsPermission?.(),
            },
            { text: 'Bỏ qua', style: 'cancel' },
          ]
        );
        return;
      }

      const hasDnd = await FloatingOverlayModule.checkNotificationPolicyPermission?.();
      if (!hasDnd) {
        Alert.alert(
          '3. Quyền Chặn Thông Báo (Không Làm Phiền)',
          'Để tính năng Chặn thông báo trong menu thực sự tắt chuông/thông báo khi đang bắn Free Fire, vui lòng cấp quyền "Truy cập Không làm phiền".',
          [
            {
              text: 'Cấp quyền DND',
              onPress: () => FloatingOverlayModule.requestNotificationPolicyPermission?.(),
            },
            { text: 'Bỏ qua', style: 'cancel' },
          ]
        );
        return;
      }

      Alert.alert(
        '✅ Hoàn Tất!',
        'Ứng dụng đã có đầy đủ quyền hệ thống để toàn bộ tính năng GG Game Space hoạt động thực tế 100%!'
      );
    } catch (e) {
      console.log('handleRequestAllPermissions error', e);
    }
  };

  const toggleSystemFloatingOverlay = async () => {
    if (!FloatingOverlayModule) {
      setShowGameTurboModal(true);
      return;
    }
    try {
      const hasPerm = await FloatingOverlayModule.checkPermission();
      if (!hasPerm) {
        Alert.alert(
          'Cấp quyền hiển thị trên ứng dụng khác',
          'Để menu GG Game Space vòng cung hiển thị nép sát mép trái khi bạn đang chơi Free Fire, vui lòng bật quyền "Xuất hiện trên cùng".',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Bật quyền ngay', onPress: () => FloatingOverlayModule.requestPermission() },
          ]
        );
      } else {
        FloatingOverlayModule.startOverlay();
        Alert.alert(
          '⚡ Đã kích hoạt NOVO GG Game Space!',
          'Thanh gạt GG Game Space đã xuất hiện nép sát mép trái màn hình. Bấm vào thanh gạt để trượt mở menu vòng cung và trải nghiệm Tâm Ảo, Tăng Tốc FPS, Khóa Xoay, Sáng 100%.'
        );
      }
    } catch (e) {
      console.log(e);
      setShowGameTurboModal(true);
    }
  };

  const stopSystemFloatingOverlay = async () => {
    if (!FloatingOverlayModule) {
      setShowGameTurboModal(false);
      return;
    }
    try {
      FloatingOverlayModule.stopOverlay();
      Alert.alert('🔴 Đã tắt nút nổi', 'Nút nổi GG Game Space đã được đóng và gỡ khỏi màn hình.');
    } catch (e) {
      console.log(e);
    }
  };

  const handleLaunchGameWithOverlay = async (gameUrl, storeUrl) => {
    if (FloatingOverlayModule) {
      try {
        const hasPerm = await FloatingOverlayModule.checkPermission();
        if (hasPerm) {
          FloatingOverlayModule.startOverlay();
        } else {
          FloatingOverlayModule.requestPermission();
        }
      } catch (e) {
        console.log('Auto overlay on launch error', e);
      }
    }
    Linking.openURL(gameUrl).catch(() => {
      Linking.openURL(storeUrl).catch(() => {});
    });
  };

  const [configPendingSave, setConfigPendingSave] = useState(null);
  const [inputConfigName, setInputConfigName] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameTargetItem, setRenameTargetItem] = useState(null);
  const [inputRenameName, setInputRenameName] = useState('');

  // Kiểm tra cập nhật ứng dụng từ GitHub Releases
  const checkGitHubUpdates = async (isManual = false) => {
    if (isManual) setIsCheckingUpdate(true);
    try {
      const response = await fetch(
        'https://api.github.com/repos/Thinhduong988/App-nh-y/releases/latest'
      );
      if (response.ok) {
        const release = await response.json();
        if (release && release.tag_name) {
          const latestVer = release.tag_name.replace(/^v/, '').trim();
          if (latestVer !== CURRENT_APP_VERSION) {
            const apk = release.assets?.find((a) => a.name.endsWith('.apk'));
            const downloadUrl = apk ? apk.browser_download_url : release.html_url;
            setNewReleaseInfo({
              version: release.tag_name,
              title: release.name || `Bản phát hành ${release.tag_name}`,
              notes: release.body || 'Bản cập nhật tính năng mới từ nhà phát triển.',
              downloadUrl,
            });
            if (isManual) {
              Alert.alert(
                '🚀 Đã có bản mới!',
                `Phát hiện phiên bản ${release.tag_name}. Bạn có thể tải ngay.`
              );
            }
            return;
          }
        }
      }
      if (isManual) {
        Alert.alert(
          '✅ Đang ở bản mới nhất',
          `Ứng dụng của bạn (v${CURRENT_APP_VERSION}) đang là bản mới nhất. Dữ liệu độ nhạy AI vẫn được cập nhật tự động qua Cloud OTA!`
        );
      }
    } catch (e) {
      if (isManual) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến GitHub để kiểm tra bản mới.');
      }
    } finally {
      if (isManual) setIsCheckingUpdate(false);
    }
  };

  // Đồng bộ dữ liệu độ nhạy Cloud OTA
  const syncCloudSensitivity = async () => {
    try {
      const cached = await AsyncStorage.getItem('@online_sensitivity_db');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.cloudConfigs)) {
          setCloudSensitivityMeta(parsed);
          mergeSensitivityData(parsed.cloudConfigs);
        }
      }

      const rawUrl =
        'https://raw.githubusercontent.com/Thinhduong988/App-nh-y/main/src/data/onlineSensitivity.json?t=' +
        Date.now();
      const res = await fetch(rawUrl);
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && Array.isArray(cloudData.cloudConfigs)) {
          setCloudSensitivityMeta(cloudData);
          mergeSensitivityData(cloudData.cloudConfigs);
          await AsyncStorage.setItem('@online_sensitivity_db', JSON.stringify(cloudData));
        }
      }
    } catch (err) {
      console.log('Cloud sensitivity sync error (using local data)', err);
    }
  };

  // Initial Load from AsyncStorage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@my_saved_configs');
        if (savedData) setSavedConfigs(JSON.parse(savedData));

        const savedTheme = await AsyncStorage.getItem('@theme_accent_color');
        if (savedTheme) {
          setThemeColor(resolveAccentFromSavedValue(savedTheme).primary);
        }

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

        syncCloudSensitivity();
        checkGitHubUpdates(false);
      } catch (err) {
        console.error(err);
        setCurrentScreen('Auth');
      }
    };
    initializeApp();
  }, []);

  // OPEN SAVE MODAL
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

  // CONFIRM SAVE
  const handleConfirmSave = async () => {
    if (!configPendingSave) return;
    const finalTitle =
      inputConfigName.trim() || configPendingSave.deviceName || 'Cấu hình tùy chỉnh';

    try {
      const newConfigItem = {
        id: 'cfg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: finalTitle,
        brand: configPendingSave.brand || 'Custom',
        date: new Date().toLocaleDateString('vi-VN'),
        config: { ...configPendingSave, deviceName: finalTitle },
      };

      const updated = [newConfigItem, ...savedConfigs];
      setSavedConfigs(updated);
      await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));
      setIsSaveModalVisible(false);
      setConfigPendingSave(null);
      Alert.alert('💾 Đã Lưu Thành Công', `Cấu hình "${finalTitle}" đã được thêm vào kho cá nhân!`);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lưu cấu hình vào bộ nhớ máy.');
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
    if (!renameTargetItem) return;
    const newTitle = inputRenameName.trim();
    if (!newTitle) {
      Alert.alert('⚠️ Lưu ý', 'Vui lòng nhập tên cấu hình!');
      return;
    }
    const updated = savedConfigs.map((item) =>
      item.id === renameTargetItem.id ? { ...item, title: newTitle } : item
    );
    setSavedConfigs(updated);
    await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));
    setIsRenameModalVisible(false);
    setRenameTargetItem(null);
  };

  // DELETE CONFIG
  const handleDeleteConfig = (id, title) => {
    Alert.alert('🗑️ Xác Nhận Xóa', `Bạn có chắc chắn muốn xóa cấu hình "${title}" không?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const updated = savedConfigs.filter((item) => item.id !== id);
          setSavedConfigs(updated);
          await AsyncStorage.setItem('@my_saved_configs', JSON.stringify(updated));
        },
      },
    ]);
  };

  // SHARE CONFIG TEXT
  const handleShareSensitivity = async (config) => {
    const scope2x = config.scope2x || Math.max(70, (config.redDot || 180) - 6);
    const scope4x = config.scope4x || Math.max(60, (config.redDot || 180) - 14);
    const shareMsg = `🔥 ĐỘ NHẠY CHUẨN HEADSHOT (THANG 200) 🔥
📱 Máy: ${config.deviceName || config.name} (${config.brand || 'Free Fire'})
🎯 Nhìn xung quanh: ${config.general}
🔴 Red Dot: ${config.redDot}
🔭 2x Scope: ${scope2x} | 4x Scope: ${scope4x}
🔘 Nút bắn: ${config.buttonSize}% | ⚡ DPI: ${config.dpi}
📐 Kỹ thuật kéo: ${config.dragType}
---
Từ App Độ Nhạy Free Fire Pro v${CURRENT_APP_VERSION}`;

    try {
      await Share.share({ message: shareMsg });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Filtered devices for Sensitivity Tab
  const globalFilteredDevices = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return allSensitivityData.filter(
      (item) =>
        (item.deviceName || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q)
    );
  }, [globalSearchQuery, allSensitivityData]);

  const filteredData = useMemo(() => {
    return allSensitivityData.filter((item) => {
      const matchBrand =
        (item.brand || '').toLowerCase() === (selectedBrand || '').toLowerCase();
      const matchSeries = selectedSubSeries === 'All' || item.series === selectedSubSeries;
      const matchSearch =
        !deviceSearchQuery.trim() ||
        (item.deviceName || '').toLowerCase().includes(deviceSearchQuery.toLowerCase());
      return matchBrand && matchSeries && matchSearch;
    });
  }, [selectedBrand, selectedSubSeries, deviceSearchQuery, allSensitivityData]);

  const filteredSavedConfigs = useMemo(() => {
    if (!savedSearchQuery.trim()) return savedConfigs;
    const q = savedSearchQuery.toLowerCase();
    return savedConfigs.filter((item) => {
      const title = (item.title || item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const devName = (item.config?.deviceName || item.config?.name || '').toLowerCase();
      return title.includes(q) || brand.includes(q) || devName.includes(q);
    });
  }, [savedConfigs, savedSearchQuery]);

  // Auth Handlers
  const handleLogin = async (asGuest = false) => {
    const profile = {
      name: asGuest ? 'Xạ Thủ Free Fire' : tempName.trim() || 'Pro Player FF',
      rank: 'Huyền Thoại ★★★',
      avatarLetter: asGuest
        ? 'FF'
        : tempName.trim()
        ? tempName.trim().charAt(0).toUpperCase()
        : 'V',
      isLoggedIn: true,
    };
    setUserProfile(profile);
    setJustLoggedOut(false);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
    setCurrentScreen('MainApp');
    setActiveTab('HomeTab');
  };

  const confirmLogout = async () => {
    const updated = { ...userProfile, isLoggedIn: false };
    setUserProfile(updated);
    await AsyncStorage.setItem('@user_profile', JSON.stringify(updated));
    setIsLogoutModalVisible(false);
    setJustLoggedOut(true);
    setCurrentScreen('Auth');
  };

  const handleSelectThemeColor = async (colorHex) => {
    const resolved = resolveAccentFromSavedValue(colorHex).primary;
    setThemeColor(resolved);
    try {
      await AsyncStorage.setItem('@theme_accent_color', resolved);
    } catch (e) {
      console.warn('Failed to save theme color', e);
    }
  };

  // Render Sliders in Detail View
  const renderFFSlider = (label, value) => {
    const percentage = Math.min(100, Math.max(0, (value / 200) * 100));
    return (
      <View style={styles.ffSliderContainer}>
        <View style={styles.sliderHeaderRow}>
          <Text style={styles.ffSliderLabel}>{label}</Text>
          <Text style={[styles.ffSliderValue, { color: activeAccent.bright }]}>{value}</Text>
        </View>
        <View style={styles.ffTrackBackground}>
          <View
            style={[
              styles.ffTrackProgress,
              { width: `${percentage}%`, backgroundColor: activeAccent.primary },
            ]}
          />
        </View>
      </View>
    );
  };

  // Reusable Figma Device Configuration Card
  const renderDeviceSpecCard = (item, sourceNav = 'BrandList') => {
    const scope2x = item.scope2x || Math.max(70, (item.redDot || 180) - 6);
    const scope4x = item.scope4x || Math.max(60, (item.redDot || 180) - 14);
    const tierBadge = item.is2026 ? 'ESPORTS 2026' : item.brand === 'Apple' ? 'iOS PRO' : 'VERIFIED';

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        style={styles.deviceSpecCard}
        onPress={() => {
          if (item.brand) setSelectedBrand(item.brand);
          setSelectedConfig(item);
          setSensNavSource(sourceNav);
          setSensSubScreen('DetailView');
        }}>
        <View style={styles.deviceCardTopRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.deviceCardBrand}>{item.brand || 'Free Fire'}</Text>
            <Text style={styles.deviceCardTitle} numberOfLines={1}>
              {item.deviceName}
            </Text>
          </View>
          <View
            style={[
              styles.deviceTierBadge,
              { backgroundColor: activeAccent.light, borderColor: activeAccent.border },
            ]}>
            <Text style={[styles.deviceTierBadgeText, { color: activeAccent.bright }]}>
              {tierBadge}
            </Text>
          </View>
        </View>

        {/* 2x3 Metric Grid matching Figma 2_Do_Nhay_Tab */}
        <View style={styles.specGrid}>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>Nhìn XQ</Text>
            <Text style={[styles.specValue, { color: activeAccent.bright }]}>{item.general}</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>Red Dot</Text>
            <Text style={styles.specValue}>{item.redDot}</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>Ống 2X</Text>
            <Text style={styles.specValue}>{scope2x}</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>Ống 4X</Text>
            <Text style={styles.specValue}>{scope4x}</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>Nút Bắn</Text>
            <Text style={[styles.specValue, { color: COLORS.secondary }]}>{item.buttonSize}%</Text>
          </View>
          <View style={styles.specCell}>
            <Text style={styles.specLabel}>DPI</Text>
            <Text style={styles.specValue} numberOfLines={1}>
              {String(item.dpi || '480').split(' ')[0]}
            </Text>
          </View>
        </View>

        <View style={styles.deviceCardActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.cardPrimaryBtn, { backgroundColor: activeAccent.primary }]}
            onPress={() => handleOpenSaveModal(item)}>
            <Text style={[styles.cardPrimaryBtnText, { color: activeAccent.textOnPrimary }]}>
              💾 Lưu cấu hình
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cardSecondaryBtn}
            onPress={() => {
              if (item.brand) setSelectedBrand(item.brand);
              setSelectedConfig(item);
              handleTabSwitch('TrainingHudTab');
            }}>
            <Text style={styles.cardSecondaryBtnText}>🎯 Thử HUD</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ================= 0. SPLASH / LOADING SCREEN =================
  if (currentScreen === 'Splash') {
    return (
      <SafeAreaView
        style={[styles.authContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={[styles.authLogoBadge, { borderColor: activeAccent.border }]}>
          <Text style={styles.authLogoIcon}>🎯</Text>
        </View>
        <Text style={[styles.authTitle, { marginTop: 14 }]}>ĐỘ NHẠY FREE FIRE</Text>
        <Text style={styles.authSubtitle}>Đang khởi động hệ thống v{CURRENT_APP_VERSION}...</Text>
      </SafeAreaView>
    );
  }

  // ================= 1. AUTH SCREEN (FIGMA iOS DARK NAVY + SIGNED-OUT STATE) =================
  if (currentScreen === 'Auth') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        <View style={styles.authCard}>
          {justLoggedOut && (
            <View style={styles.signedOutBanner}>
              <Text style={styles.signedOutBannerText}>
                ✓ Đã đăng xuất tài khoản. Bạn có thể đăng nhập lại bất kỳ lúc nào.
              </Text>
            </View>
          )}

          <View style={[styles.authLogoBadge, { borderColor: activeAccent.border }]}>
            <Text style={styles.authLogoIcon}>👑</Text>
          </View>
          <Text style={styles.authTitle}>ĐỘ NHẠY FREE FIRE PRO</Text>
          <Text style={styles.authSubtitle}>
            Hệ thống tối ưu độ nhạy 5D, kho {allSensitivityData.length}+ thiết bị & HUD Esports v
            {CURRENT_APP_VERSION}
          </Text>

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

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryButton, { backgroundColor: activeAccent.primary }]}
            onPress={() => handleLogin(false)}>
            <Text style={[styles.primaryButtonText, { color: activeAccent.textOnPrimary }]}>
              ⚡ {justLoggedOut ? 'Đăng nhập lại ngay' : 'Kích hoạt hệ thống'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryButton}
            onPress={() => handleLogin(true)}>
            <Text style={styles.secondaryButtonText}>Vào với tư cách Khách</Text>
          </TouchableOpacity>

          <Text style={styles.authFooterText}>
            ✓ Thuật toán Ma Trận 5D • ✓ Chuẩn Esports 2026 • ✓ 100% An toàn
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ================= 2. MAIN APP SCREENS =================
  const renderTabContent = () => {
    switch (activeTab) {
      // ---------------- TAB 1: KHÁM PHÁ (FIGMA iOS HOME TAB) ----------------
      case 'HomeTab':
        return (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}>
            {/* Top Header matching Figma "ĐỘ NHẠY FREE FIRE" */}
            <View style={styles.homeHeaderRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.homeBrandTitle}>ĐỘ NHẠY FREE FIRE</Text>
                <Text style={styles.rankBadgeText}>
                  FF / AI PRO 2026 • META • v{CURRENT_APP_VERSION}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.headerAvatar, { borderColor: activeAccent.primary }]}
                onPress={() => handleTabSwitch('AccountTab')}>
                <Text style={[styles.headerAvatarText, { color: activeAccent.bright }]}>
                  {userProfile.avatarLetter || 'FF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View
                style={[
                  styles.bannerBadge,
                  { backgroundColor: activeAccent.light, borderColor: activeAccent.border },
                ]}>
                <Text style={[styles.bannerBadgeText, { color: activeAccent.bright }]}>
                  ⚡ ESPORTS OB 2026 • iOS DESIGN SYSTEM
                </Text>
              </View>
              <Text style={styles.bannerTitle}>TỐI ƯU ĐỘ NHẠY ESPORTS</Text>
              <Text style={styles.bannerDesc}>
                Thông số chuẩn hóa cho {allSensitivityData.length}+ thiết bị iOS & Android, tự động cân chỉnh theo tần số quét và kích thước nút bắn.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.bannerActionBtn, { backgroundColor: activeAccent.primary }]}
                onPress={() => {
                  handleTabSwitch('SensitivityTab');
                  setSensSubScreen('BrandList');
                }}>
                <Text style={[styles.bannerActionBtnText, { color: activeAccent.textOnPrimary }]}>
                  Khám phá {allSensitivityData.length}+ thiết bị →
                </Text>
              </TouchableOpacity>
              <Text style={styles.heroDisclaimer}>
                Thông số tham khảo; kết quả phụ thuộc thiết bị và kỹ năng.
              </Text>
            </View>

            {/* 3-Column Metrics */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: activeAccent.bright }]}>
                  {allSensitivityData.length}+
                </Text>
                <Text style={styles.statLabel}>Thiết bị</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.accentGreen }]}>99.4%</Text>
                <Text style={styles.statLabel}>Tham chiếu</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.secondary }]}>200</Text>
                <Text style={styles.statLabel}>Thang chuẩn</Text>
              </View>
            </View>

            {/* NOVO GAME SPACE Card (Preserves Android Native Overlay + Figma iOS Preview) */}
            <View style={styles.gameSpaceCard}>
              <View style={styles.cardHeaderBetween}>
                <Text style={styles.cardHeading}>🎮 NOVO GAME SPACE</Text>
                <View
                  style={[
                    styles.statusTagPill,
                    FloatingOverlayModule
                      ? { backgroundColor: 'rgba(34, 197, 94, 0.14)', borderColor: 'rgba(34, 197, 94, 0.4)' }
                      : { backgroundColor: 'rgba(255, 106, 0, 0.14)', borderColor: 'rgba(255, 106, 0, 0.4)' },
                  ]}>
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: FloatingOverlayModule ? COLORS.accentGreen : COLORS.primaryBright },
                    ]}>
                    {FloatingOverlayModule ? 'ANDROID NATIVE READY' : 'Không khả dụng trên iOS'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardMutedDesc}>
                {FloatingOverlayModule
                  ? 'Thanh gạt thu nhỏ kéo thả tự do. Mở bảng Monster Dashboard (CPU, GPU, FPS, Tâm Ảo Fix Lệch, Dọn RAM Thật) ngay trên Free Fire.'
                  : 'Hệ điều hành iOS không cho phép vẽ menu nổi trên ứng dụng khác. Mở bản xem trước Game Space & Phòng luyện kéo tâm ngay trong ứng dụng.'}
              </Text>

              {FloatingOverlayModule && (
                <View style={styles.nativeActionRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.nativePrimaryBtn, { backgroundColor: activeAccent.primary }]}
                    onPress={toggleSystemFloatingOverlay}>
                    <Text style={[styles.nativePrimaryBtnText, { color: activeAccent.textOnPrimary }]}>
                      🔘 Bật GG Game Space
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.nativePermBtn}
                    onPress={handleRequestAllPermissions}>
                    <Text style={styles.nativePermBtnText}>⚙️ Cấp quyền</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.nativeStopBtn}
                    onPress={stopSystemFloatingOverlay}>
                    <Text style={styles.nativeStopBtnText}>Tắt</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.previewGameSpaceBtn}
                onPress={() => setShowGameTurboModal(true)}>
                <Text style={styles.previewGameSpaceBtnText}>
                  👁️ Xem minh họa Game Space (In-App Preview) →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Launch Free Fire 1-Tap */}
            <Text style={styles.sectionTitle}>🚀 Khởi động Free Fire 1 chạm</Text>
            <View style={styles.launchRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.launchCard}
                onPress={() =>
                  handleLaunchGameWithOverlay(
                    'freefire://',
                    'https://play.google.com/store/apps/details?id=com.dts.freefireth'
                  )
                }>
                <Text style={styles.launchEmoji}>🔥</Text>
                <Text style={styles.launchName}>Free Fire</Text>
                <Text style={[styles.launchSub, { color: activeAccent.bright }]}>Bản Chuẩn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.launchCard}
                onPress={() =>
                  handleLaunchGameWithOverlay(
                    'freefiremax://',
                    'https://play.google.com/store/apps/details?id=com.dts.freefiremax'
                  )
                }>
                <Text style={styles.launchEmoji}>⚡</Text>
                <Text style={styles.launchName}>FF MAX</Text>
                <Text style={[styles.launchSub, { color: COLORS.secondary }]}>Đồ Họa HD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.launchCard}
                onPress={() =>
                  handleLaunchGameWithOverlay('freefirevn://', 'https://ff.garena.vn/')
                }>
                <Text style={styles.launchEmoji}>🇻🇳</Text>
                <Text style={styles.launchName}>FF VN</Text>
                <Text style={[styles.launchSub, { color: COLORS.accentCyan }]}>Garena VN</Text>
              </TouchableOpacity>
            </View>

            {/* Free Fire Wiki & Battle Music */}
            <View style={styles.wikiMusicCard}>
              <View style={styles.cardHeaderBetween}>
                <Text style={styles.cardHeading}>🌐 Wiki Free Fire & Nhạc chiến</Text>
                <View style={styles.wikiBadge}>
                  <Text style={styles.wikiBadgeText}>GARENA OFFICIAL</Text>
                </View>
              </View>
              <Text style={styles.cardMutedDesc}>
                Tra cứu dữ liệu súng tại wiki.ff.garena.vn hoặc mở trình phát nhạc nền chiến game không quảng cáo.
              </Text>
              <View style={styles.wikiBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.wikiPrimaryBtn}
                  onPress={() =>
                    Linking.openURL('https://wiki.ff.garena.vn/').catch(() =>
                      Alert.alert('Lỗi', 'Không thể mở liên kết.')
                    )
                  }>
                  <Text style={styles.wikiPrimaryBtnText}>🌐 Mở Wiki Garena ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.musicSecondaryBtn}
                  onPress={() => setBubbleResetTrigger((prev) => prev + 1)}>
                  <Text style={styles.musicSecondaryBtnText}>🎵 Bật nhạc chiến</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Access Tools */}
            <Text style={styles.sectionTitle}>🛠️ Công cụ tác chiến Esports</Text>
            <View style={styles.quickToolsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.toolCard}
                onPress={() => handleTabSwitch('TrainingHudTab')}>
                <Text style={styles.toolIcon}>🎮</Text>
                <Text style={styles.toolTitle}>Phòng Luyện & HUD</Text>
                <Text style={styles.toolDesc}>Kéo tâm thực tế, đổi nút bắn & xoay ngang</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.toolCard}
                onPress={() => handleTabSwitch('GeneratorTab')}>
                <Text style={styles.toolIcon}>⚡</Text>
                <Text style={styles.toolTitle}>Tạo 5D AI Chuyên Sâu</Text>
                <Text style={styles.toolDesc}>Chẩn đoán lỗi & tạo bộ số chuẩn thiết bị</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickToolsRow, { marginTop: 10 }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.toolCard}
                onPress={() => {
                  handleTabSwitch('SensitivityTab');
                  setSensSubScreen('BrandList');
                  setBrandListFilter('GAMING');
                }}>
                <Text style={styles.toolIcon}>🚀</Text>
                <Text style={styles.toolTitle}>Gaming ({devicesGaming.length})</Text>
                <Text style={styles.toolDesc}>Cấu hình màn hình 120Hz–165Hz mượt mà</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.toolCard}
                onPress={() => handleTabSwitch('AccountTab')}>
                <Text style={styles.toolIcon}>💾</Text>
                <Text style={styles.toolTitle}>Đã Lưu ({savedConfigs.length})</Text>
                <Text style={styles.toolDesc}>Quản lý & đổi tên cấu hình cá nhân</Text>
              </TouchableOpacity>
            </View>

            {/* Pro Tips */}
            <Text style={styles.sectionTitle}>💡 Bí quyết kéo tâm Esports</Text>
            {PRO_TIPS.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <View
                    style={[
                      styles.tipBadgePill,
                      { backgroundColor: activeAccent.light, borderColor: activeAccent.border },
                    ]}>
                    <Text style={[styles.tipBadgeText, { color: activeAccent.bright }]}>
                      {tip.badge}
                    </Text>
                  </View>
                  <Text style={styles.tipTitleText}>{tip.title}</Text>
                </View>
                <Text style={styles.tipDescText}>{tip.desc}</Text>
              </View>
            ))}
          </ScrollView>
        );

      // ---------------- TAB 2: KHO ĐỘ NHẠY (FIGMA iOS DESIGN) ----------------
      case 'SensitivityTab':
        if (sensSubScreen === 'BrandList') {
          const categoryList = [
            { key: 'ALL', label: `Tất cả (${BRANDS.length})`, count: BRANDS.length },
            { key: '2026', label: '⚡ 2026', count: devices2026.length },
            { key: 'GAMING', label: '🎮 Gaming', count: devicesGaming.length },
            { key: 'IOS', label: '🍏 Apple iOS', count: devicesIos.length },
            { key: 'MIDRANGE', label: '📱 Tầm Trung', count: devicesMidrange.length },
            { key: 'BUDGET', label: '🔋 Máy Yếu', count: devicesBudget.length },
          ];

          const activeCategoryDevices =
            brandListFilter === '2026'
              ? devices2026
              : brandListFilter === 'GAMING'
              ? devicesGaming
              : brandListFilter === 'MIDRANGE'
              ? devicesMidrange
              : brandListFilter === 'BUDGET'
              ? devicesBudget
              : devicesIos;

          return (
            <View style={styles.tabContent}>
              <View style={styles.screenHeaderBlock}>
                <Text style={styles.screenMainTitle}>Kho độ nhạy</Text>
                <Text style={styles.screenSubTitle}>
                  {allSensitivityData.length}+ thiết bị • Dữ liệu tối ưu theo dòng máy
                </Text>
              </View>

              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm thiết bị (vd: iPhone 16, K70, S24...)"
                  placeholderTextColor={COLORS.textMuted}
                  value={globalSearchQuery}
                  onChangeText={setGlobalSearchQuery}
                />
                {globalSearchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.searchClearBtn}
                    onPress={() => setGlobalSearchQuery('')}>
                    <Text style={styles.searchClearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {globalSearchQuery.trim().length > 0 ? (
                <FlatList
                  data={globalFilteredDevices}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>🔍</Text>
                      <Text style={styles.emptyTitle}>Không tìm thấy thiết bị</Text>
                      <Text style={styles.emptyDesc}>
                        Không có kết quả cho "{globalSearchQuery}". Bạn có thể xóa bộ lọc hoặc tạo độ nhạy 5D riêng.
                      </Text>
                      <TouchableOpacity
                        style={[styles.emptyResetBtn, { backgroundColor: activeAccent.primary }]}
                        onPress={() => {
                          setGlobalSearchQuery('');
                          setBrandListFilter('ALL');
                        }}>
                        <Text
                          style={[
                            styles.emptyResetBtnText,
                            { color: activeAccent.textOnPrimary },
                          ]}>
                          Xóa bộ lọc
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                  renderItem={({ item }) => renderDeviceSpecCard(item, 'BrandList')}
                />
              ) : (
                <View style={{ flex: 1 }}>
                  {/* Horizontal Filter Pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                    style={{ marginBottom: 14, flexGrow: 0 }}>
                    <View style={styles.categoryFilterRow}>
                      {categoryList.map((cat) => {
                        const isCatSel = brandListFilter === cat.key;
                        return (
                          <TouchableOpacity
                            key={cat.key}
                            activeOpacity={0.85}
                            style={[
                              styles.catFilterPill,
                              isCatSel && {
                                backgroundColor: activeAccent.primary,
                                borderColor: activeAccent.primary,
                              },
                            ]}
                            onPress={() => setBrandListFilter(cat.key)}>
                            <Text
                              style={[
                                styles.catFilterPillText,
                                isCatSel && {
                                  color: activeAccent.textOnPrimary,
                                  fontWeight: '800',
                                },
                              ]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {brandListFilter === 'ALL' ? (
                    <FlatList
                      data={BRANDS}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 120 }}
                      ListHeaderComponent={
                        <View style={{ marginBottom: 8 }}>
                          <Text style={styles.sectionTitle}>⚡ 3 cấu hình nổi bật</Text>
                          {featuredDevices.map((dev) => renderDeviceSpecCard(dev, 'BrandList'))}
                          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                            🏢 Chọn theo {BRANDS.length} hãng máy
                          </Text>
                        </View>
                      }
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          activeOpacity={0.85}
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
                          <Text style={[styles.brandArrow, { color: activeAccent.bright }]}>›</Text>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <FlatList
                      data={activeCategoryDevices}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 120 }}
                      renderItem={({ item }) => renderDeviceSpecCard(item, 'BrandList')}
                    />
                  )}
                </View>
              )}
            </View>
          );
        }

        // Sub-screen 2: Sub-series
        if (sensSubScreen === 'SubSeriesList') {
          const subList = SUB_SERIES_MAP[selectedBrand] || [];
          return (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => setSensSubScreen('BrandList')}>
                <Text style={[styles.backButtonIcon, { color: activeAccent.bright }]}>‹</Text>
                <Text style={styles.backButtonText}>Quay lại chọn hãng</Text>
              </TouchableOpacity>

              <Text style={styles.screenMainTitle}>Hãng: {selectedBrand}</Text>
              <Text style={styles.screenSubTitle}>Chọn phân khúc dòng máy bạn đang dùng:</Text>

              <FlatList
                data={subList}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.85}
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
                    <Text style={[styles.brandArrow, { color: activeAccent.bright }]}>›</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }

        // Sub-screen 3: Device List
        if (sensSubScreen === 'DeviceList') {
          return (
            <View style={styles.tabContent}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => setSensSubScreen('SubSeriesList')}>
                <Text style={[styles.backButtonIcon, { color: activeAccent.bright }]}>‹</Text>
                <Text style={styles.backButtonText}>Quay lại phân khúc máy</Text>
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
                contentContainerStyle={{ paddingBottom: 120 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>Chưa có máy trong mục này</Text>
                    <Text style={styles.emptyDesc}>
                      Hãy thử tìm kiếm trên thanh tìm kiếm hoặc chọn phân khúc khác!
                    </Text>
                    <TouchableOpacity
                      style={[styles.emptyResetBtn, { backgroundColor: activeAccent.primary }]}
                      onPress={() => setDeviceSearchQuery('')}>
                      <Text
                        style={[
                          styles.emptyResetBtnText,
                          { color: activeAccent.textOnPrimary },
                        ]}>
                        Xóa bộ lọc
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => renderDeviceSpecCard(item, 'DeviceList')}
              />
            </View>
          );
        }

        // Sub-screen 4: Detail View
        if (sensSubScreen === 'DetailView') {
          const config = selectedConfig || MOCK_DATA[0];
          let baseGen = config.general || 188;
          let baseRedDot = config.redDot || 174;
          let baseBtnSize = config.buttonSize || 42;
          let dragTip = config.dragType || 'Vuốt dứt khoát';

          if (detailWeaponMode === 'SHOTGUN') {
            baseGen = Math.min(200, baseGen + 4);
            baseRedDot = Math.min(200, baseRedDot + 6);
            baseBtnSize = Math.max(38, baseBtnSize - 2);
            dragTip = 'Vuốt Móc Chữ J Đỉnh Đầu (Tâm Bám Gắt)';
          } else if (detailWeaponMode === 'SMG') {
            baseGen = Math.min(200, baseGen - 2);
            baseRedDot = Math.min(200, baseRedDot - 2);
            baseBtnSize = Math.min(52, baseBtnSize + 3);
            dragTip = 'Kéo Thẳng Đều Tay Ghìm Độ Giật (Đạn Không Xòe)';
          }

          const generalVal = baseGen;
          const redDotVal = baseRedDot;
          const scope2x = config.scope2x || Math.max(70, redDotVal - 6);
          const scope4x = config.scope4x || Math.max(60, redDotVal - 14);
          const scopeAWM = config.awm || Math.max(40, Math.round(generalVal * 0.4));
          const freeLook = config.freeLook || Math.max(70, generalVal - 45);
          const btnSize = baseBtnSize;
          const hudCoord = config.hudPos || 'Cách đáy 12% • Cách phải 19%';

          return (
            <ScrollView
              style={styles.tabContent}
              contentContainerStyle={{ paddingBottom: 130 }}
              showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.backButtonRow}
                onPress={() => {
                  if (sensNavSource === 'AccountTab') {
                    setActiveTab('AccountTab');
                  } else if (sensNavSource === 'HomeTab') {
                    handleTabSwitch('HomeTab');
                  } else if (sensNavSource === 'DeviceList') {
                    setSensSubScreen('DeviceList');
                  } else {
                    setSensSubScreen('BrandList');
                  }
                }}>
                <Text style={[styles.backButtonIcon, { color: activeAccent.bright }]}>‹</Text>
                <Text style={styles.backButtonText}>
                  {sensNavSource === 'AccountTab'
                    ? 'Quay lại Cấu hình đã lưu'
                    : sensNavSource === 'HomeTab'
                    ? 'Quay lại Trang chủ'
                    : sensNavSource === 'DeviceList'
                    ? 'Quay lại danh sách máy'
                    : 'Quay lại kho thiết bị'}
                </Text>
              </TouchableOpacity>

              <View style={styles.detailHeaderCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={[styles.detailBrandTag, { color: activeAccent.bright }]}>
                    {config.brand || 'Free Fire'}
                  </Text>
                  {config.is2026 && (
                    <View style={styles.badge2026Header}>
                      <Text style={styles.badge2026HeaderText}>⚡ BẢN CHUẨN ESPORTS 2026</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailTitle}>
                  {config.deviceName || config.name || config.title || 'Cấu hình tùy chỉnh'}
                </Text>
                <Text style={styles.detailAuthor}>Hiệu chuẩn: Esports Headshot Lab 2026</Text>
              </View>

              {/* Tối ưu theo vũ khí */}
              <Text style={styles.sectionTitle}>🔫 Tối ưu cấu hình theo vũ khí</Text>
              <View style={styles.weaponDetailPillRow}>
                {[
                  { id: 'ALL', label: '🎯 Toàn diện' },
                  { id: 'SHOTGUN', label: '💥 Shotgun M1887' },
                  { id: 'SMG', label: '⚡ MP40 Sấy' },
                ].map((mode) => {
                  const active = detailWeaponMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      activeOpacity={0.85}
                      style={[
                        styles.weaponDetailPill,
                        active && {
                          backgroundColor: activeAccent.light,
                          borderColor: activeAccent.primary,
                        },
                      ]}
                      onPress={() => setDetailWeaponMode(mode.id)}>
                      <Text
                        style={[
                          styles.weaponDetailPillText,
                          active && { color: activeAccent.bright, fontWeight: '800' },
                        ]}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bảng thông số trong game */}
              <Text style={styles.sectionTitle}>🎯 Độ nhạy trong game (Thang 200)</Text>
              <View style={styles.inGamePanel}>
                {renderFFSlider('Nhìn xung quanh (General)', generalVal)}
                {renderFFSlider('Red Dot Sight (Ống ngắm đỏ)', redDotVal)}
                {renderFFSlider('Ống ngắm 2X', scope2x)}
                {renderFFSlider('Ống ngắm 4X', scope4x)}
                {renderFFSlider('Ống ngắm Súng ngắm (AWM / M82B)', scopeAWM)}
                {renderFFSlider('Góc nhìn tự do (Mắt)', freeLook)}
              </View>

              {/* Thông số hệ thống & HUD */}
              <Text style={styles.sectionTitle}>⚙️ Thiết lập hệ thống & HUD</Text>
              <View style={styles.hardwareCard}>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>DPI Khuyên Dùng:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.secondary }]}>
                    {config.dpi}
                  </Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>Kích thước nút bắn:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.secondary }]}>
                    {btnSize}% (Chuẩn Pro)
                  </Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Text style={styles.hardwareLabel}>Vị trí đặt nút bắn:</Text>
                  <Text style={styles.hardwareValue}>{hudCoord}</Text>
                </View>
                <View style={[styles.hardwareRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.hardwareLabel}>Kiểu kéo tâm:</Text>
                  <Text style={[styles.hardwareValue, { color: COLORS.accentGreen }]}>
                    {dragTip}
                  </Text>
                </View>
              </View>

              {/* Mô phỏng nút bắn */}
              <Text style={styles.sectionTitle}>🔘 Mô phỏng nút bắn & hướng vuốt</Text>
              <View style={styles.hudSimulatorBox}>
                <View style={styles.hudCrosshair}>
                  <Text style={{ color: COLORS.cyanTactical, fontSize: 18 }}>┼</Text>
                  <Text style={styles.hudCrosshairText}>Đầu Mục Tiêu</Text>
                </View>

                <View style={styles.dragArrowContainer}>
                  <Text style={[styles.dragArrowText, { color: activeAccent.bright }]}>▲</Text>
                  <Text style={styles.dragArrowLabel}>{dragTip}</Text>
                </View>

                <View
                  style={[
                    styles.simulatedFireButton,
                    {
                      width: btnSize * 1.5,
                      height: btnSize * 1.5,
                      borderRadius: (btnSize * 1.5) / 2,
                      borderColor: activeAccent.primary,
                      backgroundColor: activeAccent.light,
                    },
                  ]}>
                  <Text style={styles.fireIcon}>🔥</Text>
                  <Text style={styles.simulatedSizeText}>{btnSize}%</Text>
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.testInTrainerBtn, { backgroundColor: activeAccent.primary }]}
                onPress={() => handleTabSwitch('TrainingHudTab')}>
                <Text style={[styles.testInTrainerBtnText, { color: activeAccent.textOnPrimary }]}>
                  🎮 Vào luyện tâm với máy này →
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.saveActionButton}
                  onPress={() => handleOpenSaveModal(config)}>
                  <Text style={styles.actionButtonText}>💾 Lưu cấu hình</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.shareActionButton}
                  onPress={() => handleShareSensitivity(config)}>
                  <Text style={styles.shareActionButtonText}>📤 Chia sẻ</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          );
        }
        return null;

      // ---------------- TAB 3: TẠO ĐỘ NHẠY 5D AI ----------------
      case 'GeneratorTab':
      case 'AiCoachTab':
        return (
          <AiSensitivityCoach
            accentColor={activeAccent.primary}
            onSaveConfig={(cfg) => handleOpenSaveModal(cfg)}
            onGoToTrainer={() => handleTabSwitch('TrainingHudTab')}
          />
        );

      // ---------------- TAB 4: PHÒNG LUYỆN KÉO TÂM & HUD STUDIO ----------------
      case 'TrainingHudTab':
      case 'AimTrainerTab':
      case 'HudDpiTab':
        return (
          <TrainingAndHudStudio
            onBack={async () => {
              if (isLandscapeMode) {
                try {
                  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                  setIsLandscapeMode(false);
                } catch (e) {}
              }
              setActiveTab('HomeTab');
            }}
            initialButtonSize={selectedConfig?.buttonSize || 42}
            onOrientationChange={(landscape) => setIsLandscapeMode(landscape)}
          />
        );

      // ---------------- TAB 5: TÀI KHOẢN (FIGMA iOS 4_TAI_KHOAN) ----------------
      case 'AccountTab':
        const displayedSavedList = showAllSaved
          ? filteredSavedConfigs
          : filteredSavedConfigs.slice(0, 5);

        return (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.ytTopHeader}>
              <View>
                <Text style={styles.ytTopTitle}>Tài khoản</Text>
                <Text style={styles.ytTopSubTitle}>Hồ sơ, cấu hình và tùy chọn</Text>
              </View>
              <View style={styles.ytTopActions}>
                <TouchableOpacity
                  style={styles.ytTopIconBtn}
                  onPress={() =>
                    Alert.alert('🔍 Tìm kiếm', 'Dùng ô tìm kiếm ở tab Độ nhạy hoặc phần Đã lưu bên dưới.')
                  }>
                  <Text style={{ fontSize: 16 }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ytTopIconBtn}
                  onPress={() =>
                    Alert.alert(
                      '⚙️ Phiên bản ứng dụng',
                      `Độ Nhạy Free Fire AI Pro v${CURRENT_APP_VERSION} (iOS Design System)`
                    )
                  }>
                  <Text style={{ fontSize: 16 }}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Card */}
            <View style={styles.ytProfileCard}>
              <View style={styles.ytProfileMainRow}>
                <View style={[styles.ytAvatarWrapper, { borderColor: activeAccent.primary }]}>
                  <Text style={[styles.ytAvatarText, { color: activeAccent.bright }]}>
                    {userProfile.avatarLetter || 'FF'}
                  </Text>
                  <View style={[styles.ytOnlineBadge, { backgroundColor: COLORS.accentGreen }]} />
                </View>

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.ytProfileName} numberOfLines={1}>
                      {userProfile.name}
                    </Text>
                    <Text style={{ color: activeAccent.bright, fontSize: 14, fontWeight: '900' }}>
                      ✓
                    </Text>
                  </View>
                  <Text style={styles.ytProfileHandle} numberOfLines={1}>
                    @{userProfile.name
                      ? userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player'
                      : 'thinhduong988'}{' '}
                    • {userProfile.rank}
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 4 }}
                    onPress={() =>
                      Alert.alert(
                        '📊 Hồ sơ chiến thuật',
                        `Nhân vật: ${userProfile.name}\nRank: ${userProfile.rank}\nSố cấu hình đã lưu: ${savedConfigs.length}`
                      )
                    }>
                    <Text style={[styles.ytProfileLink, { color: activeAccent.bright }]}>
                      Xem hồ sơ & thông số chiến thuật ›
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.ytPillsRow}>
                <TouchableOpacity
                  style={styles.ytPillBtn}
                  onPress={() => setIsLogoutModalVisible(true)}>
                  <Text style={styles.ytPillBtnText}>🔄 Đổi tài khoản</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ytPillBtn}
                  onPress={() => {
                    setTempName(userProfile.name);
                    setTempRank(userProfile.rank);
                    setIsEditProfileVisible(true);
                  }}>
                  <Text style={styles.ytPillBtnText}>✏️ Chỉnh sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ytPillBtn}
                  onPress={() =>
                    Share.share({
                      message: `🔥 Cùng dùng app Độ Nhạy Free Fire AI Pro v${CURRENT_APP_VERSION}! Hồ sơ: ${userProfile.name} (${userProfile.rank}).`,
                    })
                  }>
                  <Text style={styles.ytPillBtnText}>📤 Chia sẻ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5-Accent Color Switcher */}
            <View style={[styles.ytThemeCard, { borderColor: activeAccent.border }]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}>
                <Text style={[styles.ytSectionTitle, { color: activeAccent.bright }]}>
                  🎨 Màu giao diện chủ đạo
                </Text>
                <View
                  style={[
                    styles.activeThemeBadge,
                    { backgroundColor: activeAccent.light, borderColor: activeAccent.border },
                  ]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: activeAccent.bright }}>
                    {activeAccent.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.ytSectionSub}>
                Chạm để đổi màu điểm nhấn cho toàn bộ thanh điều hướng, nút bấm và thanh đo
              </Text>

              <View style={styles.ytSwatchesRow}>
                {THEME_ACCENT_COLORS.map((item) => {
                  const isSelected = activeAccent.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      style={[
                        styles.ytColorSwatch,
                        { backgroundColor: item.hex },
                        isSelected && styles.ytColorSwatchActive,
                      ]}
                      onPress={() => handleSelectThemeColor(item.hex)}>
                      {isSelected && <Text style={styles.ytCheckMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.ytColorNamesRow}>
                {THEME_ACCENT_COLORS.map((item) => (
                  <Text
                    key={item.id}
                    style={[
                      styles.ytColorLabel,
                      activeAccent.id === item.id && {
                        color: item.hex,
                        fontWeight: '800',
                      },
                    ]}>
                    {item.name}
                  </Text>
                ))}
              </View>
            </View>

            {/* Saved Configs Shelf */}
            <View style={styles.ytShelfHeader}>
              <Text style={styles.ytShelfTitle}>★ Cấu hình đã lưu ({savedConfigs.length})</Text>
              {savedConfigs.length > 0 && (
                <TouchableOpacity onPress={() => setShowAllSaved(!showAllSaved)}>
                  <Text style={[styles.ytShelfLink, { color: activeAccent.bright }]}>
                    {showAllSaved ? 'Thu gọn ‹' : 'Xem tất cả ›'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {savedConfigs.length === 0 ? (
              <View style={styles.emptySavedBox}>
                <Text style={styles.emptySavedIcon}>💾</Text>
                <Text style={styles.emptySavedText}>Chưa có cấu hình nào được lưu.</Text>
                <Text style={styles.emptySavedSubText}>
                  Vào tab "Độ Nhạy" hoặc "Tạo 5D" và bấm "Lưu cấu hình" để quản lý tại đây.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal={!showAllSaved}
                showsHorizontalScrollIndicator={false}
                style={styles.ytHorizontalShelfScroll}
                contentContainerStyle={showAllSaved ? { gap: 10 } : { paddingRight: 10 }}>
                {displayedSavedList.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.ytShelfCard,
                      showAllSaved && { width: '100%', marginRight: 0 },
                    ]}>
                    <View style={styles.ytShelfCardTop}>
                      <Text style={{ fontSize: 16 }}>🎯</Text>
                      <Text style={styles.ytShelfCardDate}>{item.date || 'Hôm nay'}</Text>
                    </View>
                    <Text style={styles.ytShelfCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.ytShelfCardStats}>
                      <Text style={styles.ytShelfStatPill}>Nhìn: {item.config?.general || 100}</Text>
                      <Text style={styles.ytShelfStatPill}>
                        RedDot: {item.config?.redDot || 95}
                      </Text>
                    </View>
                    <View style={styles.ytShelfCardStats}>
                      <Text style={styles.ytShelfStatPill}>
                        Nút: {item.config?.buttonSize || 42}%
                      </Text>
                      <Text style={styles.ytShelfStatPill}>DPI: {item.config?.dpi || '480'}</Text>
                    </View>
                    <View style={styles.ytShelfActions}>
                      <TouchableOpacity
                        style={[styles.ytShelfViewBtn, { backgroundColor: activeAccent.primary }]}
                        onPress={() => {
                          const targetConfig = item.config || item;
                          if (item.brand || targetConfig.brand)
                            setSelectedBrand(item.brand || targetConfig.brand);
                          setSelectedConfig(targetConfig);
                          setSensNavSource('AccountTab');
                          setActiveTab('SensitivityTab');
                          setSensSubScreen('DetailView');
                        }}>
                        <Text
                          style={[
                            styles.ytShelfViewBtnText,
                            { color: activeAccent.textOnPrimary },
                          ]}>
                          XEM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ytShelfRenameBtn}
                        onPress={() => handleOpenRenameModal(item)}>
                        <Text style={styles.ytShelfRenameText}>ĐỔI TÊN</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ytShelfDelBtn}
                        onPress={() => handleDeleteConfig(item.id, item.title)}>
                        <Text style={styles.ytShelfDelText}>XÓA</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Settings Rows */}
            <View style={styles.ytSettingsGroup}>
              <TouchableOpacity
                style={styles.ytSettingRow}
                onPress={() => checkGitHubUpdates(true)}>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>☁️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Cập nhật Cloud OTA Meta OB47</Text>
                    <Text style={styles.ytSettingSub}>
                      Bản v{CURRENT_APP_VERSION} •{' '}
                      {cloudSensitivityMeta ? cloudSensitivityMeta.metaVersion : 'OB47 Ready'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.ytMiniActionBtn, { backgroundColor: activeAccent.primary }]}>
                  <Text
                    style={[styles.ytMiniActionText, { color: activeAccent.textOnPrimary }]}>
                    {isCheckingUpdate ? 'Đang check...' : 'Kiểm tra'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ytSettingRow}
                onPress={() => setShowGameTurboModal(true)}>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>🎛️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Novo Game Space & Bản xem trước</Text>
                    <Text style={styles.ytSettingSub}>
                      {FloatingOverlayModule
                        ? 'Kéo di chuyển tự do • Kính mờ xuyên thấu'
                        : 'Bản minh họa hiệu suất & HUD trong ứng dụng'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ytArrowRight}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ytSettingRow}
                onPress={() =>
                  Alert.alert(
                    '🎵 Kho Nhạc Nền Cobalt.tools',
                    'Đã tích hợp API cobalt.tools vào Trình phát nhạc leo rank. Dán link YouTube hoặc TikTok trực tiếp vào bong bóng nhạc để phát mượt mà.'
                  )
                }>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>🎵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Kho Nhạc Nền Cobalt.tools</Text>
                    <Text style={styles.ytSettingSub}>
                      Hỗ trợ link YouTube & TikTok chất lượng cao
                    </Text>
                  </View>
                </View>
                <Text style={styles.ytArrowRight}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ytSettingRow}
                onPress={() =>
                  Alert.alert(
                    '📱 Hướng dẫn chỉnh DPI an toàn',
                    '• Android: Cài đặt > Tùy chọn nhà phát triển > Chiều rộng tối thiểu.\n• iOS: Cài đặt > Trợ năng > Điều khiển công tắc > Tốc độ con trượt (đặt 120).'
                  )
                }>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>🎯</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Hướng dẫn cài DPI an toàn theo máy</Text>
                    <Text style={styles.ytSettingSub}>
                      Android chiều rộng tối thiểu & iOS con trượt 120
                    </Text>
                  </View>
                </View>
                <Text style={styles.ytArrowRight}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ytSettingRow}
                onPress={() =>
                  Alert.alert(
                    '🛡️ Cam Kết An Toàn 100%',
                    '1. Mọi thông số dựa trên thuật toán kéo tâm chuẩn của Free Fire.\n2. Không chỉnh sửa file hệ thống .obb hay can thiệp game.\n3. Hoàn toàn an toàn cho tài khoản cá nhân.'
                  )
                }>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Cam kết an toàn & Chống khóa tài khoản</Text>
                    <Text style={styles.ytSettingSub}>
                      Thuần thông số kéo tâm & HUD cơ học, bảo vệ nick 100%
                    </Text>
                  </View>
                </View>
                <Text style={styles.ytArrowRight}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ytSettingRow, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setBubbleResetTrigger((prev) => prev + 1);
                  Alert.alert(
                    '✅ Đã Đặt Lại Vị Trí',
                    'Bong bóng chat & trình phát nhạc đã được đưa về góc dưới bên phải màn hình!'
                  );
                }}>
                <View style={styles.ytSettingLeft}>
                  <Text style={styles.ytSettingIcon}>🤖</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytSettingTitle}>Đặt lại vị trí Bong bóng Chat & Nhạc</Text>
                    <Text style={styles.ytSettingSub}>
                      Đưa bong bóng về vị trí mặc định nếu bị kéo lệch
                    </Text>
                  </View>
                </View>
                <Text style={styles.ytArrowRight}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.ytLogoutBtn}
              onPress={() => setIsLogoutModalVisible(true)}>
              <Text style={styles.ytLogoutBtnText}>🚪 Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const navItems = [
    { key: 'HomeTab', icon: '🌌', label: 'Khám Phá', matches: ['HomeTab'] },
    { key: 'SensitivityTab', icon: '🎯', label: 'Độ Nhạy', matches: ['SensitivityTab'] },
    {
      key: 'GeneratorTab',
      icon: '⚡',
      label: 'Tạo 5D',
      matches: ['GeneratorTab', 'AiCoachTab'],
    },
    {
      key: 'TrainingHudTab',
      icon: '🎮',
      label: 'Tập Kéo',
      matches: ['TrainingHudTab', 'AimTrainerTab', 'HudDpiTab'],
    },
    { key: 'AccountTab', icon: '👤', label: 'Tài Khoản', matches: ['AccountTab'] },
  ];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      {/* Novo Game Space Preview Modal (Full-screen Figma In-App Preview + Android Native Hook) */}
      <Modal
        visible={showGameTurboModal}
        animationType="slide"
        onRequestClose={() => setShowGameTurboModal(false)}>
        <SafeAreaView style={styles.mainContainer}>
          <GameSpacePreview
            accentId={activeAccent.id}
            hasNativeOverlay={!!FloatingOverlayModule}
            onActivateNativeOverlay={() => {
              setShowGameTurboModal(false);
              toggleSystemFloatingOverlay();
            }}
            onBack={() => setShowGameTurboModal(false)}
            onOpenTrainer={() => {
              setShowGameTurboModal(false);
              handleTabSwitch('TrainingHudTab');
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Sign Out Confirmation Modal matching Figma 4_Tai_Khoan */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đăng xuất tài khoản?</Text>
            <Text style={styles.modalSubDesc}>
              Các cấu hình đã lưu trong máy vẫn được giữ nguyên. Bạn có thể đăng nhập lại bất kỳ lúc nào.
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsLogoutModalVisible(false)}>
                <Text style={styles.modalCancelText}>HỦY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: COLORS.accentRed }]}
                onPress={confirmLogout}>
                <Text style={[styles.modalSaveText, { color: '#FFFFFF' }]}>ĐĂNG XUẤT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar (Figma iOS 5-tab bar with top accent indicator) */}
      {!(activeTab === 'TrainingHudTab' && isLandscapeMode) && (
        <View style={styles.bottomBar}>
          {navItems.map((tab) => {
            const isActive = tab.matches.includes(activeTab);
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                style={styles.navItem}
                onPress={() => handleTabSwitch(tab.key)}>
                <View
                  style={[
                    styles.navIndicator,
                    isActive && { backgroundColor: activeAccent.primary },
                  ]}
                />
                <Text style={[styles.navIcon, isActive && { opacity: 1 }]}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.navLabel,
                    isActive && { color: activeAccent.bright, fontWeight: '800' },
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* MODAL 1: SAVE CONFIG */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💾 Lưu cấu hình chiến đấu</Text>
            <Text style={styles.modalSubDesc}>
              Đặt tên riêng để phân biệt các bộ độ nhạy (bắn giải, solo shotgun, sấy tầm gần...):
            </Text>

            <Text style={styles.modalFieldLabel}>Tên cấu hình của bạn</Text>
            <TextInput
              style={styles.modalInput}
              value={inputConfigName}
              onChangeText={setInputConfigName}
              placeholder="VD: Shotgun One-Shot Bắn Giải..."
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.tagSectionLabel}>Gợi ý tên nhanh:</Text>
            <View style={styles.tagRow}>
              {[
                '🔥 Bắn Giải',
                '🎯 Shotgun One-Shot',
                '⚡ Sấy MP40',
                '🏆 Leo Thách Đấu',
                '👑 Solo 1vs1',
              ].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagPill}
                  onPress={() =>
                    setInputConfigName(
                      `${tag} • ${configPendingSave?.deviceName?.split(' ')[0] || 'FF'}`
                    )
                  }>
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
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: activeAccent.primary }]}
                onPress={handleConfirmSave}>
                <Text style={[styles.modalSaveText, { color: activeAccent.textOnPrimary }]}>
                  LƯU VÀO KHO
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: RENAME CONFIG */}
      <Modal visible={isRenameModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✏️ Đổi tên cấu hình</Text>
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
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: activeAccent.primary }]}
                onPress={handleConfirmRename}>
                <Text style={[styles.modalSaveText, { color: activeAccent.textOnPrimary }]}>
                  CẬP NHẬT TÊN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: EDIT PROFILE */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👤 Chỉnh sửa hồ sơ</Text>

            <Text style={styles.modalFieldLabel}>Tên hiển thị / IGN</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Nhập tên mới..."
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.modalFieldLabel}>Xếp hạng (Rank)</Text>
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
                style={[styles.modalSaveBtn, { backgroundColor: activeAccent.primary }]}
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
                <Text style={[styles.modalSaveText, { color: activeAccent.textOnPrimary }]}>
                  LƯU THAY ĐỔI
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: GITHUB UPDATE RELEASE */}
      <Modal visible={!!newReleaseInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: COLORS.accentGreen }]}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 34, marginBottom: 6 }}>🚀</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.accentGreen, textAlign: 'center' }}>
                Đã có bản mới {newReleaseInfo?.version}!
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
                Bản phát hành cập nhật tính năng từ GitHub
              </Text>
            </View>

            <View
              style={{
                backgroundColor: COLORS.backgroundAlt,
                borderRadius: 14,
                padding: 12,
                marginBottom: 16,
                borderColor: COLORS.glassBorder,
                borderWidth: 1,
              }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.secondary, marginBottom: 6 }}>
                📋 Chi tiết bản cập nhật:
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 }} numberOfLines={6}>
                {newReleaseInfo?.notes}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: COLORS.accentGreen,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 10,
              }}
              onPress={() => {
                if (newReleaseInfo?.downloadUrl) {
                  Linking.openURL(newReleaseInfo.downloadUrl);
                }
              }}>
              <Text style={{ color: '#06150C', fontWeight: '800', fontSize: 14 }}>
                📥 Tải bản cập nhật ngay (1-chạm)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setNewReleaseInfo(null)}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '700' }}>
                Để sau (Dữ liệu độ nhạy vẫn cập nhật qua Cloud OTA)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Coach + Music Floating Bubble */}
      <AiChatBubble
        isLandscapeMode={isLandscapeMode}
        resetTrigger={bubbleResetTrigger}
        onApplyToTrainer={(cfg) => {
          setSelectedConfig(cfg);
          handleTabSwitch('TrainingHudTab');
        }}
        onSaveConfig={(cfg) => handleOpenSaveModal(cfg)}
      />
    </SafeAreaView>
  );
}

// ================= STYLES: FIGMA iOS DESIGN SYSTEM v1.0.8 =================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // AUTH SCREEN
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  signedOutBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1,
    borderRadius: COLORS.rounded.sm,
    padding: 10,
    marginBottom: 16,
  },
  signedOutBannerText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  authLogoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  authLogoIcon: {
    fontSize: 30,
  },
  authTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  authSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 19,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: COLORS.rounded.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    minHeight: 46,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  authFooterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },

  // HOME TAB
  homeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  homeBrandTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rankBadgeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 14,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    marginBottom: 10,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  bannerActionBtn: {
    borderRadius: COLORS.rounded.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  bannerActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroDisclaimer: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  // GAME SPACE & WIKI CARDS
  gameSpaceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 18,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardHeading: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardMutedDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  nativeActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  nativePrimaryBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  nativePrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nativePermBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderColor: COLORS.secondary,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativePermBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  nativeStopBtn: {
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderWidth: 1,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeStopBtnText: {
    color: COLORS.accentRed,
    fontSize: 12,
    fontWeight: '800',
  },
  previewGameSpaceBtn: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  previewGameSpaceBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 4,
  },
  launchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  launchCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  launchEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  launchName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  launchSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  wikiMusicCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    marginBottom: 18,
  },
  wikiBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  wikiBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
  },
  wikiBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wikiPrimaryBtn: {
    flex: 1.15,
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 12,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  wikiPrimaryBtnText: {
    color: '#061520',
    fontSize: 12,
    fontWeight: '800',
  },
  musicSecondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.secondaryLight,
    borderColor: 'rgba(245, 183, 0, 0.4)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: COLORS.rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  musicSecondaryBtnText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
  },

  quickToolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  toolIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  toolTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  toolDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },

  tipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tipTitleText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  tipDescText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // SENSITIVITY TAB
  screenHeaderBlock: {
    marginTop: 6,
    marginBottom: 12,
  },
  screenMainTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  searchClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchClearText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catFilterPill: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  catFilterPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  // DEVICE SPEC CARD (Figma 2x3 Metric Grid)
  deviceSpecCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  deviceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceCardBrand: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deviceCardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  deviceTierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  deviceTierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  specCell: {
    width: '48.5%',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  specValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  deviceCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardPrimaryBtn: {
    flex: 1.5,
    borderRadius: COLORS.rounded.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cardPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardSecondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cardSecondaryBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  // BRAND LIST ITEMS
  brandItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 10,
  },
  brandCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  brandIconText: {
    fontSize: 20,
  },
  brandTitleText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  brandSubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  brandArrow: {
    fontSize: 22,
    fontWeight: '700',
  },

  // EMPTY STATE
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyResetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: COLORS.rounded.sm,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // DETAIL VIEW
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailHeaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 16,
  },
  detailBrandTag: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badge2026Header: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badge2026HeaderText: {
    color: COLORS.accentGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '800',
  },
  detailAuthor: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  weaponDetailPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  weaponDetailPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 11,
    alignItems: 'center',
  },
  weaponDetailPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  inGamePanel: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
    gap: 12,
  },
  ffSliderContainer: {},
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ffSliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  ffSliderValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  ffTrackBackground: {
    height: 7,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ffTrackProgress: {
    height: '100%',
    borderRadius: 4,
  },
  hardwareCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  hardwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    gap: 12,
  },
  hardwareLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  hardwareValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  hudSimulatorBox: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    alignItems: 'center',
    marginBottom: 16,
  },
  hudCrosshair: {
    alignItems: 'center',
    marginBottom: 10,
  },
  hudCrosshairText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  dragArrowContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragArrowText: {
    fontSize: 20,
    fontWeight: '900',
  },
  dragArrowLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  simulatedFireButton: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireIcon: {
    fontSize: 16,
  },
  simulatedSizeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },
  testInTrainerBtn: {
    borderRadius: COLORS.rounded.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 10,
  },
  testInTrainerBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  saveActionButton: {
    flex: 1.3,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  shareActionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareActionButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },

  // ACCOUNT TAB (yt* styles matching Figma 4_Tai_Khoan)
  ytTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  ytTopTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  ytTopSubTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  ytTopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ytTopIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytProfileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  ytProfileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ytAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytAvatarText: {
    fontSize: 20,
    fontWeight: '900',
  },
  ytOnlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  ytProfileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  ytProfileHandle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  ytProfileLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  ytPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ytPillBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ytPillBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  ytThemeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  ytSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  activeThemeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  ytSectionSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  ytSwatchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  ytColorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytColorSwatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  ytCheckMark: {
    color: '#090B11',
    fontSize: 16,
    fontWeight: '900',
  },
  ytColorNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  ytColorLabel: {
    width: 52,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  ytShelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ytShelfTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  ytShelfLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptySavedBox: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  emptySavedIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptySavedText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySavedSubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  ytHorizontalShelfScroll: {
    marginBottom: 16,
  },
  ytShelfCard: {
    width: 230,
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 10,
  },
  ytShelfCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ytShelfCardDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  ytShelfCardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  ytShelfCardStats: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  ytShelfStatPill: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ytShelfActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  ytShelfViewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  ytShelfViewBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ytShelfRenameBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ytShelfRenameText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  ytShelfDelBtn: {
    paddingHorizontal: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  ytShelfDelText: {
    color: COLORS.accentRed,
    fontSize: 11,
    fontWeight: '800',
  },
  ytSettingsGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ytSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    gap: 10,
  },
  ytSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  ytSettingIcon: {
    fontSize: 18,
  },
  ytSettingTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  ytSettingSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  ytMiniActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ytMiniActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ytArrowRight: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: '600',
  },
  ytLogoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: COLORS.rounded.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytLogoutBtnText: {
    color: COLORS.accentRed,
    fontSize: 14,
    fontWeight: '800',
  },

  // BOTTOM NAVIGATION BAR (Figma iOS 5-Tab Bar)
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 17, 27, 0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorderHighlight,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 2,
    paddingHorizontal: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  navIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.72,
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.glassOverlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: COLORS.rounded.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  modalFieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  tagSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  tagPill: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.full,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: COLORS.rounded.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1.3,
    borderRadius: COLORS.rounded.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
