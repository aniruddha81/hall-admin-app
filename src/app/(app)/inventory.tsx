import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import { getDamageReports, getRooms, markDamageFixed, verifyDamageReport } from '@/lib/services/inventory.service';
import type { DamageReport, Room } from '@/lib/types';

type TabKey = 'complaints' | 'rooms';

export default function InventoryScreen() {
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const [tab, setTab] = useState<TabKey>('complaints');
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [fineAmounts, setFineAmounts] = useState<Record<string, string>>({});
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [responsible, setResponsible] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, roomsRes] = await Promise.all([
        getDamageReports(),
        getRooms(user?.hall ? { hall: user.hall } : undefined),
      ]);
      setReports((reportsRes.data.reports ?? []).filter((r) => r.status !== 'FIXED'));
      setRooms(roomsRes.data.rooms ?? []);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.hall]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const verify = async (report: DamageReport) => {
    const isStudentResponsible = responsible[report.id] ?? true;
    try {
      await verifyDamageReport(report.id, {
        isStudentResponsible,
        fineAmount: isStudentResponsible ? Number(fineAmounts[report.id] ?? 0) : undefined,
        damageCost: !isStudentResponsible ? Number(fineAmounts[report.id] ?? 0) : undefined,
        managerNote: managerNotes[report.id],
      });
      await load();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const markFixed = async (id: string) => {
    try {
      await markDamageFixed(id);
      await load();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  return (
    <Screen title="Inventory" subtitle="Rooms & damage reports" withBackButton loading={loading}>
      <View style={styles.chipRow}>
        <Chip label="Complaints" selected={tab === 'complaints'} onPress={() => setTab('complaints')} />
        <Chip label="Rooms" selected={tab === 'rooms'} onPress={() => setTab('rooms')} />
      </View>

      {tab === 'complaints' ? (
        reports.length === 0 ? (
          <EmptyState icon="check-circle" title="No Open Complaints" message="All damage reports have been resolved." variant="success" />
        ) : (
          reports.map((r) => (
            <Card key={r.id} style={{ marginBottom: 12 }}>
              <View style={styles.reportHead}>
                <IconBadge name="report-problem" color={colors.warning} background={`${colors.warning}1A`} size={44} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>{r.reporterName ?? 'Report'}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted" numberOfLines={2}>{r.description}</ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ color: colors.warning }}>{r.status}</ThemedText>
              </View>
              {r.locationDescription ? (
                <ThemedText type="small" themeColor="textMuted">{r.locationDescription}</ThemedText>
              ) : null}
              {r.imageUrl ? (
                <Button title="View image" size="sm" variant="ghost" onPress={() => Linking.openURL(r.imageUrl!)} style={{ alignSelf: 'flex-start' }} />
              ) : null}

              {r.status === 'REPORTED' ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <ThemedText type="smallBold">Responsibility</ThemedText>
                  <View style={styles.chipRow}>
                    <Chip label="Student fine" selected={(responsible[r.id] ?? true) === true} onPress={() => setResponsible((p) => ({ ...p, [r.id]: true }))} />
                    <Chip label="Manager cost" selected={responsible[r.id] === false} onPress={() => setResponsible((p) => ({ ...p, [r.id]: false }))} />
                  </View>
                  <Input label="Amount (৳)" icon="payments" keyboardType="numeric" value={fineAmounts[r.id] ?? ''} onChangeText={(v) => setFineAmounts((p) => ({ ...p, [r.id]: v }))} />
                  <Input label="Manager note" icon="note" value={managerNotes[r.id] ?? ''} onChangeText={(v) => setManagerNotes((p) => ({ ...p, [r.id]: v }))} />
                  <Button title="Verify complaint" size="sm" onPress={() => verify(r)} />
                </View>
              ) : null}

              {r.status === 'VERIFIED' ? (
                <Button title="Mark fixed" size="sm" onPress={() => markFixed(r.id)} style={{ marginTop: 8 }} />
              ) : null}
            </Card>
          ))
        )
      ) : (
        <>
          <SectionHeader title="Rooms" caption="Hall room occupancy overview" />
          {rooms.length === 0 ? (
            <EmptyState icon="meeting-room" title="No Rooms Found" message="No room records are available for your hall." />
          ) : (
            rooms.map((room) => (
              <ListRow
                key={room.id}
                icon="meeting-room"
                accent={colors.primary}
                title={`Room ${room.roomNumber}`}
                subtitle={`${formatLabel(room.hall)} · ${room.currentOccupancy}/${room.capacity}`}
                trailingText={room.roomStatus}
              />
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
