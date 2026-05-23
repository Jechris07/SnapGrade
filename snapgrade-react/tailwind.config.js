/** @type {import('tailwindcss').Config} */
import { colors, radii, shadows, transitions } from './src/utils/designTokens.js';

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
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
