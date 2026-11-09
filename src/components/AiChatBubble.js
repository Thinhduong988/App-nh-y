import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
  PanResponder,
  Easing,
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
    isCustom: false,
  },
  {
    id: 'def-2',
    name: '🔥 EDM Headshot Trap Beat (Esports Mix)',
    author: 'Cyber Montage Beat',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
    isCustom: false,
  },
  {
    id: 'def-3',
    name: '🎧 Lo-Fi Chill Leo Rank Đêm (Ghìm Tâm)',
    author: 'Night Chill Free Fire',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '7:05',
    isCustom: false,
  },
];

export default function AiChatBubble({ onApplyToTrainer, onSaveConfig, hidden = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('CHAT'); // 'CHAT' | 'MUSIC'
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Xin chào Xạ Thủ! 👋 Tôi là Trợ Lý AI Kéo Tâm Free Fire (OB 2026).\n\nBạn đang gặp vấn đề gì khi kéo tâm (dính ngực, vọt đầu) hay cần độ nhạy cho dòng máy nào? Bạn cũng có thể mở tab "Nhạc Chiến MP4" để nghe nhạc từ video trong máy nhé!',
      timestamp: 'Vừa xong',
    },
  ]);

  // Bubble Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  // Music Player States
  const soundInstance = useRef(null);
  const [customTracks, setCustomTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState(80);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Spinning Vinyl Animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef(null);

  // Floating Position & Dragging with PanResponder
  const windowDims = Dimensions.get('window');
  const pan = useRef(
    new Animated.ValueXY({
      x: windowDims.width - 74,
      y: windowDims.height - 165,
    })
  ).current;
  const currentPos = useRef({
    x: windowDims.width - 74,
    y: windowDims.height - 165,
  });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        pan.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDraggingRef.current = true;
        }
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!isDraggingRef.current) {
          setIsOpen(true);
          try {
            SOUNDS.playWeaponShot('smg');
          } catch (e) {}
        } else {
          const currentX = currentPos.current.x;
          const currentY = currentPos.current.y;
          const curDims = Dimensions.get('window');
          const targetX = currentX < curDims.width / 2 ? 14 : curDims.width - 74;
          const clampedY = Math.max(70, Math.min(curDims.height - 150, currentY));
          Animated.spring(pan, {
            toValue: { x: targetX, y: clampedY },
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
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
      spinLoop.current?.stop();
      spinAnim.setValue(0);
    }
  }, [isPlaying]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Load saved custom MP4 tracks on mount
  useEffect(() => {
    const loadSavedPlaylist = async () => {
      try {
        const saved = await AsyncStorage.getItem('@my_custom_music_playlist');
        if (saved) {
          const list = JSON.parse(saved);
          setCustomTracks(list);
          if (list.length > 0) {
            setCurrentTrack(list[0]);
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

  // Playback status listener
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis || 0);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish && !status.isLooping) {
        setIsPlaying(false);
      }
    }
  };

  // Play a track (handles both MP4 videos and MP3/Audio files)
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
          isLooping: isLooping,
          volume: volume / 100,
        },
        onPlaybackStatusUpdate
      );

      soundInstance.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (err) {
      Alert.alert(
        '⚠️ Không Thể Phát File Này',
        'File video MP4 hoặc audio có thể đã bị di chuyển hoặc không hỗ trợ trích xuất âm thanh.'
      );
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = async () => {
    if (!soundInstance.current) {
      const trackToPlay = currentTrack || customTracks[0] || DEFAULT_TRACKS[0];
      await playTrack(trackToPlay);
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

  // Toggle loop mode
  const toggleLoop = async () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (soundInstance.current) {
      await soundInstance.current.setIsLoopingAsync(nextLoop).catch(() => {});
    }
  };

  // Change volume
  const changeVolume = async (val) => {
    setVolume(val);
    if (soundInstance.current) {
      await soundInstance.current.setVolumeAsync(val / 100).catch(() => {});
    }
  };

  // Pick MP4 video from device
  const pickMediaFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/*', 'audio/*', 'audio/mpeg', 'audio/mp4'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newTrack = {
          id: 'track_' + Date.now(),
          name: asset.name || 'Video MP4 của bạn',
          uri: asset.uri,
          size: asset.size ? (asset.size / (1024 * 1024)).toFixed(1) + ' MB' : '',
          isCustom: true,
          dateAdded: new Date().toLocaleDateString('vi-VN'),
        };

        const updated = [newTrack, ...customTracks];
        setCustomTracks(updated);
        await AsyncStorage.setItem('@my_custom_music_playlist', JSON.stringify(updated));

        // Start playing the newly picked video immediately
        await playTrack(newTrack);

        Alert.alert(
          '🎉 Đã Nạp Video MP4!',
          `Đang phát âm thanh từ: "${newTrack.name}"\n\nNhạc sẽ tiếp tục phát trong nền khi bạn thu nhỏ bong bóng để vào phòng tập hoặc leo rank!`
        );
      }
    } catch (err) {
      Alert.alert('⚠️ Lỗi chọn file', 'Không thể chọn video MP4 lúc này. Vui lòng thử lại!');
    }
  };

  // Delete track from playlist
  const handleDeleteTrack = async (trackId) => {
    const updated = customTracks.filter((t) => t.id !== trackId);
    setCustomTracks(updated);
    await AsyncStorage.setItem('@my_custom_music_playlist', JSON.stringify(updated));

    if (currentTrack?.id === trackId) {
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
        scrollViewRef.current?.scrollToEnd({ animated: true });
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
      {/* FLOATING ACTION CHAT BUBBLE (Có thể kéo thả vị trí, hiển thị trạng thái nhạc) */}
      {!hidden && !isOpen && (
        <Animated.View
          style={[
            styles.floatingBubbleContainer,
            {
              transform: [
                ...pan.getTranslateTransform(),
                { scale: pulseAnim },
              ],
            },
          ]}
          {...panResponder.panHandlers}>
          <View style={[styles.floatingBubble, isPlaying && styles.floatingBubblePlaying]}>
            <Text style={styles.bubbleIcon}>{isPlaying ? '🎵' : '🤖'}</Text>
            <View style={[styles.pulseBadge, isPlaying && styles.pulseBadgeMusic]}>
              <Text style={styles.pulseBadgeText}>{isPlaying ? 'LIVE' : 'AI'}</Text>
            </View>
          </View>
          {/* Mini Music Tag when playing */}
          {isPlaying && (
            <View style={styles.bubbleMiniTrackTag}>
              <Text style={styles.bubbleMiniTrackText} numberOfLines={1}>
                ▶ {currentTrack?.name?.split('.')[0] || 'Đang phát'}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* FLOATING MODAL SHEET (CHỨA CẢ AI CHAT & TRÌNH PHÁT NHẠC MP4) */}
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
                    {activeModalTab === 'MUSIC' ? 'Nhạc Chiến Game (MP4)' : 'AI Coach Kéo Tâm'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {isPlaying ? `▶ Đang phát: ${currentTrack?.name?.split('.')[0]?.substring(0, 18)}...` : 'Trực tuyến • Chuẩn OB 2026'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* TAB SWITCHER: [ 🤖 AI KÉO TÂM ] | [ 🎵 NHẠC CHIẾN MP4 ] */}
            <View style={styles.sheetTabRow}>
              <TouchableOpacity
                style={[styles.sheetTabBtn, activeModalTab === 'CHAT' && styles.sheetTabBtnActive]}
                onPress={() => setActiveModalTab('CHAT')}>
                <Text style={[styles.sheetTabBtnText, activeModalTab === 'CHAT' && styles.sheetTabBtnTextActive]}>
                  🤖 AI Coach Kéo Tâm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetTabBtn, activeModalTab === 'MUSIC' && styles.sheetTabBtnActive]}
                onPress={() => setActiveModalTab('MUSIC')}>
                <Text style={[styles.sheetTabBtnText, activeModalTab === 'MUSIC' && styles.sheetTabBtnTextActive]}>
                  🎵 Nhạc Chiến MP4 {isPlaying ? '• ▶' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= VIEW 1: TRÌNH PHÁT NHẠC CHIẾN GAME MP4 ================= */}
            {activeModalTab === 'MUSIC' ? (
              <ScrollView style={styles.musicTabScroll} showsVerticalScrollIndicator={false}>
                {/* NOW PLAYING CARD WITH SPINNING VINYL DISC */}
                <View style={styles.nowPlayingCard}>
                  <View style={styles.vinylContainer}>
                    <Animated.View
                      style={[
                        styles.vinylDisc,
                        { transform: [{ rotate: spin }] },
                      ]}>
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
                          {currentTrack?.isCustom ? '🎬 VIDEO MP4 CỦA BẠN' : '⚡ BẢN NHẠC CHIẾN PRO'}
                        </Text>
                      </View>
                      {isLooping && (
                        <View style={styles.loopBadge}>
                          <Text style={styles.loopBadgeText}>🔁 Lặp Lại</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.trackTitleText} numberOfLines={2}>
                      {currentTrack?.name || 'Chưa chọn bài hát'}
                    </Text>
                    <Text style={styles.trackSubText}>
                      {currentTrack?.author || currentTrack?.size || 'Free Fire Audio Stream'}
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
                          {playbackDuration > 0 ? formatTime(playbackDuration) : currentTrack?.duration || '03:45'}
                        </Text>
                      </View>
                    </View>

                    {/* Controls Row */}
                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={[styles.ctrlSecondaryBtn, isLooping && styles.ctrlSecondaryBtnActive]}
                        onPress={toggleLoop}>
                        <Text style={styles.ctrlIcon}>🔁</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlSecondaryBtn} onPress={stopPlayback}>
                        <Text style={styles.ctrlIcon}>⏹</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ctrlPlayBtn} onPress={togglePlayPause}>
                        <Text style={styles.ctrlPlayIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ctrlSecondaryBtn}
                        onPress={async () => {
                          if (soundInstance.current) {
                            await soundInstance.current.setPositionAsync(0).catch(() => {});
                          }
                        }}>
                        <Text style={styles.ctrlIcon}>⏮</Text>
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

                {/* BIG BUTTON: ADD MUSIC FROM OWN MP4 VIDEO FILE */}
                <TouchableOpacity style={styles.addMp4Btn} onPress={pickMediaFile} activeOpacity={0.85}>
                  <View style={styles.addMp4IconBox}>
                    <Text style={{ fontSize: 24 }}>📁</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addMp4BtnTitle}>+ CHỌN VIDEO MP4 TỪ MÁY CỦA BẠN</Text>
                    <Text style={styles.addMp4BtnDesc}>
                      Trích xuất phát nhạc từ video TikTok, Highlight FF, MP4 hoặc Audio trên máy
                    </Text>
                  </View>
                  <Text style={styles.addMp4Arrow}>➔</Text>
                </TouchableOpacity>

                {/* PLAYLIST SECTION */}
                <Text style={styles.playlistSectionTitle}>
                  ⭐ DANH SÁCH BÀI HÁT ({customTracks.length + DEFAULT_TRACKS.length})
                </Text>

                {/* Custom User Tracks */}
                {customTracks.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.playlistGroupLabel}>📂 Video MP4 Của Bạn ({customTracks.length})</Text>
                    {customTracks.map((t) => {
                      const isCurrent = currentTrack?.id === t.id;
                      return (
                        <View key={t.id} style={[styles.trackItemCard, isCurrent && styles.trackItemCardActive]}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => playTrack(t)}>
                            <View style={styles.trackPlayIconBox}>
                              <Text style={{ fontSize: 16 }}>{isCurrent && isPlaying ? '🔊' : '🎬'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.trackItemName, isCurrent && styles.trackItemNameActive]} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Text style={styles.trackItemMeta}>
                                {t.size ? `Kích thước: ${t.size}  •  ` : ''}Ngày thêm: {t.dateAdded}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              style={[styles.trackActionBtn, isCurrent && isPlaying && styles.trackActionBtnPlaying]}
                              onPress={() => (isCurrent ? togglePlayPause() : playTrack(t))}>
                              <Text style={styles.trackActionBtnText}>
                                {isCurrent && isPlaying ? '⏸ TẠM DỪNG' : '▶ PHÁT'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.trackDeleteBtn}
                              onPress={() => handleDeleteTrack(t.id)}>
                              <Text style={{ fontSize: 13, color: COLORS.accentRed }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Pre-loaded Free Fire Beats */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.playlistGroupLabel}>⚡ Nhạc Chiến Free Fire Sẵn Có</Text>
                  {DEFAULT_TRACKS.map((t) => {
                    const isCurrent = currentTrack?.id === t.id;
                    return (
                      <View key={t.id} style={[styles.trackItemCard, isCurrent && styles.trackItemCardActive]}>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => playTrack(t)}>
                          <View style={styles.trackPlayIconBox}>
                            <Text style={{ fontSize: 16 }}>{isCurrent && isPlaying ? '🔊' : '🎵'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.trackItemName, isCurrent && styles.trackItemNameActive]} numberOfLines={1}>
                              {t.name}
                            </Text>
                            <Text style={styles.trackItemMeta}>{t.author}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.trackActionBtn, isCurrent && isPlaying && styles.trackActionBtnPlaying]}
                          onPress={() => (isCurrent ? togglePlayPause() : playTrack(t))}>
                          <Text style={styles.trackActionBtnText}>
                            {isCurrent && isPlaying ? '⏸ TẠM DỪNG' : '▶ PHÁT'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Background Playing Note */}
                <View style={styles.backgroundNoteBox}>
                  <Text style={styles.backgroundNoteText}>
                    💡 <Text style={{ fontWeight: 'bold', color: COLORS.secondary }}>Chế độ phát nền:</Text> Bạn có thể bấm nút [✕] để thu nhỏ bong bóng chat. Nhạc sẽ vẫn phát liên tục trong nền để bạn vừa nghe vừa vào phòng tập bắn hoặc leo rank!
                  </Text>
                </View>
                <View style={{ height: 30 }} />
              </ScrollView>
            ) : (
              /* ================= VIEW 2: AI COACH CHAT ================= */
              <>
                {/* Mini music pill when music is playing inside chat tab */}
                {isPlaying && (
                  <View style={styles.chatMiniMusicBanner}>
                    <Text style={{ fontSize: 13, marginRight: 6 }}>🎵</Text>
                    <Text style={styles.chatMiniMusicTitle} numberOfLines={1}>
                      {currentTrack?.name}
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
  // Floating Bubble
  floatingBubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
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
    gap: 16,
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

  // Add MP4 Button
  addMp4Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, rgba(255, 106, 0, 0.2), rgba(0, 240, 255, 0.1))',
    backgroundColor: 'rgba(30, 20, 50, 0.95)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBright,
    marginBottom: 16,
    gap: 12,
  },
  addMp4IconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 106, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMp4BtnTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addMp4BtnDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  addMp4Arrow: {
    color: COLORS.primaryBright,
    fontSize: 18,
    fontWeight: '900',
  },

  // Playlist Section
  playlistSectionTitle: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  playlistGroupLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
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
