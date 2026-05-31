import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
