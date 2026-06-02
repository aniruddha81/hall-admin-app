import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getExpenses } from '@/lib/services/finance.service';
import type { Expense, Hall } from '@/lib/types';

export function useAdminExpensesQuery(hall?: Hall | null, enabled = true) {
  return useFocusQuery(
    queryKeys.finance.expenses(hall),
    async ({ signal }) => {
      const res = await getExpenses(hall ? { hall } : undefined, { signal });
      return (res.data.expenses ?? []) as Expense[];
    },
    { enabled },
  );
}

export function useInvalidateFinanceQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.finance.all });
}
