import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
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
import {
  useAdminExpensesQuery,
  useInvalidateFinanceQueries,
} from '@/hooks/queries/finance';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import {
  createDue,
  createExpense,
  getStudentLedger,
  payDue,
  verifyMealPaymentReceipt,
  verifyPaymentReceipt,
} from '@/lib/services/finance.service';
import { DUE_TYPES, type DueType, type Expense, type FinancePaymentMethod, type StudentLedger } from '@/lib/types';

type TabKey = 'dues' | 'expenses' | 'ledger';

export default function FinanceScreen() {
  const { user } = useAuth();
  const { colors, spacing, radius, typography } = useTheme();
  const [tab, setTab] = useState<TabKey>('dues');
  const expensesQuery = useAdminExpensesQuery(user?.hall, tab === 'expenses');
  const invalidateFinance = useInvalidateFinanceQueries();
  const expenses = expensesQuery.data ?? [];
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [dueRollNumber, setDueRollNumber] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [dueType, setDueType] = useState<DueType>('RENT');
  const [payDueId, setPayDueId] = useState('');
  const [payMethod, setPayMethod] = useState<FinancePaymentMethod>('CASH');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesLoading = expensesQuery.isLoading && !expensesQuery.data;

  const { onRefresh, refreshing } = usePullToRefresh(async () => {
    if (tab === 'expenses') {
      await expensesQuery.refetch();
    } else if (tab === 'ledger' && rollNumber.trim()) {
      await lookupLedger();
    }
  });

  const pickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  };

  const submitDue = async () => {
    if (!dueRollNumber || !dueAmount || !user?.hall) return;
    setSaving(true);
    try {
      await createDue({
        rollNumber: dueRollNumber.trim(),
        hall: user.hall,
        dueType,
        amount: Number(dueAmount),
      });
      setDueRollNumber('');
      setDueAmount('');
      Alert.alert('Created', 'Due created successfully.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async () => {
    if (!payDueId) return;
    setSaving(true);
    try {
      await payDue(payDueId.trim(), { method: payMethod, receiptImageUri: receiptUri });
      setPayDueId('');
      setReceiptUri(null);
      Alert.alert('Recorded', 'Payment recorded.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitExpense = async () => {
    if (!expenseTitle || !expenseAmount || !expenseCategory || !user?.hall) return;
    setSaving(true);
    try {
      await createExpense({
        hall: user.hall,
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory.trim(),
      });
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseCategory('');
      await invalidateFinance();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const lookupLedger = async () => {
    if (!rollNumber.trim()) return;
    setLoading(true);
    try {
      const res = await getStudentLedger(rollNumber.trim());
      setLedger(res.data);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      if (tab === 'ledger') {
        setLoading(false);
      }
    }
  };

  const verifyReceipt = async (id: string, type: 'due' | 'meal') => {
    try {
      if (type === 'due') await verifyPaymentReceipt(id);
      else await verifyMealPaymentReceipt(id);
      await lookupLedger();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const header = (
    <GradientHeader extraBottom={36}>
      <ThemedText type="overline" style={styles.headerOverline}>
        Finance Panel
      </ThemedText>
      <View style={styles.balanceRow}>
        <ThemedText style={[styles.balance, { fontFamily: typography.fonts.mono }]}>
          ৳{tab === 'expenses' ? totalExpenses : ledger?.summary?.totalDue ?? 0}
        </ThemedText>
        <View style={[styles.balanceBadge, { borderRadius: radius.full }]}>
          <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
            {tab === 'dues' ? 'Dues & Payments' : tab === 'expenses' ? `${expenses.length} Expenses` : 'Student Ledger'}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={styles.headerCaption}>
        Manage hall dues, record payments, and track expenses
      </ThemedText>
    </GradientHeader>
  );

  return (
    <Screen
      header={header}
      overlap={24}
      withBackButton
      loading={(tab === 'expenses' && expensesLoading) || (tab === 'ledger' && loading)}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={styles.chipRow}>
        <Chip label="Dues" selected={tab === 'dues'} onPress={() => setTab('dues')} />
        <Chip label="Expenses" selected={tab === 'expenses'} onPress={() => setTab('expenses')} />
        <Chip label="Ledger" selected={tab === 'ledger'} onPress={() => setTab('ledger')} />
      </View>

      {tab === 'dues' ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Create Due" caption="Assign a new charge to a student" />
          <Card variant="tinted" style={{ paddingVertical: 16 }}>
            <View style={{ gap: spacing.sm }}>
              <Input label="Roll number" icon="person" placeholder="e.g. 240001" value={dueRollNumber} onChangeText={setDueRollNumber} />
              <ThemedText type="overline">Due type</ThemedText>
              <View style={styles.chipRow}>
                {DUE_TYPES.map((t) => (
                  <Chip key={t} label={t} selected={dueType === t} onPress={() => setDueType(t)} />
                ))}
              </View>
              <Input label="Amount (৳)" icon="payments" keyboardType="numeric" value={dueAmount} onChangeText={setDueAmount} />
              <Button title="Create due" loading={saving} onPress={submitDue} />
            </View>
          </Card>

          <SectionHeader title="Record Payment" caption="Log cash, bank, or online payment" />
          <Card variant="tinted" style={{ paddingVertical: 16 }}>
            <View style={{ gap: spacing.sm }}>
              <Input label="Due ID" icon="receipt" value={payDueId} onChangeText={setPayDueId} />
              <ThemedText type="overline">Method</ThemedText>
              <View style={styles.chipRow}>
                {(['CASH', 'BANK', 'ONLINE'] as FinancePaymentMethod[]).map((m) => (
                  <Chip key={m} label={m} selected={payMethod === m} onPress={() => setPayMethod(m)} />
                ))}
              </View>
              {payMethod === 'BANK' ? (
                <Button title={receiptUri ? 'Receipt selected ✓' : 'Attach bank receipt'} variant="outline" onPress={pickReceipt} />
              ) : null}
              <Button title="Record payment" loading={saving} onPress={submitPayment} />
            </View>
          </Card>
        </View>
      ) : null}

      {tab === 'expenses' ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="New Expense" caption="Log hall operational spending" />
          <Card variant="tinted" style={{ paddingVertical: 16 }}>
            <View style={{ gap: spacing.sm }}>
              <Input label="Title" icon="title" value={expenseTitle} onChangeText={setExpenseTitle} />
              <Input label="Amount (৳)" icon="payments" keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
              <Input label="Category" icon="category" value={expenseCategory} onChangeText={setExpenseCategory} />
              <Button title="Add expense" loading={saving} onPress={submitExpense} />
            </View>
          </Card>

          <SectionHeader title="Recent Expenses" />
          {expenses.length === 0 ? (
            <EmptyState icon="receipt-long" title="No Expenses Recorded" message="Add hall expenses above to track operational spending." />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {expenses.map((e) => (
                <Card key={e.id} style={{ paddingVertical: 14 }}>
                  <View style={styles.dueHead}>
                    <IconBadge name="receipt-long" color={colors.primary} background={`${colors.primary}1A`} size={44} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="subtitle" style={{ fontSize: 16 }}>{e.title}</ThemedText>
                      <ThemedText type="small" themeColor="textMuted">{e.category}</ThemedText>
                    </View>
                    <ThemedText type="subtitle" style={{ color: colors.primary, fontFamily: typography.fonts.mono }}>
                      ৳{e.amount}
                    </ThemedText>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {tab === 'ledger' ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Student Lookup" caption="Search dues and payment history" />
          <Input label="Roll number" icon="person" placeholder="e.g. 240001" value={rollNumber} onChangeText={setRollNumber} />
          <Button title="Lookup ledger" onPress={lookupLedger} />
          {!ledger ? (
            <EmptyState icon="search" title="No Ledger Loaded" message="Enter a roll number and tap lookup to view their financial record." />
          ) : (
            <>
              <Card variant="tinted">
                <ThemedText type="subtitle">{ledger.student?.name ?? 'Student ledger'}</ThemedText>
                {ledger.summary ? (
                  <ThemedText type="small" themeColor="textMuted">
                    Due ৳{ledger.summary.totalDue} · Paid ৳{ledger.summary.totalPaid}
                  </ThemedText>
                ) : null}
              </Card>

              <SectionHeader title="Dues" />
              {ledger.dues.length === 0 ? (
                <EmptyState icon="account-balance-wallet" title="No Dues" message="This student has no recorded dues." variant="success" />
              ) : (
                ledger.dues.map((d) => (
                  <ListRow key={d.id} icon="account-balance-wallet" accent={colors.warning} title={formatLabel(d.dueType)} subtitle={d.dueStatus} trailingText={`৳${d.amount}`} />
                ))
              )}

              <SectionHeader title="Payments" />
              {ledger.payments.length === 0 ? (
                <EmptyState icon="payments" title="No Payments" message="No payment records for this student." />
              ) : (
                ledger.payments.map((p) => (
                  <Card key={p.id} style={{ padding: 12 }}>
                    <ListRow icon="payments" accent={colors.success} title={p.method} subtitle={p.receiptVerifiedAt ? 'Verified' : 'Unverified'} trailingText={`৳${p.amount}`} />
                    {p.bankReceiptUrl ? (
                      <Button title="View receipt" size="sm" variant="ghost" onPress={() => Linking.openURL(p.bankReceiptUrl!)} style={{ marginLeft: 12 }} />
                    ) : null}
                    {p.method === 'BANK' && !p.receiptVerifiedAt ? (
                      <Button title="Verify receipt" size="sm" onPress={() => verifyReceipt(p.id, 'due')} style={{ margin: 12 }} />
                    ) : null}
                  </Card>
                ))
              )}

              <SectionHeader title="Meal Payments" />
              {ledger.mealPayments.length === 0 ? (
                <EmptyState icon="restaurant" title="No Meal Payments" message="No meal payment records for this student." />
              ) : (
                ledger.mealPayments.map((p) => (
                  <Card key={p.id} style={{ padding: 12 }}>
                    <ListRow icon="restaurant" accent={colors.secondary} title={p.paymentMethod} subtitle={p.receiptVerifiedAt ? 'Verified' : 'Unverified'} trailingText={`৳${p.amount}`} />
                    {p.paymentMethod === 'BANK' && !p.receiptVerifiedAt ? (
                      <Button title="Verify receipt" size="sm" onPress={() => verifyReceipt(p.id, 'meal')} style={{ margin: 12 }} />
                    ) : null}
                  </Card>
                ))
              )}
            </>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerOverline: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerCaption: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balance: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', lineHeight: 42, letterSpacing: -1 },
  balanceBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
