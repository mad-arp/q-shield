import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native Capacitor app (iOS/Android)
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Get the current platform: 'ios', 'android', or 'web'
 */
export const getPlatform = () => Capacitor.getPlatform();
