const SETTINGS_KEY = 'qshield_settings';

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  splashEnabled: boolean;
  notificationsEnabled: boolean;
}

const defaultSettings: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  splashEnabled: true,
  notificationsEnabled: false,
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    // Ignore
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const updateSetting = <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings => {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
};
