import type { Hall, SeatApplicationStatus } from '@/lib/types';

export const queryKeys = {
  dining: {
    all: ['dining'] as const,
    tomorrowMenus: () => [...queryKeys.dining.all, 'tomorrow-menus'] as const,
    todayMenus: () => [...queryKeys.dining.all, 'today-menus'] as const,
    tomorrowBookings: () => [...queryKeys.dining.all, 'tomorrow-bookings'] as const,
    mealItems: () => [...queryKeys.dining.all, 'meal-items'] as const,
  },
  admission: {
    all: ['admission'] as const,
    applications: (status?: SeatApplicationStatus | 'ALL') =>
      [...queryKeys.admission.all, 'applications', status ?? 'ALL'] as const,
    availableRooms: () => [...queryKeys.admission.all, 'available-rooms'] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    damageReports: () => [...queryKeys.inventory.all, 'damage-reports'] as const,
    rooms: (hall?: Hall | null) => [...queryKeys.inventory.all, 'rooms', hall ?? 'all'] as const,
  },
  finance: {
    all: ['finance'] as const,
    expenses: (hall?: Hall | null) =>
      [...queryKeys.finance.all, 'expenses', hall ?? 'all'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (limit: number) => [...queryKeys.notifications.all, 'list', limit] as const,
  },
};
