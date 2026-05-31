import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemePreference } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import {
  approveAdmin,
  createAcademicSession,
  getAdminApplications,
  getManagedAcademicSessions,
  logoutAll,
  updateAcademicSession,
} from '@/lib/services/auth.service';
import type { AcademicSession, AdminData } from '@/lib/types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName; caption: string }[] = [
  { value: 'system', label: 'System', icon: 'brightness-auto', caption: 'Match Device' },
  { value: 'light', label: 'Light', icon: 'light-mode', caption: 'Always Bright' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode', caption: 'Always Dim' },
];

function ThemeOptionCard({
  opt,
  selected,
  onPress,
}: {
  opt: (typeof THEME_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, resolvedTheme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bg = selected
    ? resolvedTheme === 'dark'
      ? 'rgba(59, 130, 246, 0.15)'
      : 'rgba(37, 99, 235, 0.12)'
    : colors.surfaceGlass;
  const border = selected ? colors.primary : colors.border;
  const iconBg = selected ? colors.primary : colors.border;
  const iconCol = selected ? '#FFFFFF' : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(scaleAnim, { toValue: 0.96, duration: 120, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
      style={styles.pressableOpt}>
      <Animated.View style={[styles.themeOption, { borderColor: border, backgroundColor: bg, borderRadius: radius.xl, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.themeIcon, { backgroundColor: iconBg, borderRadius: radius.md }]}>
          <MaterialIcons name={opt.icon} size={20} color={iconCol} />
        </View>
        <ThemedText type="smallBold" style={{ color: selected ? colors.primary : colors.text }}>{opt.label}</ThemedText>
        <ThemedText type="small" themeColor="textMuted">{opt.caption}</ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { preference, setPreference, colors, spacing, radius } = useTheme();
  const [pendingAdmins, setPendingAdmins] = useState<AdminData[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const isProvost = user?.designation === 'PROVOST';
  const canManageSessions =
    isProvost ||
    user?.designation === 'ASST_FINANCE' ||
    user?.designation === 'FINANCE_SECTION_OFFICER' ||
    user?.designation === 'ASST_INVENTORY' ||
    user?.designation === 'INVENTORY_SECTION_OFFICER';

  useEffect(() => {
    if (!isProvost && !canManageSessions) return;
    (async () => {
      try {
        if (isProvost) {
          const res = await getAdminApplications();
          setPendingAdmins((res.data.applications ?? []).filter((a) => !a.isActive));
        }
        if (canManageSessions) {
          const res = await getManagedAcademicSessions();
          setSessions(res.data.sessions ?? []);
        }
      } catch {
        // Non-blocking
      }
    })();
  }, [isProvost, canManageSessions]);

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      Alert.alert('Success', 'Signed out from all devices.');
      await logout();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const reviewAdmin = async (adminApplicationId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoadingAdmin(true);
    try {
      await approveAdmin(adminApplicationId, status);
      const res = await getAdminApplications();
      setPendingAdmins((res.data.applications ?? []).filter((a) => !a.isActive));
      Alert.alert('Done', `Application ${status.toLowerCase()}.`);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setLoadingAdmin(false);
    }
  };

  const addSession = async () => {
    if (!sessionLabel.trim()) return;
    try {
      await createAcademicSession({ label: sessionLabel.trim() });
      setSessionLabel('');
      const res = await getManagedAcademicSessions();
      setSessions(res.data.sessions ?? []);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const toggleSession = async (session: AcademicSession) => {
    try {
      await updateAcademicSession(session.id, { isActive: !session.isActive });
      const res = await getManagedAcademicSessions();
      setSessions(res.data.sessions ?? []);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  return (
    <Screen title="Settings" withBackButton>
      <SectionHeader title="Appearance" caption="Pick how the application looks" />
      <View style={[styles.themeRow, { gap: spacing.sm }]}>
        {THEME_OPTIONS.map((opt) => (
          <ThemeOptionCard key={opt.value} opt={opt} selected={preference === opt.value} onPress={() => setPreference(opt.value)} />
        ))}
      </View>

      <SectionHeader title="Session Management" caption="Manage where you're signed in" />
      <View style={{ gap: spacing.md }}>
        <Button title="Sign out (this device)" variant="outline" onPress={logout} />
        <Button title="Sign out all devices" variant="destructive" onPress={handleLogoutAll} />
      </View>

      {isProvost ? (
        <>
          <SectionHeader title="Pending admin applications" />
          {pendingAdmins.length === 0 ? (
            <EmptyState icon="person-add" title="No Pending Applications" message="All admin account requests have been processed." />
          ) : (
            pendingAdmins.map((admin) => (
              <Card key={admin.id} style={{ marginBottom: 8 }}>
                <ListRow icon="person" accent={colors.primary} title={admin.name} subtitle={`${formatLabel(admin.designation)} · ${formatLabel(admin.hall)}`} />
                <View style={[styles.rowActions, { gap: spacing.sm }]}>
                  <Button title="Approve" size="sm" loading={loadingAdmin} onPress={() => reviewAdmin(admin.id, 'APPROVED')} />
                  <Button title="Reject" size="sm" variant="outline" loading={loadingAdmin} onPress={() => reviewAdmin(admin.id, 'REJECTED')} />
                </View>
              </Card>
            ))
          )}
        </>
      ) : null}

      {canManageSessions ? (
        <>
          <SectionHeader title="Academic sessions" />
          <View style={{ gap: spacing.sm }}>
            <Input label="New session label" icon="event" value={sessionLabel} onChangeText={setSessionLabel} placeholder="e.g. 2024-2025" />
            <Button title="Add session" onPress={addSession} />
          </View>
          {sessions.map((s) => (
            <Card key={s.id} style={{ marginBottom: 8 }}>
              <ListRow icon="school" accent={s.isActive ? colors.success : colors.textMuted} title={s.label} subtitle={s.isActive ? 'Active' : 'Inactive'} />
              <Button title={s.isActive ? 'Deactivate' : 'Activate'} size="sm" variant="outline" onPress={() => toggleSession(s)} style={{ margin: 12 }} />
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row' },
  pressableOpt: { flex: 1 },
  themeOption: { alignItems: 'center', gap: 4, paddingVertical: 18, paddingHorizontal: 8, borderWidth: 1.5 },
  themeIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  card: { borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  rowActions: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12 },
});
