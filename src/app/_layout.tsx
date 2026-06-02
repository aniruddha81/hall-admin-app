import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { SystemChrome } from '@/components/system-chrome';
import { AuthProvider } from '@/contexts/AuthContext';
import { StatusBarProvider } from '@/contexts/StatusBarContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/providers/query-provider';

function RootNavigation() {
  const { colors, resolvedTheme, isReady } = useAppTheme();
  const navTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <RouterThemeProvider
      value={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <SystemChrome />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </RouterThemeProvider>
  );
}

function RootSurface({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <ThemeProvider>
            <StatusBarProvider>
              <RootSurface>
                <QueryProvider>
                  <AuthProvider>
                    <RootNavigation />
                  </AuthProvider>
                </QueryProvider>
              </RootSurface>
            </StatusBarProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
