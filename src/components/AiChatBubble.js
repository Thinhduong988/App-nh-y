import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PanResponder,
  Easing,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../theme/colors';
import { SOUNDS } from '../utils/soundEffects';

const QUICK_PROMPTS = [
  { id: 'chest', label: '🛡️ Tâm bị dính ngực', text: 'Tâm em bắn hay bị ghim cứng vào ngực địch, kéo mãi không lên đầu được.' },
  { id: 'overshoot', label: '🚀 Tâm vọt qua đầu', text: 'Em kéo tâm hay bị vọt qua đầu bay lên trời, phải chỉnh thế nào?' },
  { id: 'shotgun', label: '💥 Shotgun M1887 một viên', text: 'Cho em cách vuốt tâm và độ nhạy bắn Shotgun M1887 cận chiến dính đầu.' },
  { id: 'smg', label: '⚡ Sấy MP40 chùm đạn đỏ', text: 'Chỉnh độ nhạy sấy MP40 và UMP không bị xòe đạn, ăn trọn cụm đỏ.' },
  { id: 'glass', label: '🧤 Kính nhám / Bao ngón tay', text: 'Em mới dán kính cường lực nhám và dùng bao ngón tay thì chỉnh thế nào?' },
  { id: 'phone_spec', label: '📱 Đề xuất theo máy của em', text: 'Em muốn AI phân tích cấu hình máy của em để ra thông số chuẩn nhất.' },
];

const DEFAULT_TRACKS = [
  {
    id: 'def-1',
    name: '⚡ Free Fire Phonk (Bass Boost 2026)',
    author: 'Esports Gaming Beat',
    uri: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
    duration: '0:35',
    formatType: 'MP3',
    isCustom: false,
  },
  {
    id: 'def-2',
    name: '🔥 EDM Headshot Trap Beat (Esports Mix)',
    author: 'Cyber Montage Beat',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
    formatType: 'MP3',
    isCustom: false,
  },
  {
    id: 'def-3',
    name: '🎧 Lo-Fi Chill Leo Rank Đêm (Ghìm Tâm)',
    author: 'Night Chill Free Fire',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '7:05',
    formatType: 'MP3',
    isCustom: false,
  },
  {
    id: 'def-4',
    name: '💥 Brazil Phonk Auto Headshot Mix',
    author: 'High Ping Montage',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '5:44',
    formatType: 'LINK',
    isCustom: false,
  },
];

const PRESET_STREAM_LINKS = [
  {
    name: '⚡ Free Fire Phonk Drift Bass Boost 2026',
    url: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
    tag: 'Phonk',
  },
  {
    name: '🔥 EDM Esports Montage Beat (Drop Căng)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    tag: 'EDM',
  },
  {
    name: '🎧 Free Fire Chill Lofi Leo Rank (Hồi Tâm)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    tag: 'Lofi',
  },
  {
    name: '💥 Brazil Phonk Auto Headshot Master Mix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    tag: 'Esport Trap',
  },
];

export default function AiChatBubble({
  onApplyToTrainer,
  onSaveConfig,
  hidden = false,
  isLandscapeMode = false,
  resetTrigger = 0,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [isOpen, setIsOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('CHAT'); // 'CHAT' | 'MUSIC'
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Xin chào Xạ Thủ! 👋 Tôi là Trợ Lý AI Kéo Tâm Free Fire (OB 2026).\n\nBạn đang gặp vấn đề gì khi kéo tâm (dính ngực, vọt đầu) hay cần độ nhạy cho dòng máy nào? Bạn cũng có thể mở tab "Nhạc Chiến" để nghe nhạc từ video MP4, MP3, M4A hoặc dán link online nhé!',
      timestamp: 'Vừa xong',
    },
  ]);

  // Bubble Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  // Music Player States
  const soundInstance = useRef(null);
  const [customTracks, setCustomTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState('LOOP_ALL'); // 'LOOP_ALL' (phát tiếp tục cả danh sách) | 'LOOP_ONE' (lặp 1 bài)
  const [volume, setVolume] = useState(80);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Search & Link Input States
  const [searchTrackQuery, setSearchTrackQuery] = useState('');
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [inputLinkUrl, setInputLinkUrl] = useState('');
  const [inputLinkTitle, setInputLinkTitle] = useState('');

  // Floating Pop-up & Toast states
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const toastFadeAnim = useRef(new Animated.Value(0)).current;

  // Spinning Vinyl Animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef(null);

  // Anti-Disappearance Floating Position with PanResponder
  const pan = useRef(
    new Animated.ValueXY({
      x: screenWidth - 74,
      y: screenHeight - 165,
    })
  ).current;

  const currentPos = useRef({
    x: screenWidth - 74,
    y: screenHeight - 165,
  });
  const isDraggingRef = useRef(false);

  // Sync listener for pan coordinates
  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, []);

  // Screen rotation & dimension change safe-guard (Prevents bubble from disappearing off-screen)
  useEffect(() => {
    const curX = currentPos.current.x;
    const curY = currentPos.current.y;

    let targetX, targetY;
    if (isLandscapeMode) {
      // In landscape (phòng tập ngang), position safely in the top-right corner so it never blocks controls
      targetX = Math.max(10, screenWidth - 70);
      targetY = 16;
    } else {
      targetX = isNaN(curX) ? screenWidth - 74 : Math.max(10, Math.min(screenWidth - 74, curX));
      targetY = isNaN(curY) ? screenHeight - 165 : Math.max(60, Math.min(screenHeight - 130, curY));
    }

    Animated.spring(pan, {
      toValue: { x: targetX, y: targetY },
      friction: 7,
      useNativeDriver: false,
    }).start(() => {
      currentPos.current = { x: targetX, y: targetY };
    });
  }, [screenWidth, screenHeight, isLandscapeMode, resetTrigger]);

  // Safe gesture release & terminate handler
  const handleReleaseOrTerminate = () => {
    try {
      pan.flattenOffset();
    } catch (e) {}

    if (!isDraggingRef.current) {
      setIsOpen(true);
      try {
        SOUNDS.playWeaponShot('smg');
      } catch (e) {}
    } else {
      let curX = currentPos.current.x;
      let curY = currentPos.current.y;
      if (isNaN(curX)) curX = screenWidth - 74;
      if (isNaN(curY)) curY = screenHeight - 165;

      const targetX = curX < screenWidth / 2 ? 14 : screenWidth - 74;
      const clampedY = Math.max(50, Math.min(screenHeight - 130, curY));

      Animated.spring(pan, {
        toValue: { x: targetX, y: clampedY },
        friction: 6,
        useNativeDriver: false,
      }).start(() => {
        currentPos.current = { x: targetX, y: clampedY };
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        try {
          pan.extractOffset();
        } catch (e) {}
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDraggingRef.current = true;
        }
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: handleReleaseOrTerminate,
      onPanResponderTerminate: handleReleaseOrTerminate,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  // Pulse animation for floating bubble
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Spin animation when music plays
  useEffect(() => {
    if (isPlaying) {
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.current.start();
    } else {
      if (spinLoop.current && spinLoop.current.stop) {
        spinLoop.current.stop();
      }
      spinAnim.setValue(0);
    }
  }, [isPlaying]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Toast Pop-up trigger
  const showToastNotification = (msg) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(toastFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMessage(''));
  };

  // Load saved playlist & last played track on mount
  useEffect(() => {
    const loadSavedPlaylist = async () => {
      try {
        const saved = await AsyncStorage.getItem('@my_custom_music_playlist');
        if (saved) {
          const list = JSON.parse(saved);
          setCustomTracks(list);
        }

        const lastTrackData = await AsyncStorage.getItem('@last_played_track_info');
        if (lastTrackData) {
          const parsed = JSON.parse(lastTrackData);
          if (parsed && parsed.uri) {
            setCurrentTrack(parsed);
          }
        }
      } catch (e) {}
    };
    loadSavedPlaylist();

    return () => {
      if (soundInstance.current) {
        soundInstance.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Full playlist list combining user tracks & default tracks
  const allAvailableTracks = useMemo(() => {
    return [...customTracks, ...DEFAULT_TRACKS];
  }, [customTracks]);

  // Filtered tracks with Search input
  const filteredPlaylist = useMemo(() => {
    if (!searchTrackQuery.trim()) return allAvailableTracks;
    const q = searchTrackQuery.toLowerCase().trim();
    return allAvailableTracks.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.author && t.author.toLowerCase().includes(q)) ||
        (t.formatType && t.formatType.toLowerCase().includes(q))
    );
  }, [allAvailableTracks, searchTrackQuery]);

  // Autoplay next track in playlist (Phát tiếp tục bài hát)
  const playNextTrack = async () => {
    const list = allAvailableTracks;
    if (list.length === 0) return;
    const currentId = currentTrack ? currentTrack.id : null;
    const currentIndex = list.findIndex((t) => t.id === currentId);
    const nextIndex = (currentIndex + 1) % list.length;
    await playTrack(list[nextIndex]);
  };

  // Previous track in playlist
  const playPrevTrack = async () => {
    const list = allAvailableTracks;
    if (list.length === 0) return;
    const currentId = currentTrack ? currentTrack.id : null;
    const currentIndex = list.findIndex((t) => t.id === currentId);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    await playTrack(list[prevIndex]);
  };

  // Playback status listener with continuous autoplay support
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis || 0);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      // Khi kết thúc bài hát: tự động phát tiếp bài kế tiếp nếu chọn LOOP_ALL
      if (status.didJustFinish) {
        if (playMode === 'LOOP_ALL') {
          playNextTrack();
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  // Play a track (supports MP3, M4A, WAV, AAC, MP4 video, online stream URLs)
  const playTrack = async (track) => {
    try {
      if (soundInstance.current) {
        await soundInstance.current.unloadAsync().catch(() => {});
        soundInstance.current = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        {
          shouldPlay: true,
          isLooping: playMode === 'LOOP_ONE',
          volume: volume / 100,
        },
        onPlaybackStatusUpdate
      );

      soundInstance.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);

      // Save last played track info for quick resume
      await AsyncStorage.setItem('@last_played_track_info', JSON.stringify(track));

      // Trigger pop-up toast notification
      showToastNotification(`🎵 Đang phát [${track.formatType || 'AUDIO'}]: ${track.name}`);
    } catch (err) {
      const isYtOrTt = /(?:youtube\.com|youtu\.be|tiktok\.com)/i.test(track.uri || '');
      if (isYtOrTt) {
        Alert.alert(
          '⚠️ Link YouTube / TikTok Cần Chuyển Sang MP3',
          'YouTube & TikTok sử dụng mã hóa trang web nên không cho phép ứng dụng phát qua link URL thô.\n\n💡 CÁCH TẢI MP3 CỰC NHANH VỚI COBALT.TOOLS (SẠCH, KHÔNG QUẢNG CÁO):\n1. Bấm nút dưới để mở công cụ cobalt.tools (đã tự động điền sẵn link bài hát).\n2. Chọn định dạng Audio/MP3 và tải về máy trong vài giây.\n3. Trong app, bấm "📁 THÊM NHẠC TỪ MÁY" để phát vĩnh viễn, cực mượt khi leo rank!',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: '⚡ TẢI QUA COBALT.TOOLS',
              onPress: () => {
                const target = track.uri
                  ? `https://cobalt.tools/#${encodeURIComponent(track.uri)}`
                  : 'https://cobalt.tools/';
                Linking.openURL(target).catch(() => {
                  Linking.openURL('https://cobalt.tools/');
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Không Thể Phát Bản Nhạc Này',
          'Đường link này không phản hồi hoặc không phải định dạng âm thanh trực tiếp (.mp3, .m4a, stream).\n\n💡 Khuyên dùng: Tải file .mp3 về máy rồi chọn "📁 THÊM NHẠC TỪ MÁY" để nghe ổn định 100% trong mọi trận đấu!'
        );
      }
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = async () => {
    if (!soundInstance.current) {
      const trackToPlay = currentTrack || allAvailableTracks[0];
      if (trackToPlay) {
        await playTrack(trackToPlay);
      }
      return;
    }

    try {
      const status = await soundInstance.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundInstance.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundInstance.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {}
  };

  // Stop playback
  const stopPlayback = async () => {
    if (soundInstance.current) {
      try {
        await soundInstance.current.stopAsync();
        setIsPlaying(false);
        setPlaybackPosition(0);
      } catch (e) {}
    }
  };

  // Toggle Play Mode (Lặp 1 bài vs Phát tiếp tục cả danh sách)
  const togglePlayMode = async () => {
    const nextMode = playMode === 'LOOP_ALL' ? 'LOOP_ONE' : 'LOOP_ALL';
    setPlayMode(nextMode);
    if (soundInstance.current) {
      await soundInstance.current.setIsLoopingAsync(nextMode === 'LOOP_ONE').catch(() => {});
    }
    showToastNotification(
      nextMode === 'LOOP_ALL'
        ? '🔁 Chế độ: Phát tiếp tục liên tục toàn bộ danh sách'
        : '🔂 Chế độ: Lặp lại 1 bài hát hiện tại'
    );
  };

  // Change volume
  const changeVolume = async (val) => {
    setVolume(val);
    if (soundInstance.current) {
      await soundInstance.current.setVolumeAsync(val / 100).catch(() => {});
    }
  };

  // Pick Media File from device (supports MP3, M4A, WAV, AAC, MP4 video)
  const pickMediaFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',
          'video/*',
          'audio/mpeg',
          'audio/mp3',
          'audio/m4a',
          'audio/x-m4a',
          'audio/aac',
          'audio/wav',
          'audio/ogg',
          'audio/flac',
          'video/mp4',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const lowerName = (asset.name || '').toLowerCase();
        let formatType = 'AUDIO';
        if (lowerName.endsWith('.mp4') || (asset.mimeType && asset.mimeType.includes('video'))) {
          formatType = 'MP4';
        } else if (lowerName.endsWith('.m4a')) {
          formatType = 'M4A';
        } else if (lowerName.endsWith('.mp3')) {
          formatType = 'MP3';
        } else if (lowerName.endsWith('.wav')) {
          formatType = 'WAV';
        } else if (lowerName.endsWith('.aac')) {
          formatType = 'AAC';
        }

        const newTrack = {
          id: 'track_' + Date.now(),
          name: asset.name || `Nhạc ${formatType} của bạn`,
          uri: asset.uri,
          size: asset.size ? (asset.size / (1024 * 1024)).toFixed(1) + ' MB' : '',
          formatType: formatType,
          isCustom: true,
          dateAdded: new Date().toLocaleDateString('vi-VN'),
        };

        const updated = [newTrack, ...customTracks];
        setCustomTracks(updated);
        await AsyncStorage.setItem('@my_custom_music_playlist', JSON.stringify(updated));

        // Start playing the newly picked file immediately
        await playTrack(newTrack);

        Alert.alert(
          `🎉 Đã Thêm Nhạc ${formatType}!`,
          `Đang phát âm thanh từ: "${newTrack.name}"\n\nNhạc sẽ tiếp tục phát trong nền khi bạn thu nhỏ bong bóng để vào phòng tập hoặc leo rank!`
        );
      }
    } catch (err) {
      Alert.alert('⚠️ Lỗi chọn file', 'Không thể chọn file media lúc này. Vui lòng thử lại!');
    }
  };

  // Add Track from URL Link (Link video, direct mp3/m4a/mp4, stream)
  const handleAddLinkTrack = async (customUrl, customTitle) => {
    const url = (customUrl || inputLinkUrl).trim();
    if (!url) {
      Alert.alert('⚠️ Chưa Nhập Link', 'Vui lòng dán link video/nhạc hoặc chọn một link mẫu có sẵn.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('⚠️ Link không hợp lệ', 'Đường link phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    // Kiểm tra thông minh nếu là link YouTube hoặc TikTok
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);
    const isTikTok = /(?:tiktok\.com)/i.test(url);

    if (isYouTube) {
      Alert.alert(
        '🎬 Link YouTube Cần Tải MP3 Qua Cobalt.tools',
        'YouTube bảo vệ bản quyền và mã hóa luồng phát dạng trang web, các ứng dụng không thể phát qua link URL thô.\n\n💡 CÁCH TẢI MP3 CỰC NHANH VỚI COBALT.TOOLS:\n1. Bấm nút dưới để chuyển nhanh sang cobalt.tools (đã tự điền sẵn link YouTube, không quảng cáo rác).\n2. Chọn tải file âm thanh MP3 về máy trong 5 giây.\n3. Trong app, bấm nút "📁 THÊM NHẠC TỪ MÁY" để chọn bài hát.\n\n👉 Nhạc sẽ lưu vĩnh viễn, phát cực mượt, không tốn dung lượng 4G và không bị giật lag ping khi kéo tâm!',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: '⚡ TẢI MP3 QUA COBALT.TOOLS',
            onPress: () => {
              const target = `https://cobalt.tools/#${encodeURIComponent(url)}`;
              Linking.openURL(target).catch(() => {
                Linking.openURL('https://cobalt.tools/');
              });
            },
          },
        ]
      );
      return;
    }

    if (isTikTok) {
      Alert.alert(
        '🎵 Link TikTok Cần Tải MP3 Qua Cobalt.tools',
        'TikTok bảo vệ bản quyền video nên không cho phép phát qua link URL thô.\n\n💡 CÁCH TẢI MP3 CỰC NHANH VỚI COBALT.TOOLS:\n1. Bấm nút dưới để mở cobalt.tools (đã tự điền sẵn link TikTok, tải nhạc sạch & không quảng cáo).\n2. Tải file MP3 của video này về máy.\n3. Bấm nút "📁 THÊM NHẠC TỪ MÁY" trong app để thêm vào danh sách phát.\n\n👉 Nhạc phát trong nền mượt mà suốt mọi trận đấu!',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: '⚡ TẢI MP3 QUA COBALT.TOOLS',
            onPress: () => {
              const target = `https://cobalt.tools/#${encodeURIComponent(url)}`;
              Linking.openURL(target).catch(() => {
                Linking.openURL('https://cobalt.tools/');
              });
            },
          },
        ]
      );
      return;
    }

    const title = (customTitle || inputLinkTitle).trim() || `Nhạc Online #${Math.floor(Math.random() * 900 + 100)}`;
    const lower = url.toLowerCase();
    let format = 'LINK';
    if (lower.includes('.mp3')) format = 'MP3';
    else if (lower.includes('.m4a')) format = 'M4A';
    else if (lower.includes('.mp4')) format = 'MP4';

    const newTrack = {
      id: 'link_' + Date.now(),
      name: title,
      uri: url,
      size: 'Trực Tuyến (URL)',
      formatType: format,
      isCustom: true,
      isLink: true,
      dateAdded: new Date().toLocaleDateString('vi-VN'),
    };

    const updated = [newTrack, ...customTracks];
    setCustomTracks(updated);
    await AsyncStorage.setItem('@my_custom_music_playlist', JSON.stringify(updated));

    setInputLinkUrl('');
    setInputLinkTitle('');
    setIsLinkModalVisible(false);

    await playTrack(newTrack);
  };

  // Delete track from playlist
  const handleDeleteTrack = async (trackId) => {
    const updated = customTracks.filter((t) => t.id !== trackId);
    setCustomTracks(updated);
    await AsyncStorage.setItem('@my_custom_music_playlist', JSON.stringify(updated));

    if (currentTrack && currentTrack.id === trackId) {
      if (soundInstance.current) {
        await soundInstance.current.stopAsync().catch(() => {});
        await soundInstance.current.unloadAsync().catch(() => {});
        soundInstance.current = null;
      }
      setIsPlaying(false);
      setCurrentTrack(DEFAULT_TRACKS[0]);
    }
  };

  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return '00:00';
    const totalSec = Math.floor(millis / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // AI Chat message sender
  const handleSendMessage = (customText) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const aiReply = generateAiResponse(textToSend);
      setMessages((prev) => [...prev, aiReply]);
      try {
        SOUNDS.playHeadshotCrit();
      } catch (e) {}
      setTimeout(() => {
        if (scrollViewRef.current && scrollViewRef.current.scrollToEnd) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 150);
    }, 450);
  };

  const generateAiResponse = (query) => {
    const q = query.toLowerCase();
    let replyText = '';
    let configData = null;

    if (q.includes('ngực') || q.includes('ghim') || q.includes('dính')) {
      replyText =
        '🎯 [CHẨN ĐOÁN: TÂM GHIM NGỰC]\n' +
        '• Nguyên nhân: Gia tốc ngón tay chưa đủ thắng lực ma sát, hoặc Red Dot quá thấp khiến hồng tâm bị khóa cứng tại hitbox ngực.\n' +
        '• Khắc phục: AI tăng Red Dot lên 188, hạ nút bắn xuống 40% để tạo khoảng trống vuốt tay dài hơn. Khi bắn Shotgun hãy móc chữ J dứt khoát!';
      configData = {
        name: 'AI Fix: Chống Dính Ngực',
        general: 196,
        redDot: 188,
        scope2x: 182,
        scope4x: 174,
        awm: 74,
        freeLook: 140,
        buttonSize: 40,
        dpi: '480 (iOS: 120)',
        dragType: 'Vuốt Móc Chữ J Dứt Khoát',
      };
    } else if (q.includes('vọt') || q.includes('trời') || q.includes('trượt') || q.includes('quá đầu')) {
      replyText =
        '🚀 [CHẨN ĐOÁN: TÂM VỌT QUA ĐẦU]\n' +
        '• Nguyên nhân: Độ nhạy nhìn xung quanh quá cao so với tốc độ vuốt của ngón tay, ngón tay không có điểm hãm quán tính.\n' +
        '• Khắc phục: AI giảm nhìn xung quanh về 180, tăng cỡ nút bắn lên 48% đóng vai trò làm bàn đạp hãm phanh. Hãy dừng ngón tay đúng đỉnh đầu mục tiêu!';
      configData = {
        name: 'AI Fix: Chống Vọt Đầu',
        general: 180,
        redDot: 170,
        scope2x: 164,
        scope4x: 156,
        awm: 70,
        freeLook: 135,
        buttonSize: 48,
        dpi: '420 (iOS: 100)',
        dragType: 'Hất Dừng Ngang Tầm Mắt',
      };
    } else if (q.includes('shotgun') || q.includes('m1887') || q.includes('m1014') || q.includes('one-shot')) {
      replyText =
        '💥 [CHIẾN THUẬT: SHOTGUN M1887 1 VIÊN VÀO ĐẦU]\n' +
        '• Kỹ thuật: Đặt hồng tâm ngang thắt lưng địch, kéo ngón tay thành hình chữ J (vuốt nhẹ xuống dưới rồi móc gắt ngược lên đỉnh đầu).\n' +
        '• Nút bắn: 40% (nhỏ giúp góc móc rộng, tâm bám cực chặt).';
      configData = {
        name: 'Shotgun M1887 One-Shot Pro',
        general: 194,
        redDot: 192,
        scope2x: 180,
        scope4x: 170,
        awm: 72,
        freeLook: 140,
        buttonSize: 40,
        dpi: '510 (Siêu Nhạy)',
        dragType: 'Vuốt Móc Chữ J Đỉnh Đầu',
      };
    } else if (q.includes('mp40') || q.includes('smg') || q.includes('sấy') || q.includes('ump')) {
      replyText =
        '⚡ [CHIẾN THUẬT: MP40 & SMG CỤM ĐẠN ĐỎ]\n' +
        '• Kỹ thuật: Kéo thẳng đều tay từ ngực lên cằm trong 0.3s đầu tiên, sau đó giữ nguyên vị trí ngón tay để khóa tâm vào đầu, không kéo tiếp tránh xòe đạn.\n' +
        '• Nút bắn: 46% tạo độ đầm ngón tay.';
      configData = {
        name: 'MP40 Sấy Cụm Đỏ Esports',
        general: 188,
        redDot: 182,
        scope2x: 176,
        scope4x: 168,
        awm: 68,
        freeLook: 138,
        buttonSize: 46,
        dpi: '460 (An Toàn)',
        dragType: 'Kéo Thẳng Đều Tay Khóa Tâm',
      };
    } else if (q.includes('nhám') || q.includes('bao ngón tay') || q.includes('kính')) {
      replyText =
        '🧤 [PHỤ KIỆN: KÍNH NHÁM & BAO NGÓN TAY]\n' +
        '• Kính cường lực nhám làm tăng ma sát: Phải tăng nhìn xung quanh +4 đơn vị để bù trượt.\n' +
        '• Bao ngón tay làm giảm ma sát (quá trơn): Giảm nhìn xung quanh -4 đơn vị để tránh vọt đầu.';
      configData = {
        name: 'Cấu Hình Tối Ưu Kính Nhám & Găng',
        general: 186,
        redDot: 178,
        scope2x: 170,
        scope4x: 162,
        awm: 70,
        freeLook: 140,
        buttonSize: 43,
        dpi: '480 (iOS: 110)',
        dragType: 'Vuốt Dứt Khoát Hồi Tâm',
      };
    } else {
      replyText =
        `🤖 AI đã phân tích câu hỏi: "${query}".\n\n` +
        '⚡ Khuyên dùng: Để kéo tâm mượt nhất, bạn nên duy trì FPS ổn định ở mức Cao, lau sạch màn hình trước khi thi đấu, và luyện tập kỹ thuật vuốt dứt khoát 10 phút mỗi ngày.\n\n' +
        'Dưới đây là bộ thông số cân bằng toàn diện nhất cho mọi loại súng:';
      configData = {
        name: 'AI Cân Bằng Toàn Diện OB 2026',
        general: 188,
        redDot: 180,
        scope2x: 172,
        scope4x: 165,
        awm: 72,
        freeLook: 138,
        buttonSize: 44,
        dpi: '460 (iOS: 110)',
        dragType: 'Vuốt Thẳng Linh Hoạt',
      };
    }

    return {
      id: 'ai_' + Date.now(),
      sender: 'ai',
      text: replyText,
      config: configData,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <>
      {/* FLOATING ACTION CHAT & MUSIC BUBBLE (Tự căn chỉnh không bao giờ biến mất) */}
      {!hidden && !isOpen && (
        <Animated.View
          style={[
            styles.floatingBubbleContainer,
            {
              transform: [...pan.getTranslateTransform(), { scale: pulseAnim }],
            },
            isLandscapeMode && styles.floatingBubbleLandscape,
          ]}
          {...panResponder.panHandlers}>
          <View style={[styles.floatingBubble, isPlaying && styles.floatingBubblePlaying]}>
            <Text style={styles.bubbleIcon}>{isPlaying ? '🎵' : '🤖'}</Text>
            <View style={[styles.pulseBadge, isPlaying && styles.pulseBadgeMusic]}>
              <Text style={styles.pulseBadgeText}>{isPlaying ? 'LIVE' : 'AI'}</Text>
            </View>
          </View>

          {/* Mini Track Tag below bubble when playing */}
          {isPlaying && (
            <View style={styles.bubbleMiniTrackTag}>
              <Text style={styles.bubbleMiniTrackText} numberOfLines={1}>
                ▶ {currentTrack && currentTrack.name ? currentTrack.name.split('.')[0] : 'Đang phát'}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* FLOATING MINI PLAYER POP-UP WIDGET (Hiển thị nổi khi đang phát nhạc và đóng modal) */}
      {!hidden && !isOpen && isPlaying && showMiniPlayer && (
        <View
          style={[
            styles.floatingMiniPlayerBar,
            isLandscapeMode ? styles.miniPlayerLandscape : styles.miniPlayerPortrait,
          ]}>
          <TouchableOpacity
            style={styles.miniPlayerTrackInfo}
            activeOpacity={0.8}
            onPress={() => {
              setActiveModalTab('MUSIC');
              setIsOpen(true);
            }}>
            <Animated.View style={[styles.miniVinylDisc, { transform: [{ rotate: spin }] }]}>
              <Text style={{ fontSize: 13 }}>🎵</Text>
            </Animated.View>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.miniPlayerTrackName} numberOfLines={1}>
                {currentTrack && currentTrack.name ? currentTrack.name : 'Đang phát nhạc'}
              </Text>
              <Text style={styles.miniPlayerTimeText}>
                {formatTime(playbackPosition)} / {playbackDuration > 0 ? formatTime(playbackDuration) : (currentTrack && currentTrack.duration ? currentTrack.duration : '03:45')} • {playMode === 'LOOP_ALL' ? '🔁 Tiếp tục' : '🔂 Lặp 1'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Mini Controls */}
          <View style={styles.miniPlayerControls}>
            <TouchableOpacity style={styles.miniCtrlBtn} onPress={playPrevTrack}>
              <Text style={styles.miniCtrlBtnText}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.miniCtrlBtnPlay} onPress={togglePlayPause}>
              <Text style={styles.miniCtrlBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.miniCtrlBtn} onPress={playNextTrack}>
              <Text style={styles.miniCtrlBtnText}>⏭</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniCtrlBtnClose}
              onPress={() => setShowMiniPlayer(false)}>
              <Text style={styles.miniCtrlBtnCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TOAST POP-UP THÔNG BÁO KHI PHÁT NHẠC */}
      {!!toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastFadeAnim }]}>
          <View style={styles.toastBox}>
            <Text style={styles.toastText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* FLOATING MODAL SHEET (CHỨA AI CHAT & TRÌNH PHÁT NHẠC ĐẦY ĐỦ) */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View style={styles.chatSheet}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.aiAvatar, isPlaying && styles.aiAvatarPlaying]}>
                  <Text style={{ fontSize: 22 }}>{activeModalTab === 'MUSIC' ? '🎵' : '🤖'}</Text>
                  <View style={[styles.onlineDot, isPlaying && styles.onlineDotMusic]} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>
                    {activeModalTab === 'MUSIC' ? 'Trình Phát Nhạc Chiến Game' : 'AI Coach Kéo Tâm'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {isPlaying
                      ? `▶ Đang phát: ${currentTrack && currentTrack.name ? currentTrack.name.split('.')[0].substring(0, 20) : ''}...`
                      : 'Trực tuyến • Chuẩn OB 2026'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* TAB SWITCHER: [ 🤖 AI KÉO TÂM ] | [ 🎵 NHẠC CHIẾN ] | [ 🌐 WIKI FF ] */}
            <View style={styles.sheetTabRow}>
              <TouchableOpacity
                style={[styles.sheetTabBtn, activeModalTab === 'CHAT' && styles.sheetTabBtnActive]}
                onPress={() => setActiveModalTab('CHAT')}>
                <Text style={[styles.sheetTabBtnText, activeModalTab === 'CHAT' && styles.sheetTabBtnTextActive]}>
                  🤖 AI Coach
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetTabBtn, activeModalTab === 'MUSIC' && styles.sheetTabBtnActive]}
                onPress={() => setActiveModalTab('MUSIC')}>
                <Text style={[styles.sheetTabBtnText, activeModalTab === 'MUSIC' && styles.sheetTabBtnTextActive]}>
                  🎵 Nhạc Chiến {isPlaying ? '• ▶' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetTabBtn, activeModalTab === 'WIKI' && styles.sheetTabBtnActive]}
                onPress={() => setActiveModalTab('WIKI')}>
                <Text style={[styles.sheetTabBtnText, activeModalTab === 'WIKI' && styles.sheetTabBtnTextActive]}>
                  🌐 Wiki Free Fire
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= VIEW 1: TRÌNH PHÁT NHẠC (MP3, M4A, MP4, LINK) ================= */}
            {activeModalTab === 'MUSIC' ? (
              <ScrollView style={styles.musicTabScroll} showsVerticalScrollIndicator={false}>
                {/* NOW PLAYING CARD WITH SPINNING VINYL DISC */}
                <View style={styles.nowPlayingCard}>
                  <View style={styles.vinylContainer}>
                    <Animated.View style={[styles.vinylDisc, { transform: [{ rotate: spin }] }]}>
                      <View style={styles.vinylRing1} />
                      <View style={styles.vinylRing2} />
                      <View style={styles.vinylCenterLabel}>
                        <Text style={{ fontSize: 20 }}>🔥</Text>
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.nowPlayingInfo}>
                    <View style={styles.tagRow}>
                      <View style={styles.nowPlayingBadge}>
                        <Text style={styles.nowPlayingBadgeText}>
                          {currentTrack && currentTrack.formatType
                            ? `⚡ ĐỊNH DẠNG: ${currentTrack.formatType}`
                            : currentTrack && currentTrack.isCustom
                            ? '📂 BÀI CỦA BẠN'
                            : '⚡ BẢN NHẠC CHIẾN PRO'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.loopBadge} onPress={togglePlayMode}>
                        <Text style={styles.loopBadgeText}>
                          {playMode === 'LOOP_ALL' ? '🔁 Tự Động Tiếp Tục' : '🔂 Lặp 1 Bài'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.trackTitleText} numberOfLines={2}>
                      {currentTrack && currentTrack.name ? currentTrack.name : 'Chưa chọn bài hát'}
                    </Text>
                    <Text style={styles.trackSubText}>
                      {currentTrack && (currentTrack.author || currentTrack.size) ? (currentTrack.author || currentTrack.size) : 'Free Fire Audio Stream'}
                    </Text>

                    {/* Progress Track */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width:
                                playbackDuration > 0
                                  ? `${Math.min(100, (playbackPosition / playbackDuration) * 100)}%`
                                  : isPlaying
                                  ? '60%'
                                  : '0%',
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
                        <Text style={styles.timeText}>
                          {playbackDuration > 0 ? formatTime(playbackDuration) : (currentTrack && currentTrack.duration ? currentTrack.duration : '03:45')}
                        </Text>
                      </View>
                    </View>

                    {/* Controls Row (Hỗ trợ phát tiếp tục bài hát, next, prev, loop) */}
                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={[styles.ctrlSecondaryBtn, playMode === 'LOOP_ALL' && styles.ctrlSecondaryBtnActive]}
                        onPress={togglePlayMode}>
                        <Text style={styles.ctrlIcon}>{playMode === 'LOOP_ALL' ? '🔁' : '🔂'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlSecondaryBtn} onPress={playPrevTrack}>
                        <Text style={styles.ctrlIcon}>⏮</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlPlayBtn} onPress={togglePlayPause}>
                        <Text style={styles.ctrlPlayIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlSecondaryBtn} onPress={playNextTrack}>
                        <Text style={styles.ctrlIcon}>⏭</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlSecondaryBtn} onPress={stopPlayback}>
                        <Text style={styles.ctrlIcon}>⏹</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Volume Presets */}
                    <View style={styles.volumeRow}>
                      <Text style={styles.volumeLabel}>🔊 Âm lượng:</Text>
                      {[25, 50, 75, 100].map((v) => (
                        <TouchableOpacity
                          key={v}
                          style={[styles.volPill, volume === v && styles.volPillActive]}
                          onPress={() => changeVolume(v)}>
                          <Text style={[styles.volPillText, volume === v && styles.volPillTextActive]}>
                            {v}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* 2 NÚT THÊM NHẠC: TỪ MÁY (MP3/M4A/MP4) & DÁN LINK ONLINE */}
                <View style={styles.actionAddGrid}>
                  <TouchableOpacity
                    style={styles.addMediaActionBtn}
                    onPress={pickMediaFile}
                    activeOpacity={0.85}>
                    <View style={styles.addMediaIconBox}>
                      <Text style={{ fontSize: 20 }}>📁</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addMediaBtnTitle}>CHỌN FILE TỪ MÁY</Text>
                      <Text style={styles.addMediaBtnDesc}>Đuôi MP3, M4A, MP4 video, WAV, AAC</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addMediaActionBtn, styles.addLinkActionBtn]}
                    onPress={() => setIsLinkModalVisible(true)}
                    activeOpacity={0.85}>
                    <View style={[styles.addMediaIconBox, styles.addLinkIconBox]}>
                      <Text style={{ fontSize: 20 }}>🔗</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addMediaBtnTitle}>DÁN LINK VIDEO / NHẠC</Text>
                      <Text style={styles.addMediaBtnDesc}>Link URL stream trực tuyến hoặc beat mẫu</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* MODAL / POP-UP DÁN LINK VIDEO & NHẠC */}
                {isLinkModalVisible && (
                  <View style={styles.linkInputCard}>
                    <View style={styles.linkCardHeader}>
                      <Text style={styles.linkCardTitle}>🔗 THÊM TỪ LINK VIDEO / NHẠC</Text>
                      <TouchableOpacity onPress={() => setIsLinkModalVisible(false)}>
                        <Text style={styles.linkCardClose}>✕ Đóng</Text>
                      </TouchableOpacity>
                    </View>

                    {/* YouTube & TikTok Fast Converter Helper Box */}
                    <View style={styles.quickConvertBox}>
                      <Text style={styles.quickConvertTitle}>
                        ⚡ TẢI NHẠC YOUTUBE & TIKTOK QUA COBALT.TOOLS
                      </Text>
                      <Text style={styles.quickConvertDesc}>
                        Link chia sẻ YouTube/TikTok là link web mã hóa. Dùng cobalt.tools để tải MP3 siêu tốc, hoàn toàn không quảng cáo rác:
                      </Text>
                      <View style={styles.quickConvertBtnRow}>
                        <TouchableOpacity
                          style={[styles.quickConvertBtn, styles.quickConvertYt]}
                          onPress={() => {
                            const link = inputLinkUrl.trim();
                            const target = (link && (link.includes('youtube') || link.includes('youtu.be')))
                              ? `https://cobalt.tools/#${encodeURIComponent(link)}`
                              : 'https://cobalt.tools/';
                            Linking.openURL(target).catch(() => {});
                          }}>
                          <Text style={styles.quickConvertBtnText}>⚡ Cobalt (Tải YouTube)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickConvertBtn, styles.quickConvertTt]}
                          onPress={() => {
                            const link = inputLinkUrl.trim();
                            const target = (link && link.includes('tiktok'))
                              ? `https://cobalt.tools/#${encodeURIComponent(link)}`
                              : 'https://cobalt.tools/';
                            Linking.openURL(target).catch(() => {});
                          }}>
                          <Text style={styles.quickConvertBtnText}>🎵 Cobalt (Tải TikTok)</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.quickConvertHint}>
                        👉 Tải xong bấm nút <Text style={{ color: COLORS.primaryBright, fontWeight: 'bold' }}>"📁 CHỌN FILE TỪ MÁY"</Text> để nghe vĩnh viễn, mượt mà khi leo rank!
                      </Text>
                    </View>

                    <Text style={[styles.presetLinkHeader, { marginTop: 8 }]}>🌐 Hoặc dán link âm thanh trực tiếp (.mp3, .m4a, stream):</Text>
                    <TextInput
                      style={styles.linkTextInput}
                      placeholder="Dán đường link URL (https://...mp3, mp4, stream)"
                      placeholderTextColor={COLORS.textMuted}
                      value={inputLinkUrl}
                      onChangeText={setInputLinkUrl}
                      autoCapitalize="none"
                    />

                    <TextInput
                      style={styles.linkTextInput}
                      placeholder="Đặt tên bài hát (tùy chọn)..."
                      placeholderTextColor={COLORS.textMuted}
                      value={inputLinkTitle}
                      onChangeText={setInputLinkTitle}
                    />

                    <TouchableOpacity
                      style={styles.submitLinkBtn}
                      onPress={() => handleAddLinkTrack()}>
                      <Text style={styles.submitLinkBtnText}>⚡ THÊM VÀO PLAYLIST & PHÁT</Text>
                    </TouchableOpacity>

                    {/* Gợi ý link beat mẫu sẵn có */}
                    <Text style={styles.presetLinkHeader}>💡 Hoặc chọn nhanh beat Esport hot:</Text>
                    <View style={styles.presetLinkList}>
                      {PRESET_STREAM_LINKS.map((preset, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.presetLinkPill}
                          onPress={() => handleAddLinkTrack(preset.url, preset.name)}>
                          <Text style={styles.presetLinkTag}>[{preset.tag}]</Text>
                          <Text style={styles.presetLinkName} numberOfLines={1}>
                            {preset.name}
                          </Text>
                          <Text style={styles.presetLinkPlus}>+</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* THANH TÌM KIẾM BÀI HÁT (SEARCH TRACKS) */}
                <View style={styles.searchTrackContainer}>
                  <Text style={styles.searchTrackIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchTrackInput}
                    placeholder="Tìm kiếm bài hát, video, link trong playlist..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchTrackQuery}
                    onChangeText={setSearchTrackQuery}
                  />
                  {!!searchTrackQuery && (
                    <TouchableOpacity
                      style={styles.searchTrackClearBtn}
                      onPress={() => setSearchTrackQuery('')}>
                      <Text style={styles.searchTrackClearText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* PLAYLIST SECTION */}
                <View style={styles.playlistHeaderRow}>
                  <Text style={styles.playlistSectionTitle}>
                    ⭐ DANH SÁCH BÀI HÁT ({filteredPlaylist.length})
                  </Text>
                  {allAvailableTracks.length > 0 && (
                    <TouchableOpacity
                      style={styles.resumePlayBtn}
                      onPress={() => playTrack(currentTrack || allAvailableTracks[0])}>
                      <Text style={styles.resumePlayBtnText}>▶ TIẾP TỤC BÀI ĐANG CHỌN</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Danh sách các bài hát sau khi lọc tìm kiếm */}
                <View style={{ marginBottom: 16 }}>
                  {filteredPlaylist.length === 0 ? (
                    <View style={styles.emptySearchBox}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>🔍</Text>
                      <Text style={styles.emptySearchText}>
                        Không tìm thấy bài hát nào khớp với "{searchTrackQuery}"
                      </Text>
                    </View>
                  ) : (
                    filteredPlaylist.map((t) => {
                      const isCurrent = currentTrack && currentTrack.id === t.id;
                      const formatBadge = t.formatType || (t.isLink ? 'LINK' : 'MP3');
                      return (
                        <View
                          key={t.id}
                          style={[styles.trackItemCard, isCurrent && styles.trackItemCardActive]}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => playTrack(t)}>
                            <View style={styles.trackPlayIconBox}>
                              <Text style={{ fontSize: 16 }}>
                                {isCurrent && isPlaying ? '🔊' : t.isLink ? '🔗' : '🎵'}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={styles.formatBadgeBox}>
                                  <Text style={styles.formatBadgeText}>{formatBadge}</Text>
                                </View>
                                <Text
                                  style={[styles.trackItemName, isCurrent && styles.trackItemNameActive]}
                                  numberOfLines={1}>
                                  {t.name}
                                </Text>
                              </View>
                              <Text style={styles.trackItemMeta}>
                                {t.author ? `${t.author}  •  ` : ''}
                                {t.size ? `${t.size}  •  ` : ''}
                                {t.duration ? `Thời lượng: ${t.duration}` : t.dateAdded ? `Ngày thêm: ${t.dateAdded}` : ''}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              style={[
                                styles.trackActionBtn,
                                isCurrent && isPlaying && styles.trackActionBtnPlaying,
                              ]}
                              onPress={() => (isCurrent ? togglePlayPause() : playTrack(t))}>
                              <Text style={styles.trackActionBtnText}>
                                {isCurrent && isPlaying ? '⏸ TẠM DỪNG' : '▶ PHÁT'}
                              </Text>
                            </TouchableOpacity>

                            {t.isCustom && (
                              <TouchableOpacity
                                style={styles.trackDeleteBtn}
                                onPress={() => handleDeleteTrack(t.id)}>
                                <Text style={{ fontSize: 13, color: COLORS.accentRed }}>🗑️</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Background Playing Note */}
                <View style={styles.backgroundNoteBox}>
                  <Text style={styles.backgroundNoteText}>
                    💡 <Text style={{ fontWeight: 'bold', color: COLORS.secondary }}>Tính năng phát nền & Pop-up:</Text> Bạn có thể bấm [✕] để thu nhỏ bong bóng. Nhạc vẫn phát mượt mà trong nền kèm <Text style={{ color: '#00F0FF', fontWeight: 'bold' }}>thanh Mini Pop-up nổi</Text> để bạn vừa nghe vừa vào phòng tập ngắm bắn hoặc leo rank!
                  </Text>
                </View>
                <View style={{ height: 35 }} />
              </ScrollView>
            ) : activeModalTab === 'WIKI' ? (
              /* ================= VIEW 3: GARENA FREE FIRE WIKI ================= */
              <ScrollView style={styles.musicTabScroll} showsVerticalScrollIndicator={false}>
                {/* Official Link Banner */}
                <View style={{ backgroundColor: 'rgba(255, 106, 0, 0.15)', borderColor: COLORS.primaryBright, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF' }}>🌟 GARENA FREE FIRE WIKI</Text>
                    <View style={{ backgroundColor: COLORS.accentGreen, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>CHÍNH THỨC</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginBottom: 10 }}>
                    Cổng tra cứu dữ liệu gốc chính thức của Garena: Thông số vũ khí, độ giật, sát thương, nhân vật và bản đồ OB47.
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    onPress={() => Linking.openURL('https://wiki.ff.garena.vn/').catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết.'))}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#000' }}>🌐 MỞ WIKI: wiki.ff.garena.vn ↗</Text>
                  </TouchableOpacity>
                </View>

                {/* Wiki Weapon Category Showcase */}
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFF', marginBottom: 8 }}>🔫 KHO VŨ KHÍ & SÁT THƯƠNG OB47</Text>
                
                {/* Shotgun */}
                <View style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.secondary }}>💥 DÒNG SHOTGUN (CẬN CHIẾN DÍNH ĐẦU)</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, lineHeight: 17 }}>
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>M1887</Text>: Sát thương 100 • Tầm xa 15 • Tốc bắn 40 • Băng 2 viên (Sát thương sốc cao nhất){'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>M1014</Text>: Sát thương 94 • Băng đạn 6 viên • Tốc độ xả đạn cực nhanh{'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Charge Buster</Text>: Tích tụ năng lượng • Xuyên giáp cấp 3
                  </Text>
                </View>

                {/* SMG */}
                <View style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#00F0FF' }}>⚡ DÒNG SMG (SẤY TẦM TRUNG - ĐẦU ĐỎ)</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, lineHeight: 17 }}>
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>MP40</Text>: Sát thương 48 • Tốc bắn 83 • Độ giật thấp, dễ kéo tâm chữ J{'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>UMP</Text>: Sát thương 50 • Xuyên giáp 67% • Đạn đầm, ổn định nhất meta{'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Thompson</Text>: Băng đạn 42 viên • Bền bỉ khi sấy nhiều mục tiêu
                  </Text>
                </View>

                {/* Súng trường */}
                <View style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.accentGreen }}>🎯 DÒNG SÚNG TRƯỜNG & SNIPER</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, lineHeight: 17 }}>
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>AK47 / Woodpecker</Text>: Sát thương 61-71 • Gõ đầu 1 viên cực thốn{'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>SCAR / M4A1</Text>: Độ ổn định cao, tâm ngắm không bị bè{'\n'}
                    • <Text style={{ color: '#FFF', fontWeight: 'bold' }}>AWM / M82B</Text>: Sát thương 90-100 • Bắn xuyên keo (M82B)
                  </Text>
                </View>

                {/* Nhân vật & Kỹ năng */}
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFF', marginBottom: 8, marginTop: 4 }}>👤 NHÂN VẬT & COMBO KỸ NĂNG LEO RANK</Text>
                <View style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 18 }}>
                    • <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>Tatsuya</Text>: Lướt thần tốc 3 lần liên tiếp, né đạn và áp sát shotgun cực mạnh.{'\n'}
                    • <Text style={{ color: '#00F0FF', fontWeight: 'bold' }}>Alok</Text>: Tạo vòng hào quang hồi 30 HP và tăng 15% tốc chạy.{'\n'}
                    • <Text style={{ color: COLORS.accentGreen, fontWeight: 'bold' }}>Chrono</Text>: Tạo lá chắn chặn 800 sát thương, bảo vệ khi hồi sinh.{'\n'}
                    • <Text style={{ color: '#FF3355', fontWeight: 'bold' }}>Dimitri + Kelly</Text>: Tự hồi sinh đồng đội trong vòng nhịp điệu + Chạy nhanh 6%.
                  </Text>
                </View>

                {/* Bottom Direct Link */}
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(0, 240, 255, 0.12)', borderColor: '#00F0FF', borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 25 }}
                  onPress={() => Linking.openURL('https://wiki.ff.garena.vn/').catch(() => {})}>
                  <Text style={{ color: '#00F0FF', fontWeight: '900', fontSize: 12 }}>🚀 MỞ TOÀN BỘ WIKI TRÊN TRÌNH DUYỆT ↗</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* ================= VIEW 2: AI COACH CHAT ================= */
              <>
                {/* Mini music pill when music is playing inside chat tab */}
                {isPlaying && (
                  <View style={styles.chatMiniMusicBanner}>
                    <Text style={{ fontSize: 13, marginRight: 6 }}>🎵</Text>
                    <Text style={styles.chatMiniMusicTitle} numberOfLines={1}>
                      {currentTrack && currentTrack.name ? currentTrack.name : ''}
                    </Text>
                    <TouchableOpacity style={styles.chatMiniMusicToggle} onPress={togglePlayPause}>
                      <Text style={styles.chatMiniMusicToggleText}>{isPlaying ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chatMiniMusicTabBtn}
                      onPress={() => setActiveModalTab('MUSIC')}>
                      <Text style={styles.chatMiniMusicTabBtnText}>MỞ PHÁT NHẠC →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Quick Prompts Bar */}
                <View style={styles.quickPromptsWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickPromptsScroll}>
                    {QUICK_PROMPTS.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.promptPill}
                        onPress={() => handleSendMessage(item.text)}>
                        <Text style={styles.promptPillText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Chat Messages List */}
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}>
                  {messages.map((m) => {
                    const isAi = m.sender === 'ai';
                    return (
                      <View
                        key={m.id}
                        style={[styles.messageBubbleRow, isAi ? styles.rowAi : styles.rowUser]}>
                        <View style={[styles.bubbleCard, isAi ? styles.bubbleCardAi : styles.bubbleCardUser]}>
                          <Text style={[styles.messageText, isAi ? styles.textAi : styles.textUser]}>
                            {m.text}
                          </Text>

                          {m.config && (
                            <View style={styles.configPreviewBox}>
                              <View style={styles.configHeader}>
                                <Text style={styles.configBadge}>⚡ CẤU HÌNH ĐỀ XUẤT</Text>
                                <Text style={styles.configName}>{m.config.name}</Text>
                              </View>

                              <View style={styles.configStatsGrid}>
                                <View style={styles.statCell}>
                                  <Text style={styles.statLbl}>Nhìn chung</Text>
                                  <Text style={styles.statVal}>{m.config.general}</Text>
                                </View>
                                <View style={styles.statCell}>
                                  <Text style={styles.statLbl}>Red Dot</Text>
                                  <Text style={styles.statVal}>{m.config.redDot}</Text>
                                </View>
                                <View style={styles.statCell}>
                                  <Text style={styles.statLbl}>Cỡ Nút</Text>
                                  <Text style={[styles.statVal, { color: COLORS.primaryBright }]}>
                                    {m.config.buttonSize}%
                                  </Text>
                                </View>
                                <View style={styles.statCell}>
                                  <Text style={styles.statLbl}>DPI Đề Xuất</Text>
                                  <Text style={[styles.statVal, { color: COLORS.secondary, fontSize: 11 }]}>
                                    {m.config.dpi}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.dragHintText}>🎯 Cách kéo: {m.config.dragType}</Text>

                              <View style={styles.configActionRow}>
                                {onApplyToTrainer && (
                                  <TouchableOpacity
                                    style={styles.applyBtn}
                                    onPress={() => {
                                      onApplyToTrainer(m.config);
                                      setIsOpen(false);
                                    }}>
                                    <Text style={styles.applyBtnText}>🎮 ÁP DỤNG LUYỆN TÂM</Text>
                                  </TouchableOpacity>
                                )}
                                {onSaveConfig && (
                                  <TouchableOpacity
                                    style={styles.saveQuickBtn}
                                    onPress={() => {
                                      onSaveConfig(m.config);
                                    }}>
                                    <Text style={styles.saveQuickBtnText}>💾 LƯU</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          )}

                          <Text style={styles.timestampText}>{m.timestamp}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Input Bar */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Hỏi AI về độ nhạy, lỗi kéo tâm..."
                    placeholderTextColor={COLORS.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleSendMessage()}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={() => handleSendMessage()}
                    disabled={!inputText.trim()}>
                    <Text style={styles.sendIcon}>➔</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Floating Bubble (Anti-Disappearance)
  floatingBubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  floatingBubbleLandscape: {
    opacity: 0.9,
  },
  floatingBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 106, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingBubblePlaying: {
    backgroundColor: 'rgba(0, 240, 255, 0.95)',
    borderColor: '#FFFFFF',
    shadowColor: '#00F0FF',
  },
  bubbleIcon: {
    fontSize: 26,
  },
  pulseBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#00F0FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  pulseBadgeMusic: {
    backgroundColor: '#00FF66',
  },
  pulseBadgeText: {
    color: '#07050E',
    fontSize: 8,
    fontWeight: '900',
  },
  bubbleMiniTrackTag: {
    position: 'absolute',
    bottom: -18,
    left: -15,
    right: -15,
    backgroundColor: 'rgba(12, 14, 20, 0.92)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    alignItems: 'center',
  },
  bubbleMiniTrackText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '800',
  },

  // Floating Mini Player Pop-up Widget
  floatingMiniPlayerBar: {
    position: 'absolute',
    zIndex: 9998,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  miniPlayerPortrait: {
    bottom: 84,
    left: 14,
    right: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  miniPlayerLandscape: {
    top: 14,
    left: 16,
    right: 86,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  miniPlayerTrackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniVinylDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B0D14',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  miniPlayerTrackName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  miniPlayerTimeText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniCtrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCtrlBtnText: {
    fontSize: 12,
    color: '#FFF',
  },
  miniCtrlBtnPlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCtrlBtnPlayText: {
    fontSize: 14,
    color: '#07050E',
    fontWeight: '900',
  },
  miniCtrlBtnClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  miniCtrlBtnCloseText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },

  // Toast Pop-up Notification
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10000,
    alignItems: 'center',
  },
  toastBox: {
    backgroundColor: 'rgba(10, 14, 22, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  toastText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Modal Backdrop & Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  chatSheet: {
    height: '84%',
    backgroundColor: 'rgba(18, 20, 28, 0.98)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.glassBorderHighlight,
    overflow: 'hidden',
  },

  // Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiAvatarPlaying: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderColor: '#00F0FF',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentGreen,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  onlineDotMusic: {
    backgroundColor: '#00F0FF',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: COLORS.primaryBright,
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Sheet Tab Switcher
  sheetTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(12, 14, 20, 0.95)',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sheetTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sheetTabBtnActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderColor: COLORS.primaryBright,
  },
  sheetTabBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  sheetTabBtnTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },

  // ================= MUSIC TAB STYLES =================
  musicTabScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(24, 28, 38, 0.95)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    marginBottom: 14,
    alignItems: 'center',
  },
  vinylContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  vinylDisc: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0B0D14',
    borderWidth: 3,
    borderColor: COLORS.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  vinylRing1: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  vinylRing2: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  vinylCenterLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  nowPlayingBadge: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBright,
  },
  nowPlayingBadgeText: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: '900',
  },
  loopBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  loopBadgeText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
  },
  trackTitleText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  trackSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryBright,
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  ctrlSecondaryBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlSecondaryBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  ctrlIcon: {
    fontSize: 16,
  },
  ctrlPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  ctrlPlayIcon: {
    fontSize: 22,
    color: '#FFF',
    marginLeft: 2,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  volumeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  volPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  volPillActive: {
    backgroundColor: COLORS.primary,
  },
  volPillText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  volPillTextActive: {
    color: '#FFF',
    fontWeight: '900',
  },

  // 2 Action Buttons: Pick Local Media & Add Link
  actionAddGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  addMediaActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBright,
    gap: 8,
  },
  addLinkActionBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: '#00F0FF',
  },
  addMediaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLinkIconBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  addMediaBtnTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  addMediaBtnDesc: {
    color: COLORS.textMuted,
    fontSize: 8.5,
    marginTop: 2,
    lineHeight: 12,
  },

  // Link Modal / Input Card
  linkInputCard: {
    backgroundColor: 'rgba(16, 20, 30, 0.98)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    marginBottom: 14,
  },
  linkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkCardTitle: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '900',
  },
  linkCardClose: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  quickConvertBox: {
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    marginBottom: 10,
  },
  quickConvertTitle: {
    color: COLORS.primaryBright,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  quickConvertDesc: {
    color: '#D0D4E4',
    fontSize: 9.5,
    lineHeight: 14,
    marginBottom: 8,
  },
  quickConvertBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  quickConvertBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickConvertYt: {
    backgroundColor: 'rgba(255, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: '#FF3333',
  },
  quickConvertTt: {
    backgroundColor: 'rgba(0, 240, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  quickConvertBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  quickConvertHint: {
    color: COLORS.secondary,
    fontSize: 9,
    fontStyle: 'italic',
  },
  linkTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  submitLinkBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitLinkBtnText: {
    color: '#07050E',
    fontSize: 11,
    fontWeight: '900',
  },
  presetLinkHeader: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  presetLinkList: {
    gap: 5,
  },
  presetLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetLinkTag: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '900',
    marginRight: 6,
  },
  presetLinkName: {
    flex: 1,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  presetLinkPlus: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '900',
  },

  // Search Track Container
  searchTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  searchTrackIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchTrackInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    padding: 0,
  },
  searchTrackClearBtn: {
    padding: 4,
  },
  searchTrackClearText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  emptySearchBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
  },
  emptySearchText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },

  // Playlist Section Header
  playlistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistSectionTitle: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resumePlayBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  resumePlayBtnText: {
    color: '#00F0FF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  trackItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  trackItemCardActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    borderColor: COLORS.primaryBright,
  },
  trackPlayIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  formatBadgeBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#00F0FF',
  },
  formatBadgeText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '900',
  },
  trackItemName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  trackItemNameActive: {
    color: COLORS.primaryBright,
    fontWeight: '900',
  },
  trackItemMeta: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  trackActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trackActionBtnPlaying: {
    backgroundColor: 'rgba(0, 240, 255, 0.85)',
  },
  trackActionBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  trackDeleteBtn: {
    padding: 6,
  },
  backgroundNoteBox: {
    backgroundColor: 'rgba(12, 14, 20, 0.85)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundNoteText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  // Chat Mini Music Banner (inside chat tab when playing)
  chatMiniMusicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chatMiniMusicTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatMiniMusicToggle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: 6,
    marginRight: 6,
  },
  chatMiniMusicToggleText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
  },
  chatMiniMusicTabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  chatMiniMusicTabBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // Quick Prompts
  quickPromptsWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickPromptsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Messages
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowAi: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubbleCard: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
  },
  bubbleCardAi: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bubbleCardUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textAi: {
    color: '#FFF',
  },
  textUser: {
    color: '#FFF',
    fontWeight: '600',
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // Config Preview Card inside AI message
  configPreviewBox: {
    backgroundColor: 'rgba(10, 12, 18, 0.95)',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  configHeader: {
    marginBottom: 8,
  },
  configBadge: {
    color: COLORS.primaryBright,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  configName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  configStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statLbl: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  statVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  dragHintText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  configActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  saveQuickBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  saveQuickBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(12, 14, 20, 0.98)',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
