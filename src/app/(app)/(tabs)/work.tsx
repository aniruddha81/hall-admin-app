import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FeatureTile } from '@/components/ui/feature-tile';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useTheme } from '@/theme';
import {
  ADMISSION_ROLES,
  DINING_ROLES,
  FINANCE_ROLES,
  INVENTORY_ROLES,
  hasRoleAccess,
} from '@/lib/roles';

export default function WorkScreen() {
  const { user, refreshProfile } = useAuth();
  const { onRefresh, refreshing } = usePullToRefresh(refreshProfile);
  const { colors, spacing } = useTheme();

  const modules = [
    {
      key: 'dining',
      label: 'Dining',
      caption: 'Menus, items & bookings',
      icon: 'restaurant-menu' as const,
      route: '/(app)/dining' as const,
      roles: DINING_ROLES,
      accent: colors.primary,
    },
    {
      key: 'admissions',
      label: 'Seat Allocation',
      caption: 'DSW — review & assign seats',
      icon: 'assignment' as const,
      route: '/(app)/admissions' as const,
      roles: ADMISSION_ROLES,
      accent: colors.tertiary,
    },
    {
      key: 'inventory',
      label: 'Inventory',
      caption: 'Rooms & damage reports',
      icon: 'build' as const,
      route: '/(app)/inventory' as const,
      roles: INVENTORY_ROLES,
      accent: colors.secondary,
    },
    {
      key: 'finance',
      label: 'Finance',
      caption: 'Dues, payments & expenses',
      icon: 'account-balance-wallet' as const,
      route: '/(app)/finance' as const,
      roles: FINANCE_ROLES,
      accent: colors.success,
    },
  ];

  const accessible = modules.filter((m) => hasRoleAccess(user?.designation, m.roles));

  const header = (
    <GradientHeader extraBottom={32}>
      <ThemedText type="overline" style={styles.headerOverline}>
        Operational Modules
      </ThemedText>
      <ThemedText type="title" style={styles.headerTitle}>
        Work Center
      </ThemedText>
      <ThemedText type="small" style={styles.headerCaption}>
        {accessible.length > 0
          ? `${accessible.length} module${accessible.length === 1 ? '' : 's'} available for your role`
          : 'Use Alerts and Settings for your assigned duties'}
      </ThemedText>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={24} onRefresh={onRefresh} refreshing={refreshing}>
      <SectionHeader title="Your Modules" caption="Role-gated back-office tools" />
      {accessible.length === 0 ? (
        <EmptyState
          icon="dashboard"
          title="No Modules Assigned"
          message="Your role does not include operational modules. Use Home, Alerts, and Settings."
        />
      ) : (
        <View style={[styles.grid, { gap: spacing.sm }]}>
          {accessible.map((m) => (
            <FeatureTile
              key={m.key}
              icon={m.icon}
              label={m.label}
              caption={m.caption}
              accent={m.accent}
              accentTint={`${m.accent}12`}
              onPress={() => router.push(m.route)}
            />
          ))}
        </View>
      )}

      <SectionHeader title="Administration" caption="Broadcast and system settings" />
      <View style={[styles.grid, { gap: spacing.sm }]}>
        <FeatureTile icon="campaign" label="Notifications" caption="Broadcast to students" accent={colors.primary} accentTint={`${colors.primary}12`} onPress={() => router.push('/(app)/(tabs)/notifications')} />
        <FeatureTile icon="settings" label="Settings" caption="Sessions & approvals" accent={colors.textMuted} accentTint={`${colors.textMuted}12`} onPress={() => router.push('/(app)/settings')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerOverline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', marginTop: -2 },
  headerCaption: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
