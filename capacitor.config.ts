import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4630d7ec2ef94bd0b780b6373fff695a',
  appName: 'Q-SHIELD',
  webDir: 'dist',
  server: {
    url: 'https://4630d7ec-2ef9-4bd0-b780-b6373fff695a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
