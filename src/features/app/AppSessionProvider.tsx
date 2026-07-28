import { createContext, type ReactNode, useContext } from 'react';

import { useAuthSession } from '../auth/useAuthSession';
import { useCurrentShore } from '../pairing/useCurrentShore';

type AppSessionValue = {
  authErrorText: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  session: ReturnType<typeof useAuthSession>['session'];
  shoreErrorText: string | null;
  shoreId: string | null;
  shoreRefresh: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const shore = useCurrentShore(auth.session?.user.id ?? null);
  const value: AppSessionValue = {
    authErrorText: auth.errorText,
    isLoading: auth.isLoading || shore.isLoading,
    refresh: auth.refresh,
    session: auth.session,
    shoreErrorText: shore.errorText,
    shoreId: shore.pairId,
    shoreRefresh: shore.refresh,
  };
  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const value = useContext(AppSessionContext);
  if (!value) throw new Error('AppSessionProvider is required.');
  return value;
}
