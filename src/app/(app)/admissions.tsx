import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import {
  allocateSeat,
  createSeatCharge,
  getApplications,
  reviewApplication,
} from '@/lib/services/admission.service';
import { getRooms } from '@/lib/services/inventory.service';
import { SEAT_APPLICATION_STATUSES, type Room, type SeatApplication, type SeatApplicationStatus } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  APPROVED: '#2563EB',
  REJECTED: '#DC2626',
  ALLOCATED: '#16A34A',
};

export default function AdmissionsScreen() {
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const [statusFilter, setStatusFilter] = useState<SeatApplicationStatus | 'ALL'>('ALL');
  const [applications, setApplications] = useState<SeatApplication[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [chargeAmounts, setChargeAmounts] = useState<Record<string, string>>({});
  const [roomSelections, setRoomSelections] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, roomsRes] = await Promise.all([
        getApplications(statusFilter === 'ALL' ? undefined : { status: statusFilter }),
        getRooms(user?.hall ? { hall: user.hall } : undefined),
      ]);
      setApplications(appsRes.data.applications ?? []);
      setRooms((roomsRes.data.rooms ?? []).filter((r) => r.currentOccupancy < r.capacity));
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user?.hall]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewApplication(id, { status });
      await load();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const createCharge = async (applicationId: string) => {
    const amount = Number(chargeAmounts[applicationId]);
    if (!amount) {
      Alert.alert('Invalid amount', 'Enter a seat charge amount.');
      return;
    }
    try {
      await createSeatCharge(applicationId, { amount });
      await load();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const allocate = async (applicationId: string) => {
    const roomId = roomSelections[applicationId];
    if (!roomId) {
      Alert.alert('Select room', 'Choose a room to allocate.');
      return;
    }
    try {
      await allocateSeat({ applicationId, roomId });
      await load();
      Alert.alert('Allocated', 'Seat allocated successfully.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const filters: Array<SeatApplicationStatus | 'ALL'> = ['ALL', ...SEAT_APPLICATION_STATUSES];

  return (
    <Screen title="Admissions" subtitle="Review applications & allocate seats" withBackButton loading={loading}>
      <View style={styles.chipRow}>
        {filters.map((f) => (
          <Chip key={f} label={f === 'ALL' ? 'All' : f} selected={statusFilter === f} onPress={() => setStatusFilter(f)} />
        ))}
      </View>

      {applications.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="No Applications Found"
          message={statusFilter === 'ALL' ? 'No seat applications have been submitted yet.' : `No ${statusFilter.toLowerCase()} applications at this time.`}
        />
      ) : (
        applications.map((app) => {
          const accent = STATUS_COLORS[app.status] ?? colors.primary;
          return (
            <Card key={app.id} style={{ marginBottom: 12 }}>
              <View style={styles.appHead}>
                <IconBadge name="person" color={accent} background={`${accent}1A`} size={44} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                    {app.studentName ?? `Student #${app.studentId}`}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {app.academicDepartment} · {app.rollNumber}
                  </ThemedText>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${accent}1A` }]}>
                  <ThemedText type="smallBold" style={{ color: accent, fontSize: 11 }}>{app.status}</ThemedText>
                </View>
              </View>

              <ThemedText type="small" themeColor="textMuted">
                Session {app.session}
                {app.seatCharge ? ` · Charge ৳${app.seatCharge.amount} (${app.seatCharge.dueStatus})` : ''}
              </ThemedText>

              {app.status === 'PENDING' ? (
                <View style={[styles.rowActions, { gap: spacing.sm }]}>
                  <Button title="Approve" size="sm" onPress={() => review(app.id, 'APPROVED')} />
                  <Button title="Reject" size="sm" variant="outline" onPress={() => review(app.id, 'REJECTED')} />
                </View>
              ) : null}

              {app.status === 'APPROVED' && !app.seatCharge ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <Input
                    label="Seat charge (৳)"
                    icon="payments"
                    keyboardType="numeric"
                    value={chargeAmounts[app.id] ?? ''}
                    onChangeText={(v) => setChargeAmounts((p) => ({ ...p, [app.id]: v }))}
                  />
                  <Button title="Create charge" size="sm" onPress={() => createCharge(app.id)} />
                </View>
              ) : null}

              {app.canAllocate ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <ThemedText type="smallBold">Select room</ThemedText>
                  <View style={styles.chipRow}>
                    {rooms.map((r) => (
                      <Chip
                        key={r.id}
                        label={`Room ${r.roomNumber}`}
                        selected={roomSelections[app.id] === r.id}
                        onPress={() => setRoomSelections((p) => ({ ...p, [app.id]: r.id }))}
                      />
                    ))}
                  </View>
                  <Button title="Allocate seat" size="sm" onPress={() => allocate(app.id)} />
                </View>
              ) : null}

              {app.roomAllocation ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
                  Allocated to room · {formatLabel(app.roomAllocation.allocatedByName)}
                </ThemedText>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  appHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  rowActions: { flexDirection: 'row', marginTop: 8 },
});
