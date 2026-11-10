// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens - Centralized design system values
// Spacing scale: 4px increments (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
// ─────────────────────────────────────────────────────────────────────────────

// Spacing Scale (multiples of 4)
export const spacing = {
  xs: '4px',   // 1 unit
  sm: '8px',   // 2 units
  md: '12px',  // 3 units
  base: '16px', // 4 units
  lg: '20px',  // 5 units
  xl: '24px',  // 6 units
  '2xl': '32px', // 8 units
  '3xl': '40px', // 10 units
  '4xl': '48px', // 12 units
  '5xl': '64px', // 16 units
};

// Colors - Centralized palette
export const colors = {
  // Primary palette
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#667eea',
    600: '#5a67d8',
    700: '#4f46e5',
    800: '#4338ca',
    900: '#3730a3',
  },
  // Secondary palette
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#764ba2',
    600: '#6d28d9',
    700: '#5b21b6',
    800: '#4c1d95',
    900: '#3b0764',
  },
  // Accent palette
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#f093fb',
    600: '#ec4899',
    700: '#db2777',
    800: '#be185d',
    900: '#831843',
  },
  // Status colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a344',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Neutral grays
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// Background colors
export const backgrounds = {
  primary: colors.gray[50],
  secondary: '#ffffff',
  elevated: 'rgba(255, 255, 255, 0.97)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Text colors
export const text = {
  primary: colors.gray[900],
  secondary: colors.gray[600],
  muted: colors.gray[400],
  inverse: '#ffffff',
};

// Border colors
export const borders = {
  default: 'rgba(102, 126, 234, 0.1)',
  strong: 'rgba(102, 126, 234, 0.2)',
  input: colors.primary[200],
  inputFocus: colors.primary[400],
};

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 10px rgba(0, 0, 0, 0.07)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.08)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.12)',
  '2xl': '0 28px 60px rgba(0, 0, 0, 0.2)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 4px rgba(102, 126, 234, 0.12)',
  button: '0 5px 16px rgba(102, 126, 234, 0.38)',
};

// Border radii
export const radii = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

// Transitions
export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

// Z-index
export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};