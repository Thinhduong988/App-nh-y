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
} from 'react-native';
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

export default function AiChatBubble({ onApplyToTrainer, onSaveConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Xin chào Xạ Thủ! 👋 Tôi là Trợ Lý AI Kéo Tâm Free Fire (OB 2026).\n\nBạn đang gặp vấn đề gì khi kéo tâm (dính ngực, vọt đầu) hay cần độ nhạy cho dòng máy nào?',
      timestamp: 'Vừa xong',
    },
  ]);

  // Bubble Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

    // AI Processing response
    setTimeout(() => {
      const aiReply = generateAiResponse(textToSend);
      setMessages((prev) => [...prev, aiReply]);
      // Play sound
      SOUNDS.playHeadshotCrit();
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
        redDot: 168,
        scope2x: 162,
        scope4x: 154,
        awm: 70,
        freeLook: 135,
        buttonSize: 48,
        dpi: '420 (Mặc định)',
        dragType: 'Kéo Nhẹ Hãm Phanh Ngón Tay',
      };
    } else if (q.includes('shotgun') || q.includes('m1887') || q.includes('m1014') || q.includes('một viên') || q.includes('one-shot')) {
      replyText =
        '💥 [BÍ QUYẾT SHOTGUN M1887 ONE-TAP 2026]\n' +
        '• Kỹ thuật: Đặt hồng tâm ngang sườn hoặc chân địch (không để tâm dính ngực trước khi bắn). Vuốt hạ ngón tay nhẹ sang phải rồi vẩy ngược lên đỉnh đầu góc 45°.\n' +
        '• Cỡ nút bắn khuyên dùng: 39% - 42% đặt cách đáy màn hình 10%.';
      configData = {
        name: 'AI Shotgun M1887 One-Tap',
        general: 192,
        redDot: 184,
        scope2x: 176,
        scope4x: 168,
        awm: 72,
        freeLook: 142,
        buttonSize: 40,
        dpi: 490,
        dragType: 'Vuốt Móc Chữ J Góc 45°',
      };
    } else if (q.includes('mp40') || q.includes('smg') || q.includes('sấy') || q.includes('xòe đạn')) {
      replyText =
        '⚡ [BÍ QUYẾT SẤY MP40 CỤM ĐỎ]\n' +
        '• Kỹ thuật: Bắn nhịp 3-5 viên. Kéo ngón tay thẳng đều lực hướng lên trên và giữ nhẹ ngón tay để triệt tiêu độ giật nảy đạn. Tuyệt đối không giật cục bộ.';
      configData = {
        name: 'AI SMG MP40 Sấy Trùm',
        general: 186,
        redDot: 178,
        scope2x: 172,
        scope4x: 164,
        awm: 75,
        freeLook: 140,
        buttonSize: 46,
        dpi: 460,
        dragType: 'Kéo Thẳng Đều Tay Ghìm Giật',
      };
    } else if (q.includes('kính') || q.includes('nhám') || q.includes('bao tay') || q.includes('mồ hôi')) {
      replyText =
        '🧤 [TỐI ƯU KÍNH CƯỜNG LỰC NHÁM & BAO TAY]\n' +
        '• Kính nhám và bao ngón tay làm giảm điện dung tiếp xúc và giảm độ bám. AI đã tăng bù trừ +8 điểm độ nhạy để tay lướt êm mà tâm vẫn ăn chuẩn đầu.';
      configData = {
        name: 'AI Bù Trừ Kính Nhám & Bao Tay',
        general: 198,
        redDot: 192,
        scope2x: 186,
        scope4x: 178,
        awm: 78,
        freeLook: 145,
        buttonSize: 43,
        dpi: 510,
        dragType: 'Vuốt Vừa Tay (Bù Ma Sát)',
      };
    } else {
      replyText =
        `🤖 [AI KHUYÊN DÙNG CHO CẤU HÌNH CỦA BẠN]\n` +
        `Dựa trên thuật toán Headshot OB 2026, AI đã thiết lập bộ thông số cân bằng vàng (Golden Ratio) đảm bảo kéo tâm dính đầu từ khoảng cách gần đến tầm xa.`;
      configData = {
        name: `AI Cân Bằng: ${query.slice(0, 15)}`,
        general: 188,
        redDot: 176,
        scope2x: 170,
        scope4x: 162,
        awm: 74,
        freeLook: 140,
        buttonSize: 43,
        dpi: 480,
        dragType: 'Vuốt Móc Chữ J Nhẹ',
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
      {/* FLOATING ACTION CHAT BUBBLE (Bong bóng chat trên màn hình) */}
      {!isOpen && (
        <Animated.View
          style={[
            styles.floatingBubbleContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <TouchableOpacity
            style={styles.floatingBubble}
            activeOpacity={0.85}
            onPress={() => {
              setIsOpen(true);
              SOUNDS.playWeaponShot('smg');
            }}>
            <Text style={styles.bubbleIcon}>🤖</Text>
            <View style={styles.pulseBadge}>
              <Text style={styles.pulseBadgeText}>AI</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FLOATING AI CHAT MODAL SHEET */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.chatSheet}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.aiAvatar}>
                  <Text style={{ fontSize: 22 }}>🤖</Text>
                  <View style={styles.onlineDot} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AI Coach Kéo Tâm</Text>
                  <Text style={styles.headerSubtitle}>Trực tuyến • Chuẩn OB 2026</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

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
              style={styles.messagesContainer}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}>
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowUser : styles.messageRowAi,
                    ]}>
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.bubbleUser : styles.bubbleAi,
                      ]}>
                      <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
                        {m.text}
                      </Text>

                      {/* Attached Config Card */}
                      {m.config && (
                        <View style={styles.attachedConfigCard}>
                          <Text style={styles.cfgTitle}>🎯 {m.config.name}</Text>
                          <View style={styles.cfgStatsGrid}>
                            <Text style={styles.cfgStatItem}>Nhìn: <Text style={styles.cfgValue}>{m.config.general}</Text></Text>
                            <Text style={styles.cfgStatItem}>RedDot: <Text style={styles.cfgValue}>{m.config.redDot}</Text></Text>
                            <Text style={styles.cfgStatItem}>Nút: <Text style={styles.cfgValue}>{m.config.buttonSize}%</Text></Text>
                            <Text style={styles.cfgStatItem}>DPI: <Text style={styles.cfgValue}>{m.config.dpi}</Text></Text>
                          </View>
                          <Text style={styles.cfgDrag}>🔥 {m.config.dragType}</Text>

                          {/* Quick Action Buttons */}
                          <View style={styles.cfgActionsRow}>
                            {onApplyToTrainer && (
                              <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => {
                                  onApplyToTrainer(m.config);
                                  setIsOpen(false);
                                  Alert.alert('✅ Thành Công', 'Đã chuyển sang phòng tập và cài nút bắn!');
                                }}>
                                <Text style={styles.applyBtnText}>⚡ Luyện Ngay</Text>
                              </TouchableOpacity>
                            )}

                            {onSaveConfig && (
                              <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={() => {
                                  onSaveConfig(m.config);
                                }}>
                                <Text style={styles.saveBtnText}>💾 Lưu</Text>
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
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Hỏi AI về máy của bạn, lỗi kéo tâm..."
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage()}>
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
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
    bottom: 84,
    right: 20,
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
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  bubbleIcon: {
    fontSize: 28,
  },
  pulseBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  pulseBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // Modal Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    backgroundColor: 'rgba(16, 18, 24, 0.97)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '82%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowRadius: 20,
    shadowOpacity: 0.5,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
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
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 1.5,
    borderColor: '#14161D',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Quick Prompts
  quickPromptsWrapper: {
    paddingVertical: 10,
  },
  quickPromptsScroll: {
    gap: 8,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Messages List
  messagesContainer: {
    flex: 1,
    marginVertical: 4,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '86%',
    padding: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFF',
    fontWeight: '600',
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  // Attached Config Card in Chat
  attachedConfigCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  cfgTitle: {
    color: COLORS.primaryBright,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  cfgStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  cfgStatItem: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  cfgValue: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  cfgDrag: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  cfgActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
