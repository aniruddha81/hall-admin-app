import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type StatusBarOverride = {
  /** Android status bar background; use transparent with translucent for gradient bleed. */
  backgroundColor: string;
  /** Icon/text color for the status bar. */
  style: 'light' | 'dark';
  translucent: boolean;
};

type StatusBarContextValue = {
  override: StatusBarOverride | null;
  setOverride: (value: StatusBarOverride | null) => void;
};

const StatusBarContext = createContext<StatusBarContextValue | null>(null);

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<StatusBarOverride | null>(null);

  const setOverride = useCallback((value: StatusBarOverride | null) => {
    setOverrideState(value);
  }, []);

  const value = useMemo(() => ({ override, setOverride }), [override, setOverride]);

  return <StatusBarContext.Provider value={value}>{children}</StatusBarContext.Provider>;
}

export function useStatusBarOverride() {
  const ctx = useContext(StatusBarContext);
  if (!ctx) {
    throw new Error('useStatusBarOverride must be used within StatusBarProvider');
  }
  return ctx;
}
