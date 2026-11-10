/** @type {import('tailwindcss').Config} */
import { colors, radii, shadows, transitions } from './src/utils/designTokens.js';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: { 50: '#eff5ef', 100: '#dfebdf', 200: '#c3d9c6', 300: '#9ac1a3', 400: '#72a680', 500: '#48835b', 600: '#326d49', 700: '#28624d', 800: '#214e3d', 900: '#203c30', 950: '#202d29' },
        purple: { 50: '#f2f5ef', 100: '#e3ebdd', 200: '#cad9c1', 300: '#aabb9e', 400: '#8b9f7e', 500: '#6c825e', 600: '#526849', 700: '#40513a', 800: '#34422f', 900: '#293626' },
        primary:   colors.primary,
        secondary: colors.secondary,
        accent:    colors.accent,
        success:   colors.success,
        warning:   colors.warning,
        danger:    colors.danger,
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-slide-up': `fadeSlideUp ${transitions.normal} ${transitions.easing}`,
        'bounce-in':     `bounceIn ${transitions.slow} ${transitions.easing}`,
        'scale-in':      `scaleIn ${transitions.fast} ${transitions.easing}`,
        'float':         'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '60%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.93)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
      },
      borderRadius: {
        ...radii,
      },
      boxShadow: {
        ...shadows,
      },
    },
  },
  plugins: [],
};
