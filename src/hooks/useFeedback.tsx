import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from '@/lib/capacitor';

type FeedbackType = 'scan' | 'safe' | 'threat' | 'warning' | 'click';

// Create an AudioContext lazily
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Haptic patterns (in ms) - web fallback
const hapticPatterns: Record<FeedbackType, number | number[]> = {
  scan: 50,
  safe: [50, 50, 100],
  threat: [100, 50, 100, 50, 200],
  warning: [50, 50, 50],
  click: 10,
};

// Sound configurations
const soundConfigs: Record<FeedbackType, { frequency: number; duration: number; type: OscillatorType; ramp?: 'up' | 'down' }> = {
  scan: { frequency: 1200, duration: 0.1, type: 'sine', ramp: 'up' },
  safe: { frequency: 880, duration: 0.3, type: 'sine' },
  threat: { frequency: 220, duration: 0.5, type: 'sawtooth' },
  warning: { frequency: 440, duration: 0.2, type: 'triangle' },
  click: { frequency: 1000, duration: 0.05, type: 'sine' },
};

export const useFeedback = () => {
  const isEnabledRef = useRef(true);

  const triggerHaptic = useCallback(async (type: FeedbackType) => {
    if (!isEnabledRef.current) return;

    // Use native Capacitor Haptics when available
    if (isNativePlatform()) {
      try {
        switch (type) {
          case 'scan':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'safe':
            await Haptics.notification({ type: NotificationType.Success });
            break;
          case 'threat':
            await Haptics.notification({ type: NotificationType.Error });
            break;
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning });
            break;
          case 'click':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
        }
      } catch (e) {
        // Haptics not available
      }
      return;
    }

    // Web fallback using Vibration API
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(hapticPatterns[type]);
      } catch (e) {
        // Vibration not available or blocked
      }
    }
  }, []);

  const playSound = useCallback((type: FeedbackType) => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const config = soundConfigs[type];
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      
      if (config.ramp === 'up') {
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(config.frequency, ctx.currentTime + config.duration);
      } else if (config.ramp === 'down') {
        oscillator.frequency.exponentialRampToValueAtTime(config.frequency / 2, ctx.currentTime + config.duration);
      }
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch (e) {
      // Audio not available
    }
  }, []);

  const playThreatAlert = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(440, now, 0.15);
      playTone(330, now + 0.15, 0.15);
      playTone(440, now + 0.3, 0.15);
      playTone(330, now + 0.45, 0.2);
    } catch (e) {
      // Audio not available
    }
  }, []);

  const playSafeSound = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playChime = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playChime(523.25, now, 0.15);
      playChime(659.25, now + 0.1, 0.15);
      playChime(783.99, now + 0.2, 0.25);
    } catch (e) {
      // Audio not available
    }
  }, []);

  const feedback = useCallback((type: FeedbackType) => {
    triggerHaptic(type);
    
    if (type === 'threat') {
      playThreatAlert();
    } else if (type === 'safe') {
      playSafeSound();
    } else {
      playSound(type);
    }
  }, [triggerHaptic, playSound, playThreatAlert, playSafeSound]);

  return {
    feedback,
    triggerHaptic,
    playSound,
    playThreatAlert,
    playSafeSound,
  };
};
