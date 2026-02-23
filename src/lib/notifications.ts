import { isNativePlatform } from '@/lib/capacitor';
import { getSettings } from '@/lib/settings';

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Check if notifications are supported and permitted
 */
export const canSendNotifications = (): boolean => {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

/**
 * Send a threat alert notification
 */
export const sendThreatNotification = (url: string, threatLevel: string): void => {
  const settings = getSettings();
  if (!settings.notificationsEnabled || !canSendNotifications()) return;

  const titles: Record<string, string> = {
    malicious: '🚨 THREAT DETECTED',
    suspicious: '⚠️ SUSPICIOUS URL',
    safe: '✅ URL SAFE',
  };

  const bodies: Record<string, string> = {
    malicious: `Malicious URL blocked: ${url.substring(0, 60)}...`,
    suspicious: `Suspicious URL flagged: ${url.substring(0, 60)}...`,
    safe: `URL verified safe: ${url.substring(0, 60)}`,
  };

  try {
    new Notification(titles[threatLevel] || 'Q-SHIELD Alert', {
      body: bodies[threatLevel] || `Scan complete for: ${url}`,
      icon: '/app-icon.png',
      badge: '/app-icon.png',
      tag: 'qshield-threat',
      requireInteraction: threatLevel === 'malicious',
    });
  } catch (e) {
    // Notification not available
  }
};
