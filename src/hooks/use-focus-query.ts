import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getApiErrorMessage, isRequestAborted } from '@/lib/api';

type QueryFnContext = { signal: AbortSignal };

type FocusQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

function getDisplayError<T>(query: UseQueryResult<T, Error>): string | null {
  if (!query.error) return null;
  if (isRequestAborted(query.error)) return null;
  if (query.data !== undefined) return null;
  const message = getApiErrorMessage(query.error);
  return message || null;
}

/**
 * Cached screen query. Relies on staleTime — does not refetch on every tab focus,
 * which avoids abort races when switching bottom tabs quickly.
 */
export function useFocusQuery<T>(
  queryKey: QueryKey,
  queryFn: (ctx: QueryFnContext) => Promise<T>,
  options?: FocusQueryOptions<T>,
) {
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn({ signal }),
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => !isRequestAborted(error) && failureCount < 1,
    ...options,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && query.data === undefined,
    isFetching: query.isFetching,
    error: getDisplayError(query),
    refetch: query.refetch,
  };
}
