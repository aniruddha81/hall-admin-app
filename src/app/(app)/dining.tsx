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
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/theme';
import {
  useAdminDiningPanelQuery,
  useInvalidateDiningQueries,
} from '@/hooks/queries/dining';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import {
  createMealItem,
  createTomorrowMenu,
  deleteMealItem,
  deleteTomorrowMenu,
  markTokensAsConsumed,
  updateMealItem,
} from '@/lib/services/dining.service';
import { MEAL_TYPES, type MealItem, type MealMenu, type MealToken, type MealType } from '@/lib/types';

type TabKey = 'tomorrow' | 'today' | 'bookings' | 'items';

export default function DiningScreen() {
  const { colors, spacing, radius } = useTheme();
  const [tab, setTab] = useState<TabKey>('tomorrow');
  const panelQuery = useAdminDiningPanelQuery();
  const invalidateDining = useInvalidateDiningQueries();
  const tomorrowMenus = panelQuery.data?.tomorrowMenus ?? [];
  const todayMenus = panelQuery.data?.todayMenus ?? [];
  const bookings = panelQuery.data?.bookings ?? [];
  const items = panelQuery.data?.items ?? [];
  const loading = panelQuery.isLoading && !panelQuery.data;

  const [itemName, setItemName] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [totalTokens, setTotalTokens] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    await invalidateDining();
  };

  const { onRefresh, refreshing } = usePullToRefresh(() => panelQuery.refetch());

  const addItem = async () => {
    if (!itemName.trim()) return;
    setSaving(true);
    try {
      await createMealItem({ name: itemName.trim() });
      setItemName('');
      await reload();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleItemActive = async (item: MealItem) => {
    try {
      await updateMealItem(item.id, { isActive: !Boolean(item.isActive) });
      await reload();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const removeItem = async (id: string) => {
    Alert.alert('Delete item', 'Remove this meal item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealItem(id);
            await reload();
          } catch (err) {
            Alert.alert('Error', getApiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const createMenu = async () => {
    if (!selectedItems.length || !price || !totalTokens) {
      Alert.alert('Missing fields', 'Select items, price, and token count.');
      return;
    }
    setSaving(true);
    try {
      await createTomorrowMenu({
        mealType,
        mealItemIds: selectedItems,
        price: Number(price),
        totalTokens: Number(totalTokens),
      });
      setPrice('');
      setTotalTokens('');
      setSelectedItems([]);
      await reload();
      Alert.alert('Created', 'Tomorrow menu created.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeMenu = async (menuId: string) => {
    Alert.alert('Delete menu', 'Remove this menu?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTomorrowMenu(menuId);
            await reload();
          } catch (err) {
            Alert.alert('Error', getApiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const consumeActive = async () => {
    const ids = bookings.filter((b) => b.status === 'ACTIVE').map((b) => b.id);
    if (!ids.length) {
      Alert.alert('No tokens', 'No active tokens to mark consumed.');
      return;
    }
    try {
      await markTokensAsConsumed({ tokenIds: ids });
      await reload();
      Alert.alert('Done', `${ids.length} token(s) marked consumed.`);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'today', label: 'Today' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'items', label: 'Items' },
  ];

  const renderMenuCard = (m: MealMenu, isDinner = false, onDelete?: () => void) => {
    const accent = isDinner ? colors.secondary : colors.primary;
    const tint = `${accent}1A`;
    return (
      <Card key={m.id} style={styles.menuCard}>
        <View style={styles.menuHead}>
          <IconBadge name={isDinner ? 'dinner-dining' : 'lunch-dining'} color={accent} background={tint} size={44} />
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 16 }}>
              {formatLabel(m.hall)} · {formatLabel(m.mealType)}
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted" numberOfLines={2}>{m.menuDescription}</ThemedText>
          </View>
          <View style={[styles.priceTag, { backgroundColor: tint, borderRadius: radius.full }]}>
            <ThemedText type="smallBold" style={{ color: accent }}>৳{m.price}</ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textMuted">
          {m.availableTokens} of {m.totalTokens} tokens available
        </ThemedText>
        {onDelete ? <Button title="Delete menu" size="sm" variant="outline" onPress={onDelete} style={{ marginTop: 8 }} /> : null}
      </Card>
    );
  };

  return (
    <Screen
      title="Dining"
      subtitle="Manage menus, items & bookings"
      withBackButton
      loading={loading}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {panelQuery.error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>{panelQuery.error}</ThemedText>
        </View>
      ) : null}

      <View style={styles.chipRow}>
        {tabs.map((t) => (
          <Chip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>

      {tab === 'tomorrow' ? (
        <>
          <SectionHeader title="Create Tomorrow Menu" caption="Build the next day's dining schedule" />
          <Card variant="tinted" style={{ paddingVertical: 16 }}>
            <View style={{ gap: spacing.sm }}>
              <ThemedText type="overline">Meal type</ThemedText>
              <View style={styles.chipRow}>
                {MEAL_TYPES.map((m) => (
                  <Chip key={m} label={m} selected={mealType === m} onPress={() => setMealType(m)} />
                ))}
              </View>
              <ThemedText type="overline">Meal items</ThemedText>
              <View style={styles.chipRow}>
                {items.filter((i) => Boolean(i.isActive)).map((i) => (
                  <Chip
                    key={i.id}
                    label={i.name}
                    selected={selectedItems.includes(i.id)}
                    onPress={() =>
                      setSelectedItems((prev) =>
                        prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id],
                      )
                    }
                  />
                ))}
              </View>
              <Input label="Price (৳)" icon="payments" keyboardType="numeric" value={price} onChangeText={setPrice} />
              <Input label="Total tokens" icon="confirmation-number" keyboardType="numeric" value={totalTokens} onChangeText={setTotalTokens} />
              <Button title="Create menu" loading={saving} onPress={createMenu} />
            </View>
          </Card>

          <SectionHeader title="Tomorrow Menus" />
          {tomorrowMenus.length === 0 ? (
            <EmptyState icon="restaurant-menu" title="No Menus Posted" message="Create tomorrow's menu above to open token booking for students." />
          ) : (
            <View style={{ gap: spacing.md }}>
              {tomorrowMenus.map((m) => renderMenuCard(m, m.mealType === 'DINNER', () => removeMenu(m.id)))}
            </View>
          )}
        </>
      ) : null}

      {tab === 'today' ? (
        <>
          <SectionHeader title="Today's Menus" />
          {todayMenus.length === 0 ? (
            <EmptyState icon="restaurant" title="No Menus Today" message="No active menus are scheduled for today." />
          ) : (
            <View style={{ gap: spacing.md }}>
              {todayMenus.map((m) => renderMenuCard(m, m.mealType === 'DINNER'))}
            </View>
          )}
        </>
      ) : null}

      {tab === 'bookings' ? (
        <>
          <SectionHeader title="Tomorrow Bookings" caption="Active meal token reservations" />
          <Button title="Mark all active consumed" onPress={consumeActive} />
          {bookings.length === 0 ? (
            <EmptyState icon="confirmation-number" title="No Bookings" message="No students have booked meal tokens for tomorrow yet." />
          ) : (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {bookings.map((b) => (
                <Card key={b.id} style={{ padding: 12 }}>
                  <View style={styles.menuHead}>
                    <IconBadge name="confirmation-number" color={colors.primary} background={`${colors.primary}1A`} size={40} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="subtitle" style={{ fontSize: 15 }}>
                        {formatLabel(b.hall)} · {formatLabel(b.mealType)}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textMuted">
                        {b.mealDate} · Qty {b.quantity} · {b.status}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={{ color: colors.secondary }}>৳{b.totalAmount}</ThemedText>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : null}

      {tab === 'items' ? (
        <>
          <SectionHeader title="Meal Items" caption="Manage the kitchen item catalog" />
          <Card variant="tinted" style={{ paddingVertical: 16 }}>
            <View style={{ gap: spacing.sm }}>
              <Input label="New item name" icon="restaurant-menu" value={itemName} onChangeText={setItemName} />
              <Button title="Add item" loading={saving} onPress={addItem} />
            </View>
          </Card>
          {items.length === 0 ? (
            <EmptyState icon="fastfood" title="No Meal Items" message="Add meal items above to build tomorrow's menus." />
          ) : (
            items.map((i) => (
              <Card key={i.id} style={{ padding: 12 }}>
                <ListRow icon="fastfood" accent={Boolean(i.isActive) ? colors.success : colors.textMuted} title={i.name} subtitle={Boolean(i.isActive) ? 'Active' : 'Inactive'} />
                <View style={[styles.rowActions, { gap: spacing.sm }]}>
                  <Button title={Boolean(i.isActive) ? 'Deactivate' : 'Activate'} size="sm" variant="outline" onPress={() => toggleItemActive(i)} />
                  <Button title="Delete" size="sm" variant="ghost" onPress={() => removeItem(i.id)} />
                </View>
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuCard: { paddingVertical: 18 },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceTag: { paddingHorizontal: 12, paddingVertical: 6 },
  rowActions: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4 },
  errorBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
});
