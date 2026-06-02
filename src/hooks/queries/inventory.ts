import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getDamageReports, getRooms } from '@/lib/services/inventory.service';
import type { DamageReport, Hall, Room } from '@/lib/types';

export function useInventoryPanelQuery(hall?: Hall | null) {
  return useFocusQuery(
    queryKeys.inventory.rooms(hall),
    async ({ signal }) => {
      const fetchOpts = { signal };
      const [reportsRes, roomsRes] = await Promise.all([
        getDamageReports(undefined, fetchOpts),
        getRooms(hall ? { hall } : undefined, fetchOpts),
      ]);
      return {
        reports: ((reportsRes.data.reports ?? []) as DamageReport[]).filter(
          (r) => r.status !== 'FIXED',
        ),
        rooms: (roomsRes.data.rooms ?? []) as Room[],
      };
    },
  );
}

export function useInvalidateInventoryQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.inventory.all });
}
