import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = [colors.primary, colors.secondary, colors.tertiary] as const;

  return (
    <Screen>
      <View style={[styles.hero, { paddingTop: spacing.giant, paddingBottom: spacing.lg }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badge, { borderRadius: radius.xl + 6 }]}>
          <MaterialIcons name="admin-panel-settings" size={32} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText type="title" style={styles.heroTitle}>
          Admin sign in
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted" style={styles.heroSub}>
          RUET Hall Management back-office
        </ThemedText>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}40` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.form, { gap: spacing.md }]}>
        <Input
          label="Email"
          icon="mail"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@ruet.ac.bd"
        />
        <Input
          label="Password"
          icon="lock"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
        />
        <Button title="Sign in" loading={loading} onPress={handleLogin} style={styles.submit} />
      </View>

      <ThemedText type="small" themeColor="textMuted" style={[styles.footer, { marginTop: spacing.lg }]}>
        Need access?{' '}
        <Link href="/signup">
          <ThemedText type="link" themeColor="primary">
            Request admin account
          </ThemedText>
        </Link>
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6 },
  badge: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center' },
  errorBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  form: {},
  submit: { marginTop: 8 },
  footer: { textAlign: 'center' },
});
