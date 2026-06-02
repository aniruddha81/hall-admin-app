import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import {
  getMealItems,
  getTodayMenus,
  getTomorrowBookings,
  getTomorrowMenusList,
} from '@/lib/services/dining.service';

export function useAdminDiningPanelQuery() {
  return useFocusQuery(queryKeys.dining.all, async ({ signal }) => {
    const fetchOpts = { signal };
    const [tomorrow, today, bookingRes, itemRes] = await Promise.all([
      getTomorrowMenusList(fetchOpts),
      getTodayMenus(fetchOpts),
      getTomorrowBookings(fetchOpts),
      getMealItems(fetchOpts),
    ]);
    return {
      tomorrowMenus: tomorrow.data.menus,
      todayMenus: today.data.menus,
      bookings: bookingRes.data.bookings ?? [],
      items: itemRes.data.items ?? [],
    };
  });
}

export function useAdminTodayMenusQuery(enabled = true) {
  return useFocusQuery(
    queryKeys.dining.todayMenus(),
    ({ signal }) => getTodayMenus({ signal }),
    { enabled },
  );
}

export function useAdminTomorrowMenusQuery(enabled = true) {
  return useFocusQuery(
    queryKeys.dining.tomorrowMenus(),
    ({ signal }) => getTomorrowMenusList({ signal }),
    { enabled },
  );
}

export function useInvalidateDiningQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.dining.all });
}
