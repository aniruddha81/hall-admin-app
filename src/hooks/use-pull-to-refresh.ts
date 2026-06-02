import { useCallback, useRef, useState } from 'react';

/** Runs an async refresh action while driving pull-to-refresh UI state. */
export function usePullToRefresh(action: () => void | Promise<unknown>) {
  const actionRef = useRef(action);
  actionRef.current = action;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.resolve(actionRef.current())
      .catch(() => {
        // Errors are surfaced by query hooks / screen state.
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, []);

  return { onRefresh, refreshing };
}

export async function refetchQueries(
  ...refetchers: Array<() => Promise<unknown>>
) {
  await Promise.all(refetchers.map((refetch) => refetch()));
}
