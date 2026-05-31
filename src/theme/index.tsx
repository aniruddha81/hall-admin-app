import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { colors, type ThemeColors } from './colors';
import { spacing, radius, typography } from './spacing';
import { shadows } from './shadows';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_PREF_KEY = 'ruet_admin_theme_preference';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: any;
  setPreference: (pref: ThemePreference) => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    void AsyncStorage.setItem(THEME_PREF_KEY, pref);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      colors: colors[resolvedTheme] as ThemeColors,
      typography,
      spacing,
      radius,
      shadows: shadows[resolvedTheme],
      setPreference,
      isReady,
    }),
    [preference, resolvedTheme, setPreference, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
export { colors } from './colors';
export { spacing, radius, typography, fonts } from './spacing';
export { shadows } from './shadows';
