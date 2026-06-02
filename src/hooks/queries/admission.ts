import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getApplications, getAvailableRooms } from '@/lib/services/admission.service';
import type { Hall, SeatApplication, SeatApplicationStatus } from '@/lib/types';

type AvailableRoom = {
  id: string;
  roomNumber: number;
  hall: Hall;
  capacity: number;
  currentOccupancy: number;
};

export type AdmissionPanelData = {
  applications: SeatApplication[];
  availableRooms: AvailableRoom[];
  availableHalls: Hall[];
};

export function useAdmissionPanelQuery(statusFilter: SeatApplicationStatus | 'ALL') {
  return useFocusQuery(
    queryKeys.admission.applications(statusFilter),
    async ({ signal }): Promise<AdmissionPanelData> => {
      const fetchOpts = { signal };
      const [appsRes, roomsRes] = await Promise.all([
        getApplications(
          statusFilter === 'ALL' ? undefined : { status: statusFilter },
          fetchOpts,
        ),
        getAvailableRooms(undefined, fetchOpts),
      ]);
      const rooms = (roomsRes.data?.rooms ?? []) as AvailableRoom[];
      return {
        applications: appsRes.data.applications ?? [],
        availableRooms: rooms,
        availableHalls: (roomsRes.data?.halls ?? []) as Hall[],
      };
    },
  );
}

export function usePendingApplicationsQuery(enabled = true) {
  return useFocusQuery(
    queryKeys.admission.applications('PENDING'),
    async ({ signal }) => {
      const res = await getApplications({ status: 'PENDING' }, { signal });
      return res.data.applications ?? [];
    },
    { enabled },
  );
}

export function useInvalidateAdmissionQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.admission.all });
}
