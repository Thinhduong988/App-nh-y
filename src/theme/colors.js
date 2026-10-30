// BẢNG MÀU iOS 26 LIQUID GLASS (TỐI GIẢN, TINH TẾ, CAM ĐIỂM NHẤN CAO CẤP)
export const COLORS = {
  // Nền đen chuẩn Apple OLED siêu sâu & sang trọng
  background: '#090A0D',          // Đen titanium sâu thẳm
  backgroundAlt: '#0F1015',       // Nền phụ đen ánh than
  surface: '#14161D',             // Lớp nền bề mặt
  surfaceCard: 'rgba(255, 255, 255, 0.04)',

  // Hiệu ứng kính lỏng iOS 26 (Liquid Frosted Glass)
  glassSurface: 'rgba(255, 255, 255, 0.04)',
  glassCard: 'rgba(255, 255, 255, 0.05)',
  glassCardElevated: 'rgba(255, 255, 255, 0.08)',
  glassCardBright: 'rgba(255, 255, 255, 0.12)',
  glassCardDark: 'rgba(12, 13, 18, 0.82)',
  
  // Viền kính siêu mỏng & phản chiếu ánh sáng (Specular Rim Light)
  glassBorder: 'rgba(255, 255, 255, 0.09)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.18)',
  glassBorderAccent: 'rgba(255, 106, 0, 0.45)', // Cam nhẹ chỉ dùng làm viền điểm nhấn
  glassGlow: 'rgba(255, 106, 0, 0.25)',
  glassOverlay: 'rgba(9, 10, 13, 0.85)',

  // Tương thích ngược (Backward-compatibility aliases)
  border: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(255, 255, 255, 0.14)',
  cyanTactical: '#0A84FF',

  // Màu cam điểm nhấn (Accent - dùng có chừng mực, tinh tế)
  primary: '#FF6A00',             // Cam Apple Flame điểm nhấn
  primaryBright: '#FF7D1A',       // Cam sáng khi tương tác
  primaryGlow: 'rgba(255, 106, 0, 0.25)',
  primaryLight: 'rgba(255, 106, 0, 0.10)',

  // Màu phụ trợ tối giản
  secondary: '#FFB800',           // Vàng kim nhẹ
  secondaryLight: 'rgba(255, 184, 0, 0.10)',
  accentRed: '#FF3B30',           // Đỏ Apple Headshot chuẩn
  accentGreen: '#34C759',         // Xanh Apple ổn định
  accentCyan: '#0A84FF',          // Xanh dương iOS

  // Kiểu chữ chuẩn iOS (Tương phản cao, sạch sẽ, không rối mắt)
  text: '#FFFFFF',                // Trắng tinh khiết
  textSecondary: '#EBEBF5',       // Trắng bạc dịu mắt
  textMuted: '#8E8E93',           // Xám bạc iOS
  textDim: '#48484A',             // Xám tối

  // Bo góc chuẩn Liquid Glass iOS 26 (Cực kỳ mềm mại, không vuông vức)
  rounded: {
    xs: 10,
    sm: 14,
    md: 20,
    lg: 26,
    xl: 32,
    full: 999,
  },
};
