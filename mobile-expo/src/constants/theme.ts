/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#292526',
    background: '#F7F1E7',
    backgroundElement: '#EFE2DD',
    backgroundSelected: '#E3D2CA',
    textSecondary: '#746B66',
    card: '#FFFCF7',
    cardStrong: '#FFFFFF',
    border: '#D9CCB9',
    primary: '#6B1E2E',
    primaryPressed: '#47131F',
    accent: '#B08D57',
    onPrimary: '#FFFFFF',
    success: '#197451',
    danger: '#B42318',
  },
  dark: {
    text: '#F7F1E7',
    background: '#211A1B',
    backgroundElement: '#342528',
    backgroundSelected: '#4A3035',
    textSecondary: '#CDBFB2',
    card: '#2A2022',
    cardStrong: '#342528',
    border: '#5A4545',
    primary: '#D49AAA',
    primaryPressed: '#E8B6C3',
    accent: '#D4B57D',
    onPrimary: '#211A1B',
    success: '#75C9A4',
    danger: '#FF9B94',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
