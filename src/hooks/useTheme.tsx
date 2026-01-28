import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ColorScheme = 'green' | 'blue' | 'purple' | 'orange';
export type ThemeMode = 'dark' | 'vibrant';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_SCHEMES: Record<ColorScheme, { hue: number; name: string }> = {
  green: { hue: 120, name: 'Matrix Green' },
  blue: { hue: 200, name: 'Cyber Blue' },
  purple: { hue: 270, name: 'Neon Purple' },
  orange: { hue: 25, name: 'Flame Orange' },
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('qshield-color-scheme');
    return (saved as ColorScheme) || 'green';
  });
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('qshield-theme-mode');
    return (saved as ThemeMode) || 'dark';
  });

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('qshield-color-scheme', scheme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('qshield-theme-mode', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    const { hue } = COLOR_SCHEMES[colorScheme];
    const isVibrant = themeMode === 'vibrant';
    
    // Primary color based on scheme
    root.style.setProperty('--primary', `${hue} 100% 50%`);
    root.style.setProperty('--primary-foreground', '0 0% 0%');
    
    // Foreground - vibrant uses white text
    root.style.setProperty('--foreground', isVibrant ? '0 0% 95%' : `${hue} 100% 50%`);
    
    // Card colors
    root.style.setProperty('--card', isVibrant ? `${hue} 30% 8%` : '0 0% 6%');
    root.style.setProperty('--card-foreground', isVibrant ? '0 0% 95%' : `${hue} 100% 50%`);
    
    // Accent
    root.style.setProperty('--accent', `${hue} 100% 40%`);
    root.style.setProperty('--accent-foreground', '0 0% 0%');
    
    // Muted
    root.style.setProperty('--muted', `${hue} ${isVibrant ? '20%' : '5%'} 15%`);
    root.style.setProperty('--muted-foreground', `${hue} 30% 60%`);
    
    // Secondary
    root.style.setProperty('--secondary', `${hue} ${isVibrant ? '20%' : '10%'} 12%`);
    root.style.setProperty('--secondary-foreground', `${hue} 100% 50%`);
    
    // Borders & inputs
    root.style.setProperty('--border', `${hue} 100% ${isVibrant ? '30%' : '20%'}`);
    root.style.setProperty('--input', `${hue} 100% 20%`);
    root.style.setProperty('--ring', `${hue} 100% 50%`);
    
    // Safe color (always green for safety)
    root.style.setProperty('--safe', '120 100% 50%');
    root.style.setProperty('--safe-foreground', '0 0% 0%');
    
    // Background
    root.style.setProperty('--background', isVibrant ? `${hue} 15% 6%` : '0 0% 4%');
    
    // Popover
    root.style.setProperty('--popover', isVibrant ? `${hue} 30% 8%` : '0 0% 6%');
    root.style.setProperty('--popover-foreground', isVibrant ? '0 0% 95%' : `${hue} 100% 50%`);
    
    // Update theme class
    root.setAttribute('data-theme', themeMode);
    root.setAttribute('data-color', colorScheme);
  }, [colorScheme, themeMode]);

  return (
    <ThemeContext.Provider value={{ colorScheme, themeMode, setColorScheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const colorSchemeOptions = COLOR_SCHEMES;
