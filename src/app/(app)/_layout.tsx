import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { SystemChrome } from '@/components/system-chrome';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <SystemChrome />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="dining" options={{ presentation: 'card' }} />
        <Stack.Screen name="admissions" options={{ presentation: 'card' }} />
        <Stack.Screen name="inventory" options={{ presentation: 'card' }} />
        <Stack.Screen name="finance" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="notification/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}
