// BẢNG MÀU iOS DESIGN SYSTEM v1.0.8 (DARK NAVY OLED + ACCENT THEMES)
export const APP_VERSION = '1.0.8';

export const THEME_ACCENTS = {
  green: {
    id: 'green',
    label: 'Xanh lá',
    primary: '#22C55E',
    bright: '#4ADE80',
    light: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.42)',
    textOnPrimary: '#06150C',
  },
  red: {
    id: 'red',
    label: 'Đỏ',
    primary: '#EF4444',
    bright: '#F87171',
    light: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.42)',
    textOnPrimary: '#FFFFFF',
  },
  purple: {
    id: 'purple',
    label: 'Tím',
    primary: '#A855F7',
    bright: '#C084FC',
    light: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.42)',
    textOnPrimary: '#FFFFFF',
  },
  orange: {
    id: 'orange',
    label: 'Cam',
    primary: '#FF6A00',
    bright: '#FF8533',
    light: 'rgba(255, 106, 0, 0.15)',
    border: 'rgba(255, 106, 0, 0.45)',
    textOnPrimary: '#090B11',
  },
  yellow: {
    id: 'yellow',
    label: 'Vàng',
    primary: '#F5B700',
    bright: '#FACC15',
    light: 'rgba(245, 183, 0, 0.15)',
    border: 'rgba(245, 183, 0, 0.45)',
    textOnPrimary: '#090B11',
  },
};

export const getAccentTheme = (accentIdOrHex) => {
  if (THEME_ACCENTS[accentIdOrHex]) return THEME_ACCENTS[accentIdOrHex];
  const byHex = Object.values(THEME_ACCENTS).find(
    (item) => item.primary.toLowerCase() === String(accentIdOrHex || '').toLowerCase()
  );
  return byHex || THEME_ACCENTS.orange;
};

export const COLORS = {
  // Nền Dark Navy chuẩn Figma iOS (#090B11)
  background: '#090B11',
  backgroundAlt: '#0E121B',
  surface: '#111622',
  surfaceElevated: '#161D2C',
  surfaceCard: 'rgba(17, 22, 34, 0.96)',

  // Hiệu ứng kính mờ iOS (Frosted Navy Glass)
  glassSurface: 'rgba(17, 22, 34, 0.86)',
  glassCard: '#111622',
  glassCardElevated: '#171E2E',
  glassCardBright: '#1E273B',
  glassCardDark: 'rgba(9, 11, 17, 0.94)',

  // Viền tinh tế chuẩn iOS
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.15)',
  glassBorderAccent: 'rgba(255, 106, 0, 0.45)',
  glassGlow: 'rgba(255, 106, 0, 0.25)',
  glassOverlay: 'rgba(9, 11, 17, 0.88)',

  // Backward-compatibility aliases
  border: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(255, 255, 255, 0.15)',
  cyanTactical: '#38BDF8',

  // Màu điểm nhấn mặc định (Cam Esports)
  primary: '#FF6A00',
  primaryBright: '#FF8533',
  primaryGlow: 'rgba(255, 106, 0, 0.25)',
  primaryLight: 'rgba(255, 106, 0, 0.14)',
  textOnPrimary: '#090B11',

  // Màu ngữ nghĩa & trạng thái
  secondary: '#F5B700',
  secondaryLight: 'rgba(245, 183, 0, 0.14)',
  accentRed: '#EF4444',
  accentGreen: '#22C55E',
  accentCyan: '#38BDF8',

  // Typography tương phản cao chuẩn iOS
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#8E96A8',
  textDim: '#525B70',

  // Bo góc mềm mại đồng bộ iOS
  rounded: {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 999,
  },
};
