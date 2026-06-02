import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBadge } from '@/components/ui/icon-badge';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import {
  useAdmissionPanelQuery,
  useInvalidateAdmissionQueries,
} from '@/hooks/queries/admission';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import {
  allocateSeat,
  createSeatCharge,
  reviewApplication,
} from '@/lib/services/admission.service';
import {
  SEAT_APPLICATION_STATUSES,
  type Hall,
  type SeatApplication,
  type SeatApplicationStatus,
} from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  APPROVED: '#2563EB',
  REJECTED: '#DC2626',
};

export default function AdmissionsScreen() {
  const { colors, spacing } = useTheme();
  const [statusFilter, setStatusFilter] = useState<SeatApplicationStatus | 'ALL'>('ALL');
  const panelQuery = useAdmissionPanelQuery(statusFilter);
  const invalidateAdmission = useInvalidateAdmissionQueries();
  const applications = panelQuery.data?.applications ?? [];
  const availableRooms = panelQuery.data?.availableRooms ?? [];
  const availableHalls = panelQuery.data?.availableHalls ?? [];
  const loading = panelQuery.isLoading && !panelQuery.data;

  const [chargeAmounts, setChargeAmounts] = useState<Record<string, string>>({});
  const [chargeHalls, setChargeHalls] = useState<Record<string, string>>({});
  const [roomSelections, setRoomSelections] = useState<Record<string, string>>({});

  const reload = async () => {
    await invalidateAdmission();
  };

  const { onRefresh, refreshing } = usePullToRefresh(() => panelQuery.refetch());

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewApplication(id, { status });
      await reload();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const createCharge = async (applicationId: string) => {
    const amount = Number(chargeAmounts[applicationId]);
    const hall = chargeHalls[applicationId] as Hall | undefined;
    if (!amount) {
      Alert.alert('Invalid amount', 'Enter a seat charge amount.');
      return;
    }
    if (!hall) {
      Alert.alert('Select hall', 'Choose a hall with available seats.');
      return;
    }
    try {
      await createSeatCharge(applicationId, { amount, hall });
      await reload();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const allocate = async (applicationId: string) => {
    const roomId = roomSelections[applicationId];
    if (!roomId) {
      Alert.alert('Select room', 'Choose an available room to allocate.');
      return;
    }
    try {
      await allocateSeat({ applicationId, roomId });
      await reload();
      Alert.alert('Allocated', 'Seat allocated successfully.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const roomOptions = availableRooms.map((r) => ({
    id: r.id,
    label: `${r.hall.replace(/_/g, ' ')} — Room ${r.roomNumber} (${r.currentOccupancy}/${r.capacity})`,
  }));

  const filters: Array<SeatApplicationStatus | 'ALL'> = ['ALL', ...SEAT_APPLICATION_STATUSES];

  return (
    <Screen
      title="Seat Allocation"
      subtitle="DSW — review applications & assign seats"
      withBackButton
      loading={loading}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={styles.chipRow}>
        {filters.map((f) => (
          <Chip
            key={f}
            label={f === 'ALL' ? 'All' : f}
            selected={statusFilter === f}
            onPress={() => setStatusFilter(f)}
          />
        ))}
      </View>

      {applications.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="No Applications Found"
          message={
            statusFilter === 'ALL'
              ? 'No seat applications have been submitted yet.'
              : `No ${statusFilter.toLowerCase()} applications at this time.`
          }
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
                  <ThemedText type="smallBold" style={{ color: accent, fontSize: 11 }}>
                    {app.status}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="small" themeColor="textMuted">
                Session {app.session}
                {app.hall ? ` · ${formatLabel(app.hall)}` : ' · Hall pending'}
                {app.seatCharge
                  ? ` · Charge ৳${app.seatCharge.amount} (${app.seatCharge.dueStatus})`
                  : ''}
              </ThemedText>

              {app.status === 'PENDING' ? (
                <View style={[styles.rowActions, { gap: spacing.sm }]}>
                  <Button title="Approve" size="sm" onPress={() => review(app.id, 'APPROVED')} />
                  <Button
                    title="Reject"
                    size="sm"
                    variant="outline"
                    onPress={() => review(app.id, 'REJECTED')}
                  />
                </View>
              ) : null}

              {app.status === 'APPROVED' && !app.seatCharge ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <ThemedText type="smallBold">Hall for charge</ThemedText>
                  <View style={styles.chipRow}>
                    {availableHalls.map((hall) => (
                      <Chip
                        key={hall}
                        label={formatLabel(hall)}
                        selected={chargeHalls[app.id] === hall}
                        onPress={() =>
                          setChargeHalls((p) => ({ ...p, [app.id]: hall }))
                        }
                      />
                    ))}
                  </View>
                  <Input
                    label="Seat charge (৳)"
                    icon="payments"
                    keyboardType="numeric"
                    value={chargeAmounts[app.id] ?? ''}
                    onChangeText={(v) => setChargeAmounts((p) => ({ ...p, [app.id]: v }))}
                  />
                  <Button
                    title="Create charge"
                    size="sm"
                    onPress={() => createCharge(app.id)}
                    disabled={availableHalls.length === 0}
                  />
                </View>
              ) : null}

              {app.canAllocate ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <ThemedText type="smallBold">Available room</ThemedText>
                  <View style={styles.chipRow}>
                    {roomOptions.map((r) => (
                      <Chip
                        key={r.id}
                        label={r.label}
                        selected={roomSelections[app.id] === r.id}
                        onPress={() => setRoomSelections((p) => ({ ...p, [app.id]: r.id }))}
                      />
                    ))}
                  </View>
                  <Button
                    title="Allocate seat"
                    size="sm"
                    onPress={() => allocate(app.id)}
                    disabled={roomOptions.length === 0}
                  />
                </View>
              ) : null}

              {app.roomAllocation ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
                  Allocated · {formatLabel(app.roomAllocation.allocatedByName)}
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
