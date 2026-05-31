import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar as NativeStatusBar } from 'react-native';
import { useEffect } from 'react';

import { useStatusBarOverride } from '@/contexts/StatusBarContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { setRootBackgroundColor } from '@/lib/safe-system-ui';

/** Keeps status bar and Android navigation bar in sync with the active theme (SDK 56 APIs). */
export function SystemChrome() {
  const { colors, resolvedTheme } = useAppTheme();
  const { override } = useStatusBarOverride();

  const defaultBarStyle = resolvedTheme === 'dark' ? 'light' : 'dark';
  const barStyle = override?.style ?? defaultBarStyle;
  const nativeBarStyle = barStyle === 'light' ? 'light-content' : 'dark-content';
  const backgroundColor = override?.backgroundColor ?? colors.background;
  const translucent = override?.translucent ?? false;

  useEffect(() => {
    let cancelled = false;

    const apply = async () => {
      if (cancelled) return;
      await setRootBackgroundColor(colors.background);
      if (cancelled || Platform.OS !== 'android') return;

      try {
        NativeStatusBar.setTranslucent(translucent);
        NativeStatusBar.setBackgroundColor(backgroundColor, true);
        NativeStatusBar.setBarStyle(nativeBarStyle, true);
      } catch {
        // Activity may be gone during fast refresh
      }

    };

    void apply();

    return () => {
      cancelled = true;
    };
  }, [backgroundColor, colors.background, colors.navBar, nativeBarStyle, translucent]);

  return (
    <>
      <StatusBar style={barStyle} />
      {Platform.OS === 'android' ? <NavigationBar style={colors.navBar} /> : null}
    </>
  );
}

export function AuthChrome() {
  const { resolvedTheme, colors } = useAppTheme();
  const barStyle = resolvedTheme === 'dark' ? 'light' : 'dark';
  const nativeBarStyle = resolvedTheme === 'dark' ? 'light-content' : 'dark-content';

  useEffect(() => {
    if (Platform.OS === 'android') {
      NativeStatusBar.setTranslucent(false);
      NativeStatusBar.setBackgroundColor(colors.background, true);
      NativeStatusBar.setBarStyle(nativeBarStyle, true);
    }
  }, [colors.background, nativeBarStyle]);

  return <StatusBar style={barStyle} />;
}
