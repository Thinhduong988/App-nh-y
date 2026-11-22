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
import { COLORS } from './src/theme/colors';
import { BRANDS, SUB_SERIES_MAP, MOCK_DATA, PRO_TIPS } from './src/data/sensitivityData';
import TrainingAndHudStudio from './src/components/TrainingAndHudStudio';
import AiChatBubble from './src/components/AiChatBubble';

const { FloatingOverlayModule } = NativeModules;

export default function App() {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState('Splash'); // Splash, Auth, MainApp
  const [activeTab, setActiveTab] = useState('HomeTab'); // HomeTab, SensitivityTab, TrainingHudTab, AccountTab
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [bubbleResetTrigger, setBubbleResetTrigger] = useState(0);

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
  const CURRENT_APP_VERSION = '1.0.7';
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

  // Categorized Devices Memos (Nhiều lựa chọn cấu hình máy)
  const devices2026 = useMemo(() => {
    return allSensitivityData.filter((item) => item.is2026);
  }, [allSensitivityData]);

  const devicesGaming = useMemo(() => {
    return allSensitivityData.filter((item) =>
      ['REDMAGIC', 'ROGPHONE', 'POCO', 'iQOO'].includes(item.brand) ||
      (item.deviceName && (item.deviceName.includes('GT') || item.deviceName.includes('Pro') || item.deviceName.includes('Ultra')))
    );
  }, [allSensitivityData]);

  const devicesMidrange = useMemo(() => {
    return allSensitivityData.filter((item) =>
      ['REDMI', 'Realme', 'Vivo', 'OPPO', 'Samsung'].includes(item.brand) && !item.is2026
    );
  }, [allSensitivityData]);

  const devicesBudget = useMemo(() => {
    return allSensitivityData.filter((item) =>
      ['Infinix', 'Tecno'].includes(item.brand) ||
      (item.deviceName && (item.deviceName.includes('C') || item.deviceName.includes('A') || item.deviceName.includes('Spark') || item.deviceName.includes('Hot') || item.deviceName.includes('Smart')))
    );
  }, [allSensitivityData]);

  const devicesIos = useMemo(() => {
    return allSensitivityData.filter((item) => item.brand === 'Apple');
  }, [allSensitivityData]);

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
  const [showGameTurboModal, setShowGameTurboModal] = useState(false);
  const [turboLiveFps, setTurboLiveFps] = useState(120);
  const [turboLiveTemp, setTurboLiveTemp] = useState(37.2);

  const [selectedGameSpaceDpi, setSelectedGameSpaceDpi] = useState(480);
  const [gameSpaceMode, setGameSpaceMode] = useState('⚡ CÂN BẰNG');

  const handleRequestAllPermissions = async () => {
    if (!FloatingOverlayModule) {
      Alert.alert('Thông báo', 'Tính năng cần cài đặt trên thiết bị Android để sử dụng.');
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
            { text: 'Bỏ qua', style: 'cancel' }
          ]
        );
        return;
      }

      const hasWrite = await FloatingOverlayModule.checkWriteSettingsPermission?.();
      if (!hasWrite) {
        Alert.alert(
          '2. Quyền Sửa Đổi Cài Đặt Hệ Thống',
          'Để tính năng Khóa xoay màn hình và Khóa độ sáng 100% trong menu có thể thực sự hoạt động trên máy, vui lòng bật quyền "Sửa đổi cài đặt hệ thống" (Modify system settings).',
          [
            { text: 'Cấp quyền ngay', onPress: () => FloatingOverlayModule.requestWriteSettingsPermission?.() },
            { text: 'Bỏ qua', style: 'cancel' }
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
            { text: 'Cấp quyền DND', onPress: () => FloatingOverlayModule.requestNotificationPolicyPermission?.() },
            { text: 'Bỏ qua', style: 'cancel' }
          ]
        );
        return;
      }

      Alert.alert('✅ Hoàn Tất!', 'Ứng dụng đã có đầy đủ quyền hệ thống để toàn bộ tính năng GG Game Space hoạt động thực tế 100%!');
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
          'Để menu GG Game Space vòng cung hiển thị nép sát mép trái khi bạn đang chơi Free Fire, vui lòng bật quyền "Xuất hiện trên cùng" (Draw over other apps).',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Bật quyền ngay', onPress: () => FloatingOverlayModule.requestPermission() }
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
    // Tự động bật nút nổi GG Game Space khi bấm vào bất kỳ nút mở Free Fire nào
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

  const detectedDeviceInfo = useMemo(() => {
    const brand = Platform.constants?.Brand || (Platform.OS === 'ios' ? 'Apple' : 'Android');
    const model = Platform.constants?.Model || (Platform.OS === 'ios' ? 'iPhone Pro' : 'Gaming Device');
    const manufacturer = Platform.constants?.Manufacturer || brand;
    return {
      brand: brand.charAt(0).toUpperCase() + brand.slice(1),
      model: model,
      name: `${manufacturer.toUpperCase()} ${model}`
    };
  }, []);
  const [configPendingSave, setConfigPendingSave] = useState(null);
  const [inputConfigName, setInputConfigName] = useState('');

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameTargetItem, setRenameTargetItem] = useState(null);
  const [inputRenameName, setInputRenameName] = useState('');

  // Helper: Kiểm tra cập nhật ứng dụng từ GitHub Releases
  const checkGitHubUpdates = async (isManual = false) => {
    if (isManual) setIsCheckingUpdate(true);
    try {
      const response = await fetch('https://api.github.com/repos/Thinhduong988/App-nh-y/releases/latest');
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
              Alert.alert('🚀 Đã có bản mới!', `Phát hiện phiên bản ${release.tag_name}. Bạn có thể tải ngay.`);
            }
            return;
          }
        }
      }
      if (isManual) {
        Alert.alert('✅ Đang ở bản mới nhất', `Ứng dụng của bạn (${CURRENT_APP_VERSION}) đang là bản mới nhất. Dữ liệu độ nhạy AI vẫn được cập nhật tự động qua Cloud OTA!`);
      }
    } catch (e) {
      if (isManual) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến GitHub để kiểm tra bản mới.');
      }
    } finally {
      if (isManual) setIsCheckingUpdate(false);
    }
  };

  // Helper: Đồng bộ dữ liệu độ nhạy Cloud OTA (Không cần update app)
  const syncCloudSensitivity = async () => {
    try {
      // 1. Đọc từ bộ nhớ đệm máy
      const cached = await AsyncStorage.getItem('@online_sensitivity_db');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.cloudConfigs)) {
          setCloudSensitivityMeta(parsed);
          mergeSensitivityData(parsed.cloudConfigs);
        }
      }

      // 2. Tải trực tiếp dữ liệu mới nhất từ GitHub raw
      const rawUrl = 'https://raw.githubusercontent.com/Thinhduong988/App-nh-y/main/src/data/onlineSensitivity.json?t=' + Date.now();
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

        // Tự động đồng bộ độ nhạy Cloud OTA và kiểm tra bản mới
        syncCloudSensitivity();
        checkGitHubUpdates(false);
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
    return allSensitivityData.filter(
      (item) =>
        (item.deviceName || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q)
    );
  }, [globalSearchQuery, allSensitivityData]);

  const filteredData = useMemo(() => {
    return allSensitivityData.filter((item) => {
      const matchBrand = (item.brand || '').toLowerCase() === (selectedBrand || '').toLowerCase();
      const matchSeries = selectedSubSeries === 'All' || item.series === selectedSubSeries;
      const matchSearch =
        !deviceSearchQuery.trim() ||
        (item.deviceName || '').toLowerCase().includes(deviceSearchQuery.toLowerCase());
      return matchBrand && matchSeries && matchSearch;
    });
  }, [selectedBrand, selectedSubSeries, deviceSearchQuery, allSensitivityData]);

  // Filtered saved configs
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

  // ================= 0. SPLASH / LOADING SCREEN =================
  if (currentScreen === 'Splash') {
    return (
      <SafeAreaView style={[styles.authContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.authLogoBadge}>
          <Text style={styles.authLogoIcon}>👑</Text>
        </View>
        <Text style={[styles.authTitle, { marginTop: 14 }]}>ĐẲNG CẤP</Text>
        <Text style={styles.authSubtitle}>/// ĐANG KHỞI ĐỘNG HỆ THỐNG ESPORTS ///</Text>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.authLogoIcon}>👑</Text>
          </View>
          <Text style={styles.authTitle}>ĐẲNG CẤP</Text>
          <Text style={styles.authSubtitle}>/// HỆ THỐNG KÉO TÂM ESPORTS ĐỈNH CAO ///</Text>

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
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}>
            {/* Header Cosmic HUD */}
            <View style={styles.homeHeaderRow}>
              <View>
                <Text style={styles.greetingText}>Xin chào, {userProfile.name} 👋</Text>
                <Text style={styles.rankBadgeText}>🏆 {userProfile.rank} • [TAC-ONLINE]</Text>
              </View>
              <TouchableOpacity
                style={styles.headerAvatar}
                onPress={() => handleTabSwitch('AccountTab')}>
                <Text style={styles.headerAvatarText}>{userProfile.avatarLetter}</Text>
              </TouchableOpacity>
            </View>

            {/* Banner iOS 26 Liquid Glass */}
            <View style={styles.cyberBanner}>
              <View style={styles.tacticalDecalRow}>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>⚡ iOS 26 • ESPORTS OB 2026</Text>
                </View>
              </View>
              <Text style={styles.bannerTitle}>Thuật Toán Kéo Tâm Tự Động</Text>
              <Text style={styles.bannerDesc}>
                Tối ưu hồng tâm và nút bắn cho hơn 250+ dòng máy, tự động bù trừ tần số quét và lực vuốt tay.
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  handleTabSwitch('SensitivityTab');
                  setSensSubScreen('BrandList');
                }}>
                <Text style={styles.bannerActionBtnText}>Khám phá 250+ thiết bị →</Text>
              </TouchableOpacity>
            </View>

            {/* Cloud Sensitivity OTA & App Version Status Bar */}
            <View style={{ backgroundColor: '#0B0D15', borderColor: '#00FFA3', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FFA3' }} />
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#00FFA3' }}>
                    CLOUD OTA: {cloudSensitivityMeta ? cloudSensitivityMeta.metaVersion : 'Meta OB47'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#8E93A6' }}>• Tự động đồng bộ</Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#1A1D2E', borderColor: '#383E58', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
                  onPress={() => checkGitHubUpdates(true)}>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FFBB00' }}>
                    {isCheckingUpdate ? 'Đang check...' : `v${CURRENT_APP_VERSION} • Check Update`}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 9.5, color: '#8E93A6', marginTop: 4 }}>
                💡 {cloudSensitivityMeta ? cloudSensitivityMeta.updateNotes : 'Độ nhạy AI tự động cập nhật từ máy chủ Cloud không cần người dùng cài lại app.'}
              </Text>
            </View>

            {/* Stats Dashboard */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{allSensitivityData.length}+</Text>
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

            
            {/* Real System Overlay Trigger Card */}
            <View style={{ backgroundColor: 'rgba(255, 107, 0, 0.12)', borderColor: COLORS.primary, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF' }}>🎮 NOVO GG GAME SPACE • SÁT MÉP TRÁI</Text>
                <View style={{ backgroundColor: COLORS.accentGreen, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>CÀI ĐẶT HỆ THỐNG THẬT</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginBottom: 10 }}>
                Thanh gạt nép sát mép trái màn hình, trượt ra mở menu vòng cung Gaming Phone: <Text style={{ color: '#FF3355', fontWeight: 'bold' }}>Tâm Ảo (Mira Virtual)</Text>, <Text style={{ color: '#00FFA3', fontWeight: 'bold' }}>Tăng Tốc FPS (Dọn RAM thật)</Text>, <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>Khóa Xoay, Sáng 100%, DND Chặn Thông Báo & Đổi DPI</Text>!
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={{ flex: 1.4, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={toggleSystemFloatingOverlay}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>
                    🔘 BẬT GG GAME SPACE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1.1, backgroundColor: '#1A1D2E', borderColor: '#FFBB00', borderWidth: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={handleRequestAllPermissions}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFBB00' }}>
                    ⚙️ CẤP QUYỀN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 0.8, backgroundColor: 'rgba(255, 51, 85, 0.15)', borderColor: '#FF3355', borderWidth: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={stopSystemFloatingOverlay}>
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FF3355' }}>
                    🔴 TẮT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 38, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => setShowGameTurboModal(true)}>
                  <Text style={{ fontSize: 13 }}>👁️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Launch Free Fire Center */}
            <Text style={styles.sectionTitle}>🚀 KHỞI ĐỘNG FREE FIRE 1 CHẠM</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.surface, borderColor: COLORS.primary, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' }}
                onPress={() => handleLaunchGameWithOverlay('freefire://', 'https://play.google.com/store/apps/details?id=com.dts.freefireth')}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>🔥</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>Free Fire</Text>
                <Text style={{ fontSize: 9, color: COLORS.secondary, fontWeight: '800' }}>Bản Chuẩn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.surface, borderColor: COLORS.secondary, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' }}
                onPress={() => handleLaunchGameWithOverlay('freefiremax://', 'https://play.google.com/store/apps/details?id=com.dts.freefiremax')}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>⚡</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>FF MAX</Text>
                <Text style={{ fontSize: 9, color: COLORS.secondary, fontWeight: '800' }}>Đồ Họa HD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.surface, borderColor: '#00F0FF', borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' }}
                onPress={() => handleLaunchGameWithOverlay('freefirevn://', 'https://ff.garena.vn/')}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>🇻🇳</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>FF VN</Text>
                <Text style={{ fontSize: 9, color: '#00F0FF', fontWeight: '800' }}>Garena VN</Text>
              </TouchableOpacity>
            </View>

            {/* Free Fire Wiki & Music Center */}
            <View style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', borderColor: '#00F0FF', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF' }}>🌐 WIKI FREE FIRE & 🎵 NHẠC CHIẾN</Text>
                <View style={{ backgroundColor: '#00F0FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>GARENA OFFICIAL</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginBottom: 10 }}>
                Tra cứu cổng dữ liệu thông số súng <Text style={{ color: '#00F0FF', fontWeight: 'bold' }}>wiki.ff.garena.vn</Text> và bật nhạc chiến Phonk/EDM hype trực tiếp khi chơi!
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1.2, backgroundColor: '#00F0FF', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => Linking.openURL('https://wiki.ff.garena.vn/').catch(() => Alert.alert('Lỗi', 'Không thể mở web.'))}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>🌐 MỞ WIKI GARENA ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: 'rgba(255, 187, 0, 0.15)', borderColor: COLORS.secondary, borderWidth: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setBubbleResetTrigger(prev => prev + 1)}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.secondary }}>🎵 BẬT NHẠC CHIẾN</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Access Tools */}
            <Text style={styles.sectionTitle}>🛠️ CÔNG CỤ TÁC CHIẾN ESPORTS</Text>
            <View style={styles.quickToolsRow}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  handleTabSwitch('TrainingHudTab');
                }}>
                <Text style={styles.toolIcon}>🎮</Text>
                <Text style={styles.toolTitle}>Phòng Luyện & HUD</Text>
                <Text style={styles.toolDesc}>Kéo tâm Free Fire, đổi nút bắn & xoay ngang</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  handleTabSwitch('SensitivityTab');
                  setSensSubScreen('BrandList');
                  setBrandListFilter('2026');
                }}>
                <Text style={styles.toolIcon}>⚡</Text>
                <Text style={styles.toolTitle}>Siêu Phẩm 2026 ({devices2026.length})</Text>
                <Text style={styles.toolDesc}>Cấu hình Flagship OB mới nhất</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickToolsRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  handleTabSwitch('SensitivityTab');
                  setSensSubScreen('BrandList');
                  setBrandListFilter('GAMING');
                }}>
                <Text style={styles.toolIcon}>🚀</Text>
                <Text style={styles.toolTitle}>Gaming Phone ({devicesGaming.length})</Text>
                <Text style={styles.toolDesc}>Màn 144Hz–165Hz kéo cực mượt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => {
                  handleTabSwitch('AccountTab');
                }}>
                <Text style={styles.toolIcon}>💾</Text>
                <Text style={styles.toolTitle}>Cấu Hình Đã Lưu ({savedConfigs.length})</Text>
                <Text style={styles.toolDesc}>Xem & đổi tên hồ sơ chiến đấu</Text>
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
                        if (item.brand) setSelectedBrand(item.brand);
                        setSelectedConfig(item);
                        setSensNavSource('BrandList');
                        setSensSubScreen('DetailView');
                      }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={styles.deviceBrandBadge}>{item.brand}</Text>
                          {item.is2026 && (
                            <View style={styles.badge2026Mini}>
                              <Text style={styles.badge2026MiniText}>⚡ 2026 ESPORTS</Text>
                            </View>
                          )}
                        </View>
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
                <View style={{ flex: 1 }}>
                  {/* Category Filter Pills (Nhiều lựa chọn cấu hình máy) */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 2 }}
                    style={{ marginBottom: 12, flexGrow: 0 }}>
                    <View style={styles.categoryFilterRow}>
                      {[
                        { key: 'ALL', label: '🏢 16 Hãng Máy', count: 16 },
                        { key: '2026', label: '⚡ Siêu Phẩm 2026', count: devices2026.length },
                        { key: 'GAMING', label: '🚀 Gaming 144Hz+', count: devicesGaming.length },
                        { key: 'MIDRANGE', label: '📱 Tầm Trung', count: devicesMidrange.length },
                        { key: 'BUDGET', label: '🔋 Máy Yếu (60Hz)', count: devicesBudget.length },
                        { key: 'IOS', label: '🍏 Apple iOS', count: devicesIos.length },
                      ].map((cat) => {
                        const isCatSel = brandListFilter === cat.key;
                        return (
                          <TouchableOpacity
                            key={cat.key}
                            style={[styles.catFilterPill, isCatSel && styles.catFilterPillActive]}
                            onPress={() => setBrandListFilter(cat.key)}>
                            <Text style={[styles.catFilterPillText, isCatSel && styles.catFilterPillTextActive]}>
                              {cat.label} ({cat.count})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Render based on selected category filter */}
                  {brandListFilter === 'ALL' ? (
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
                  ) : (
                    <FlatList
                      data={
                        brandListFilter === '2026'
                          ? devices2026
                          : brandListFilter === 'GAMING'
                          ? devicesGaming
                          : brandListFilter === 'MIDRANGE'
                          ? devicesMidrange
                          : brandListFilter === 'BUDGET'
                          ? devicesBudget
                          : devicesIos
                      }
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 100 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.deviceItemCard}
                          onPress={() => {
                            if (item.brand) setSelectedBrand(item.brand);
                            setSelectedConfig(item);
                            setSensNavSource('BrandList');
                            setSensSubScreen('DetailView');
                          }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <Text style={styles.deviceBrandBadge}>{item.brand}</Text>
                              {item.is2026 && (
                                <View style={styles.badge2026Mini}>
                                  <Text style={styles.badge2026MiniText}>⚡ 2026 ESPORTS</Text>
                                </View>
                              )}
                            </View>
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
                  )}
                </View>
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
                <Text style={styles.backButtonIcon}>‹</Text>
                <Text style={styles.backButtonText}>Quay lại chọn hãng</Text>
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
                <Text style={styles.backButtonIcon}>‹</Text>
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
                    <Text style={styles.emptyTitle}>Chưa có máy trong phân mục này</Text>
                    <Text style={styles.emptyDesc}>Hãy thử tìm kiếm trên thanh tìm kiếm hoặc chọn phân khúc khác nhé!</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItemCard}
                    onPress={() => {
                      if (item.brand) setSelectedBrand(item.brand);
                      setSelectedConfig(item);
                      setSensNavSource('DeviceList');
                      setSensSubScreen('DetailView');
                    }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.deviceBrandBadge}>{item.brand}</Text>
                        {item.is2026 && (
                          <View style={styles.badge2026Mini}>
                            <Text style={styles.badge2026MiniText}>⚡ 2026 ESPORTS</Text>
                          </View>
                        )}
                      </View>
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
          const scopeAWM = config.awm || Math.max(40, Math.round(generalVal * 0.40));
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
                <Text style={styles.backButtonIcon}>‹</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={styles.detailBrandTag}>{config.brand || 'Free Fire'}</Text>
                  {config.is2026 && (
                    <View style={styles.badge2026Header}>
                      <Text style={styles.badge2026HeaderText}>⚡ BẢN CHUẨN ESPORTS 2026</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailTitle}>{config.deviceName || config.name || config.title || 'Cấu hình tùy chỉnh'}</Text>
                <Text style={styles.detailAuthor}>Hiệu chuẩn: Esports Headshot Lab 2026</Text>
              </View>

              {/* Tùy chọn chế độ súng chuyên biệt */}
              <Text style={styles.sectionTitle}>🔫 TỐI ƯU CẤU HÌNH THEO VŨ KHÍ</Text>
              <View style={styles.weaponDetailPillRow}>
                <TouchableOpacity
                  style={[styles.weaponDetailPill, detailWeaponMode === 'ALL' && styles.weaponDetailPillActive]}
                  onPress={() => setDetailWeaponMode('ALL')}>
                  <Text style={[styles.weaponDetailPillText, detailWeaponMode === 'ALL' && styles.weaponDetailPillTextActive]}>
                    🎯 Toàn Diện
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.weaponDetailPill, detailWeaponMode === 'SHOTGUN' && styles.weaponDetailPillActive]}
                  onPress={() => setDetailWeaponMode('SHOTGUN')}>
                  <Text style={[styles.weaponDetailPillText, detailWeaponMode === 'SHOTGUN' && styles.weaponDetailPillTextActive]}>
                    💥 Shotgun M1887
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.weaponDetailPill, detailWeaponMode === 'SMG' && styles.weaponDetailPillActive]}
                  onPress={() => setDetailWeaponMode('SMG')}>
                  <Text style={[styles.weaponDetailPillText, detailWeaponMode === 'SMG' && styles.weaponDetailPillTextActive]}>
                    ⚡ MP40 Sấy Trùm
                  </Text>
                </TouchableOpacity>
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
                  <Text style={[styles.hardwareValue, { color: COLORS.secondary }]}>{config.dpi}</Text>
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
                    {dragTip}
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
                  <Text style={styles.dragArrowLabel}>{dragTip}</Text>
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

              {/* Nút Hành Động: Vào luyện tâm ngay & Lưu & Chia sẻ */}
              <TouchableOpacity
                style={styles.testInTrainerBtn}
                onPress={() => {
                  handleTabSwitch('TrainingHudTab');
                }}>
                <Text style={styles.testInTrainerBtnText}>🎮 VÀO LUYỆN TÂM VỚI MÁY NÀY →</Text>
              </TouchableOpacity>

              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={styles.saveActionButton}
                  onPress={() => handleOpenSaveModal(config)}>
                  <Text style={styles.actionButtonText}>💾 LƯU CẤU HÌNH</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareActionButton}
                  onPress={() => handleShareSensitivity(config)}>
                  <Text style={styles.shareActionButtonText}>📤 CHIA SẺ</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          );
        }
        return null;

      // ---------------- TAB 3: PHÒNG LUYỆN KÉO TÂM & HUD STUDIO (GỘP CHUNG) ----------------
      case 'TrainingHudTab':
      case 'AimTrainerTab':
      case 'HudDpiTab':
      case 'AiCoachTab':
      case 'GeneratorTab':
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

      // ---------------- TAB 4: TÀI KHOẢN & QUẢN LÝ CẤU HÌNH (MULTI-SAVE) ----------------
      case 'AccountTab':
        const displayedList = showAllSaved ? filteredSavedConfigs : filteredSavedConfigs.slice(0, 5);

        return (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}>
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
                          const targetConfig = item.config || item;
                          if (item.brand || targetConfig.brand) setSelectedBrand(item.brand || targetConfig.brand);
                          setSelectedConfig(targetConfig);
                          setSensNavSource('AccountTab');
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

            {/* CÀI ĐẶT TRỢ LÝ & BONG BÓNG CHAT */}
            <View style={styles.supportCard}>
              <View style={styles.tacticalCornerTL} />
              <View style={styles.tacticalCornerBR} />
              <Text style={styles.supportTitle}>🤖 BONG BÓNG AI COACH & PHÁT NHẠC</Text>
              <Text style={styles.supportDesc}>
                Bong bóng AI Coach và Trình phát nhạc MP3/M4A/MP4/Link hỗ trợ kéo thả tự do, tự căn lề màn hình và chạy nhạc nền khi leo rank. Nếu bong bóng bị kéo lệch ngoài tầm nhìn, bấm nút dưới để đặt lại ngay lập tức.
              </Text>
              <TouchableOpacity
                style={styles.resetBubbleBtn}
                onPress={() => {
                  setBubbleResetTrigger((prev) => prev + 1);
                  Alert.alert(
                    '✅ Đã Đặt Lại Vị Trí',
                    'Bong bóng chat & trình phát nhạc đã được đưa về góc dưới bên phải màn hình!'
                  );
                }}>
                <Text style={styles.resetBubbleBtnText}>🎯 ĐẶT LẠI VỊ TRÍ BONG BÓNG CHAT</Text>
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

      {/* 🔥 FLOATING CIRCULAR GAME SPACE BUTTON 🔥 */}
      <TouchableOpacity
        style={styles.floatingTurboCircle}
        onPress={() => setShowGameTurboModal(true)}>
        <Text style={{ fontSize: 16 }}>⚡</Text>
        <Text style={styles.floatingTurboCircleFps}>{turboLiveFps}</Text>
        <Text style={styles.floatingTurboCircleBat}>🔋 85%</Text>
      </TouchableOpacity>

      {/* 🔥 GG GAME SPACE GAMING PHONE HUD MODAL 🔥 */}
      <Modal visible={showGameTurboModal} transparent animationType="slide">
        <View style={styles.turboModalBackdrop}>
          <View style={styles.gameSpaceHudCard}>
            {/* Top Bar Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => setShowGameTurboModal(false)}>
                  <Text style={{ fontSize: 16 }}>🏠</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('🎯 Độ nhạy OB47', 'Đã match cấu hình chuẩn kéo tâm Free Fire!')}>
                  <Text style={{ fontSize: 16 }}>🎯</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowGameTurboModal(false); handleLaunchGameWithOverlay('freefire://', 'https://play.google.com/store/apps/details?id=com.dts.freefireth'); }}>
                  <Text style={{ fontSize: 16 }}>🎮</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 2 }}>GAMESPACE</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => setShowGameTurboModal(false)} style={styles.closeBtn}>
                  <Text style={{ color: '#FFBB00', fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={stopSystemFloatingOverlay} style={{ backgroundColor: 'rgba(255, 51, 85, 0.2)', borderColor: '#FF3355', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: '#FF3355', fontWeight: '900', fontSize: 10 }}>🔴 TẮT NÚT NỔI</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Dials & Wings Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {/* Left Wing: CPU & Mode */}
                <View style={{ flex: 1, backgroundColor: '#121422', borderColor: '#FFBB00', borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>2.84 GHz</Text>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFBB00', marginTop: 2 }}>⚡ XUNG NHỊP CPU</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FFBB00', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}
                    onPress={() => {
                      const next = gameSpaceMode === '⚡ CÂN BẰNG' ? '🔥 TURBO BEAST' : gameSpaceMode === '🔥 TURBO BEAST' ? '🏆 ESPORTS 120HZ' : '⚡ CÂN BẰNG';
                      setGameSpaceMode(next);
                      Alert.alert('🎮 Chế độ Game Space', `Đã chuyển sang: ${next}`);
                    }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#000' }}>{gameSpaceMode}</Text>
                  </TouchableOpacity>
                </View>

                {/* Right Wing: GPU & FPS */}
                <View style={{ flex: 1, backgroundColor: '#121422', borderColor: '#00FFA3', borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#00FFA3', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{turboLiveFps}</Text>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted }}> FPS | </Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFBB00', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{turboLiveTemp}°C</Text>
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#00FFA3', marginTop: 2 }}>🎮 GPU: 405 MHz • NHIỆT ĐỘ</Text>
                  <View style={{ backgroundColor: 'rgba(0, 255, 163, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#00FFA3' }}>🛡️ CHỐNG TỤT FPS: BẬT</Text>
                  </View>
                </View>
              </View>

              {/* Quick DPI Changer Card */}
              <View style={{ backgroundColor: '#0F111C', borderColor: '#252A3D', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#00FFA3' }}>📐 THAY ĐỔI DPI NHANH (FREE FIRE):</Text>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFBB00' }}>DPI: {selectedGameSpaceDpi}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  {[360, 411, 480, 560, 600].map((dpi) => (
                    <TouchableOpacity
                      key={dpi}
                      style={{
                        flex: 1,
                        backgroundColor: selectedGameSpaceDpi === dpi ? '#00FFA3' : '#1A1D2E',
                        paddingVertical: 5,
                        borderRadius: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: selectedGameSpaceDpi === dpi ? '#00FFA3' : '#2A3045',
                      }}
                      onPress={() => {
                        setSelectedGameSpaceDpi(dpi);
                        Alert.alert('🎯 Cân Chỉnh DPI', `Đã áp dụng cấu hình độ nhạy tối ưu cho DPI: ${dpi}!`);
                      }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: selectedGameSpaceDpi === dpi ? '#000' : '#FFF' }}>{dpi}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sensitivity Preset Card */}
              <View style={{ backgroundColor: '#0F111C', borderColor: '#252A3D', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFBB00', marginBottom: 4 }}>🎯 ĐỘ NHẠY KÉO TÂM OB47 (THANG 200):</Text>
                <Text style={{ fontSize: 11, color: '#D0D5E5', lineHeight: 16 }}>
                  • Nhìn xung quanh: 188  |  • Red Dot Sight: 178{'\n'}
                  • 2x Scope: 165  |  • Nút bắn: 42% (Vuốt Chữ J Cận Chiến)
                </Text>
              </View>

              {/* Action Buttons Grid (8 nút như ảnh Game Space) */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF', marginBottom: 6 }}>⚡ BẢNG ĐIỀU KHIỂN GAMING SPACE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity style={styles.gameSpaceGridBtn} onPress={() => Alert.alert('📶 Độ Trễ Mạng', 'Ping: 24ms (Mượt mà để leo Rank)')}>
                  <Text style={styles.gameSpaceGridBtnText}>📶 WiFi: 24ms</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gameSpaceGridBtn} onPress={() => Alert.alert('⚡ Tần Số Quét', '120Hz Ultra Gaming Display Active')}>
                  <Text style={styles.gameSpaceGridBtnText}>⚡ 120Hz Display</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.gameSpaceGridBtn, { borderColor: '#00FFA3' }]} onPress={() => Alert.alert('🚀 Dọn Dẹp RAM', 'Đã giải phóng 680MB RAM cho Free Fire!')}>
                  <Text style={[styles.gameSpaceGridBtnText, { color: '#00FFA3' }]}>🚀 DỌN RAM 1-CHẠM</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gameSpaceGridBtn} onPress={() => Alert.alert('🎯 Touch Accuracy', 'Đã bật chế độ tăng tốc phản hồi cảm ứng!')}>
                  <Text style={styles.gameSpaceGridBtnText}>🎯 Touch Accu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gameSpaceGridBtn} onPress={() => Alert.alert('🔕 Không Làm Phiền', 'Đã bật chế độ chặn cuộc gọi/thông báo khi chơi!')}>
                  <Text style={styles.gameSpaceGridBtnText}>🔕 Chặn Thông Báo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gameSpaceGridBtn} onPress={() => Alert.alert('🔒 Chống Chạm Viền', 'Đã khóa cảm ứng mép viền màn hình!')}>
                  <Text style={styles.gameSpaceGridBtnText}>🔒 Khóa Chạm Viền</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.gameSpaceGridBtn, { borderColor: '#FF6B00' }]} onPress={() => { setShowGameTurboModal(false); handleLaunchGameWithOverlay('freefire://', 'https://play.google.com/store/apps/details?id=com.dts.freefireth'); }}>
                  <Text style={[styles.gameSpaceGridBtnText, { color: '#FF6B00' }]}>🎮 VÀO FREE FIRE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.gameSpaceGridBtn, { borderColor: '#FF3355' }]} onPress={stopSystemFloatingOverlay}>
                  <Text style={[styles.gameSpaceGridBtnText, { color: '#FF3355' }]}>🔴 TẮT NÚT NỔI</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bottom Status Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#10121D', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>21:10</Text>
              <Text style={{ fontSize: 10, color: '#00FFA3', fontWeight: '900' }}>🔋 85%</Text>
              <Text style={{ fontSize: 10, color: '#8E93A6' }}>🌐 38.5 KB/S</Text>
              <Text style={{ fontSize: 9.5, color: '#FFBB00', fontWeight: '900' }}>🎮 GG GAME SPACE</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar (iOS 26 Floating Frosted Bar - Tự ẩn khi xoay ngang trong phòng luyện) */}
      {!(activeTab === 'TrainingHudTab' && isLandscapeMode) && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabSwitch('HomeTab')}>
            <Text style={[styles.navIcon, activeTab === 'HomeTab' && styles.activeNavText]}>🏠</Text>
            <Text style={[styles.navLabel, activeTab === 'HomeTab' && styles.activeNavText]}>
              Trang Chủ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              handleTabSwitch('SensitivityTab');
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

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabSwitch('TrainingHudTab')}>
            <Text style={[styles.navIcon, (activeTab === 'TrainingHudTab' || activeTab === 'AimTrainerTab' || activeTab === 'HudDpiTab') && styles.activeNavText]}>
              🎮
            </Text>
            <Text style={[styles.navLabel, (activeTab === 'TrainingHudTab' || activeTab === 'AimTrainerTab' || activeTab === 'HudDpiTab') && styles.activeNavText]}>
              Luyện & HUD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabSwitch('AccountTab')}>
            <Text style={[styles.navIcon, activeTab === 'AccountTab' && styles.activeNavText]}>
              👤
            </Text>
            <Text style={[styles.navLabel, activeTab === 'AccountTab' && styles.activeNavText]}>
              Tài Khoản
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 1: ĐẶT TÊN KHI LƯU CẤU HÌNH (LƯU KHÔNG GIỚI HẠN) */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: ĐỔI TÊN CẤU HÌNH ĐÃ LƯU */}
      <Modal visible={isRenameModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: CHỈNH SỬA PROFILE */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL THÔNG BÁO BẢN CẬP NHẬT MỚI TỪ GITHUB (1-CHẠM TẢI APK) */}
      <Modal visible={!!newReleaseInfo} transparent animationType="fade">
        <View style={styles.turboModalBackdrop}>
          <View style={[styles.gameSpaceHudCard, { borderColor: '#00FFA3', borderWidth: 2, padding: 18 }]}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 36, marginBottom: 6 }}>🚀</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#00FFA3', textAlign: 'center', letterSpacing: 1 }}>
                ĐÃ CÓ BẢN MỚI {newReleaseInfo?.version}!
              </Text>
              <Text style={{ fontSize: 11, color: '#8E93A6', marginTop: 4, textAlign: 'center' }}>
                Bản phát hành cập nhật tính năng định kỳ từ GitHub
              </Text>
            </View>

            <View style={{ backgroundColor: '#141724', borderRadius: 12, padding: 12, marginBottom: 16, borderColor: '#252A3D', borderWidth: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFBB00', marginBottom: 6 }}>
                📋 Chi tiết bản cập nhật:
              </Text>
              <Text style={{ fontSize: 11, color: '#D0D5E5', lineHeight: 18 }} numberOfLines={6}>
                {newReleaseInfo?.notes}
              </Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#00FFA3', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 }}
              onPress={() => {
                if (newReleaseInfo?.downloadUrl) {
                  Linking.openURL(newReleaseInfo.downloadUrl);
                }
              }}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
                📥 TẢI APK MỚI NGAY (1-CHẠM)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setNewReleaseInfo(null)}>
              <Text style={{ color: '#8E93A6', fontSize: 11, fontWeight: '700' }}>
                Để sau (Độ nhạy AI vẫn tự động cập nhật OTA)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BONG BÓNG CHAT AI COACH OB 2026 (Nổi trên mọi màn hình, tự động neo góc an toàn khi xoay ngang) */}
      <AiChatBubble
        isLandscapeMode={isLandscapeMode}
        resetTrigger={bubbleResetTrigger}
        onApplyToTrainer={(cfg) => {
          setSelectedConfig(cfg);
          handleTabSwitch('TrainingHudTab');
        }}
        onSaveConfig={(cfg) => {
          handleOpenSaveModal(cfg);
        }}
      />
    </SafeAreaView>
  );
}

// ================= STYLES: iOS 26 LIQUID GLASS (MINIMALIST, FROSTED, ACCENT ORANGE) =================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // Tactical Corner Accents: Tắt bỏ góc nhọn để UI mềm mại chuẩn iOS
  tacticalCornerTL: {
    display: 'none',
    width: 0,
    height: 0,
  },
  tacticalCornerBR: {
    display: 'none',
    width: 0,
    height: 0,
  },

  // Auth Screen Styles (iOS Frosted Glass)
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
  },
  authCard: {
    backgroundColor: COLORS.glassCardElevated,
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  authLogoBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  authLogoIcon: {
    fontSize: 34,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
    marginTop: 4,
  },
  greetingText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFF',
  },
  rankBadgeText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  headerAvatarText: {
    color: COLORS.primaryBright,
    fontWeight: '900',
    fontSize: 16,
  },

  // Banner iOS 26 Liquid Glass
  cyberBanner: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 16,
  },
  tacticalDecalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tacticalDecalText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  bannerBadgeText: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: 14,
  },
  bannerActionBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerActionBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // Stats (Liquid Glass Minimalist)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.glassCard,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '700',
  },

  // Quick Tools
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  toolCard: {
    flex: 1,
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  toolTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  toolDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },

  // Tips (Liquid Glass)
  tipCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  tipTitleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  tipDescText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  // Common Screen Titles
  screenMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    marginTop: 4,
  },
  screenSubTitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
  },

  // Search Bar (iOS Frosted Pill)
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },

  // Brand Cards (Liquid Glass Bo Tròn)
  brandItemCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  brandCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  brandIconText: {
    fontSize: 22,
  },
  brandTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  brandSubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  brandArrow: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Nút Quay Lại Cực To Dễ Bấm (iOS 26 Frosted Pill)
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 16,
    marginTop: 2,
  },
  backButtonIcon: {
    color: COLORS.primaryBright,
    fontSize: 26,
    fontWeight: '300',
    marginRight: 6,
    marginTop: -2,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Device List Cards
  deviceItemCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  deviceBrandBadge: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceItemTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  deviceItemSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  scorePill: {
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.3)',
  },
  scorePillText: {
    color: COLORS.primaryBright,
    fontWeight: '900',
    fontSize: 15,
  },

  // Detail View Cards
  detailHeaderCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 16,
  },
  detailBrandTag: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  detailAuthor: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Sliders Panel
  inGamePanel: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  ffSliderContainer: {
    marginBottom: 16,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ffSliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  ffSliderValue: {
    color: COLORS.primaryBright,
    fontSize: 15,
    fontWeight: '900',
  },
  ffTrackBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ffTrackProgress: {
    height: '100%',
    backgroundColor: COLORS.primaryBright,
    borderRadius: 4,
  },

  // Hardware Card
  hardwareCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  hardwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  hardwareLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  hardwareValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // HUD Simulator Box
  hudSimulatorBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
    gap: 10,
  },
  saveActionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  shareActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  shareActionButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Generator Tab Styles
  fieldSectionTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  activeChip: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFF',
    fontWeight: '800',
  },
  calcButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  calcButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  generatedResultCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    marginBottom: 20,
  },
  generatedBadge: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  generatedBadgeText: {
    color: COLORS.primaryBright,
    fontSize: 10,
    fontWeight: '800',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  genGridLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  genGridValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  genDragBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  genDragLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 6,
  },
  genDragValue: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Account Tab Styles
  profileBox: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  profileAvatarText: {
    color: COLORS.primaryBright,
    fontSize: 18,
    fontWeight: '900',
  },
  profileName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileRank: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  profileStatus: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  editProfileBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  editProfileBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  savedSectionHeader: {
    marginVertical: 10,
  },
  savedSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  emptySavedBox: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  emptySavedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptySavedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySavedSubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  savedConfigCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  savedItemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  savedItemDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  savedItemStats: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  savedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  renameBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
  },
  renameBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  delBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  delBtnText: {
    color: COLORS.accentRed,
    fontSize: 11,
    fontWeight: '800',
  },
  toggleSavedBtn: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  toggleSavedBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  menuList: {
    marginTop: 10,
  },
  menuRow: {
    backgroundColor: COLORS.glassCard,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  menuRowText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: COLORS.accentRed,
    fontWeight: '800',
    fontSize: 13,
  },

  // Bottom Navigation Bar (iOS 26 Floating Frosted Bar)
  bottomBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 82 : 68,
    backgroundColor: 'rgba(12, 14, 18, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeNavText: {
    color: COLORS.primaryBright,
    fontWeight: '800',
  },

  // Modals (iOS Liquid Glass Sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(18, 20, 26, 0.96)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    shadowColor: '#000',
    shadowRadius: 20,
    shadowOpacity: 0.5,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalSubDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalFieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  tagSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 4,
    marginBottom: 4,
  },
  tagPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
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
    color: '#FFF',
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

  // 2026 Badges & Filters
  badge2026Mini: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badge2026MiniText: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: '800',
  },
  badge2026Header: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badge2026HeaderText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
  },
  filterTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTabBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterTabBtnActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: COLORS.primary,
  },
  filterTabBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  hudDpiSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginHorizontal: 16,
    marginTop: 8,
  },
  hudDpiBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  hudDpiBtnActive: {
    backgroundColor: COLORS.primary,
  },
  hudDpiBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  hudDpiBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },

  // Category Filter Pills (Horizontal Scroll)
  categoryFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  catFilterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  catFilterPillActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    borderColor: COLORS.primary,
  },
  catFilterPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  catFilterPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },

  // Weapon Detail Pills
  weaponDetailPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  weaponDetailPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  weaponDetailPillActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    borderColor: COLORS.primary,
  },
  weaponDetailPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  weaponDetailPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },

  // Test in Trainer Button
  testInTrainerBtn: {
    backgroundColor: COLORS.accentGreen,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  testInTrainerBtnText: {
    color: '#0A1A0F',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetBubbleBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    marginTop: 12,
  },
  floatingTurboCircle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 32,
    right: 14,
    zIndex: 9999,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(18, 20, 31, 0.95)',
    borderColor: '#FF6B00',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingTurboCircleFps: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00FFA3',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: -2,
  },
  floatingTurboCircleBat: {
    fontSize: 7.5,
    color: '#8E93A6',
    fontWeight: 'bold',
  },
  turboModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  gameSpaceHudCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#07080E',
    borderColor: '#FF6B00',
    borderWidth: 1.8,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  gameSpaceGridBtn: {
    width: '48.5%',
    backgroundColor: '#121422',
    borderColor: '#262A3E',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameSpaceGridBtnText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFF',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBubbleBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
