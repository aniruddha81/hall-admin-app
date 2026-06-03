import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { FeatureTile } from '@/components/ui/feature-tile';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { usePendingApplicationsQuery } from '@/hooks/queries/admission';
import {
  useAdminTodayMenusQuery,
  useAdminTomorrowMenusQuery,
} from '@/hooks/queries/dining';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import {
  ADMISSION_ROLES,
  DINING_ROLES,
  FINANCE_ROLES,
  INVENTORY_ROLES,
  formatLabel,
  hasRoleAccess,
} from '@/lib/roles';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const canDining = hasRoleAccess(user?.designation, DINING_ROLES);
  const canAdmissions = hasRoleAccess(user?.designation, ADMISSION_ROLES);
  const canInventory = hasRoleAccess(user?.designation, INVENTORY_ROLES);
  const canFinance = hasRoleAccess(user?.designation, FINANCE_ROLES);

  const todayMenusQuery = useAdminTodayMenusQuery(canDining);
  const tomorrowMenusQuery = useAdminTomorrowMenusQuery(canDining);
  const pendingAppsQuery = usePendingApplicationsQuery(canAdmissions);
  const todayMenus = todayMenusQuery.data?.data.menus ?? [];
  const tomorrowMenus = tomorrowMenusQuery.data?.data.menus ?? [];
  const pendingApps = pendingAppsQuery.data ?? [];
  const loading =
    (canDining &&
      ((todayMenusQuery.isLoading && !todayMenusQuery.data) ||
        (tomorrowMenusQuery.isLoading && !tomorrowMenusQuery.data))) ||
    (canAdmissions && pendingAppsQuery.isLoading && !pendingAppsQuery.data);
  const error =
    todayMenusQuery.error || tomorrowMenusQuery.error || pendingAppsQuery.error;

  const { onRefresh, refreshing } = usePullToRefresh(async () => {
    const tasks: Array<Promise<unknown>> = [];
    if (canDining) {
      tasks.push(todayMenusQuery.refetch(), tomorrowMenusQuery.refetch());
    }
    if (canAdmissions) {
      tasks.push(pendingAppsQuery.refetch());
    }
    await Promise.all(tasks);
  });

  const header = (
    <GradientHeader extraBottom={40}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <ThemedText type="overline" style={styles.headerOverline}>
            RUET Hall Admin Portal
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitle}>
            Hi, {user?.name?.split(' ')[0] ?? 'Admin'}
          </ThemedText>
        </View>
        <Avatar
          name={user?.name}
          uri={user?.avatarUrl}
          size={48}
          onPress={() => router.push('/(app)/(tabs)/profile')}
        />
      </View>
      <View style={[styles.allocation, { borderRadius: radius.xl }]}>
        <View style={styles.allocationItem}>
          <ThemedText type="overline" style={styles.allocationLabel}>Role</ThemedText>
          <ThemedText type="smallBold" style={styles.allocationValue} numberOfLines={1}>
            {formatLabel(user?.designation)}
          </ThemedText>
        </View>
        <View style={styles.allocationDivider} />
        <View style={styles.allocationItem}>
          <ThemedText type="overline" style={styles.allocationLabel}>Hall</ThemedText>
          <ThemedText type="smallBold" style={styles.allocationValue} numberOfLines={1}>
            {formatLabel(user?.hall)}
          </ThemedText>
        </View>
      </View>
    </GradientHeader>
  );

  return (
    <Screen
      header={header}
      overlap={28}
      loading={loading}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>{error}</ThemedText>
        </View>
      ) : null}

      <View style={[styles.statRow, { gap: spacing.md }]}>
        {canDining ? (
          <>
            <StatTile label="Today Menus" value={String(todayMenus.length)} icon="restaurant" accent={colors.primary} accentTint={`${colors.primary}1A`} />
            <StatTile label="Tomorrow Menus" value={String(tomorrowMenus.length)} icon="event" accent={colors.secondary} accentTint={`${colors.secondary}1A`} />
          </>
        ) : null}
        {canAdmissions ? (
          <StatTile label="Pending Apps" value={String(pendingApps.length)} icon="assignment" accent={colors.warning} accentTint={`${colors.warning}1A`} />
        ) : null}
      </View>

      <SectionHeader title="Quick Actions" />
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {canDining ? (
          <FeatureTile icon="restaurant-menu" label="Dining" caption="Menus & tokens" accent={colors.primary} accentTint={`${colors.primary}12`} onPress={() => router.push('/(app)/dining')} />
        ) : null}
        {canAdmissions ? (
          <FeatureTile icon="assignment" label="Seat Allocation" caption="DSW applications" accent={colors.tertiary} accentTint={`${colors.tertiary}12`} onPress={() => router.push('/(app)/admissions')} />
        ) : null}
        {canInventory ? (
          <FeatureTile icon="build" label="Inventory" caption="Rooms & complaints" accent={colors.secondary} accentTint={`${colors.secondary}12`} onPress={() => router.push('/(app)/inventory')} />
        ) : null}
        {canFinance ? (
          <FeatureTile icon="account-balance-wallet" label="Finance" caption="Dues & expenses" accent={colors.success} accentTint={`${colors.success}12`} onPress={() => router.push('/(app)/finance')} />
        ) : null}
        <FeatureTile icon="campaign" label="Notify" caption="Broadcast alerts" accent={colors.primary} accentTint={`${colors.primary}12`} onPress={() => router.push('/(app)/(tabs)/notifications')} />
        <FeatureTile icon="settings" label="Settings" caption="Sessions & admin" accent={colors.textMuted} accentTint={`${colors.textMuted}12`} onPress={() => router.push('/(app)/settings')} />
      </View>

      {canDining ? (
        <>
          <SectionHeader title="Today's Menus" actionLabel="Manage" onActionPress={() => router.push('/(app)/dining')} />
          {todayMenus.length > 0 ? (
            <View style={styles.list}>
              {todayMenus.slice(0, 4).map((m) => (
                <ListRow
                  key={m.id}
                  icon="restaurant"
                  accent={colors.primary}
                  title={`${formatLabel(m.hall)} · ${formatLabel(m.mealType)}`}
                  subtitle={`${m.menuDescription} · ${m.availableTokens} tokens left`}
                  trailingText={`৳${m.price}`}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon="restaurant-menu" title="No Menus Today" message="Post today's dining menu from the Dining module." actionLabel="Open Dining" onAction={() => router.push('/(app)/dining')} />
          )}
        </>
      ) : null}

      {canAdmissions ? (
        <>
          <SectionHeader title="Pending Applications" actionLabel="Review" onActionPress={() => router.push('/(app)/admissions')} />
          {pendingApps.length > 0 ? (
            <View style={styles.list}>
              {pendingApps.slice(0, 5).map((app) => (
                <ListRow key={app.id} icon="person" accent={colors.warning} title={app.studentName ?? `Student #${app.studentId}`} subtitle={app.academicDepartment} trailingText={app.status} />
              ))}
            </View>
          ) : (
            <EmptyState icon="assignment" title="No Pending Applications" message="All seat applications have been reviewed." variant="success" />
          )}
        </>
      ) : null}

      {!canDining && !canAdmissions && !canInventory && !canFinance ? (
        <EmptyState
          icon="dashboard"
          title="Limited Module Access"
          message="Use Alerts and Settings for your role. Contact Provost for module permissions."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerOverline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', marginTop: -2 },
  allocation: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingVertical: 10, paddingHorizontal: 16 },
  allocationItem: { flex: 1, gap: 2 },
  allocationLabel: { color: 'rgba(255,255,255,0.6)' },
  allocationValue: { color: '#FFFFFF' },
  allocationDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 16 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  list: {},
  errorBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
});
