import { QueryClient } from '@tanstack/react-query';

import { isRequestAborted } from '@/lib/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) =>
        !isRequestAborted(error) && failureCount < 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
