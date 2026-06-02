import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getApiErrorMessage, isRequestAborted, runWithAbortSignal } from '@/lib/api';

type LoadFn = (signal: AbortSignal) => Promise<void>;

/**
 * Loads screen data on focus and cancels in-flight work on blur.
 * Ignores stale responses when navigating quickly between screens/tabs.
 */
export function useScreenLoad(loadFn: LoadFn, deps: readonly unknown[]) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadFnRef = useRef(loadFn);
  loadFnRef.current = loadFn;
  const generationRef = useRef(0);

  const runLoad = useCallback(
    async (signal: AbortSignal, generation: number) => {
      setLoading(true);
      setError(null);
      try {
        await runWithAbortSignal(signal, () => loadFnRef.current(signal));
        if (generation !== generationRef.current || signal.aborted) return;
      } catch (err) {
        if (
          generation !== generationRef.current ||
          signal.aborted ||
          isRequestAborted(err)
        ) {
          return;
        }
        setError(getApiErrorMessage(err));
      } finally {
        if (generation === generationRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      const generation = ++generationRef.current;
      void runLoad(controller.signal, generation);
      return () => {
        controller.abort();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls reload deps
    }, deps),
  );

  const reload = useCallback(async () => {
    const generation = ++generationRef.current;
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      await runWithAbortSignal(controller.signal, () =>
        loadFnRef.current(controller.signal),
      );
      if (generation !== generationRef.current) return;
    } catch (err) {
      if (generation !== generationRef.current || isRequestAborted(err)) return;
      setError(getApiErrorMessage(err));
    } finally {
      if (generation === generationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { loading, error, setError, reload, setLoading };
}
