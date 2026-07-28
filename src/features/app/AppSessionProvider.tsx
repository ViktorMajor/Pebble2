import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuthSession } from '../auth/useAuthSession';
import { useActiveConnection } from '../pairing/useActiveConnection';
import { loadSoundPreference, setSoundLifecycleActive } from '../sound/bowlSoundService';

type AppSessionValue = {
  authErrorText: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  session: ReturnType<typeof useAuthSession>['session'];
  connectionErrorText: string | null;
  connectionId: string | null;
  connectionComplete: boolean;
  connectionRefresh: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const connection = useActiveConnection(auth.session?.user.id ?? null);
  useEffect(()=>{void loadSoundPreference();const subscription=AppState.addEventListener('change',(state)=>void setSoundLifecycleActive(state==='active'));return()=>subscription.remove();},[]);
  const value: AppSessionValue = {
    authErrorText: auth.errorText,
    isLoading: auth.isLoading || connection.isLoading,
    refresh: auth.refresh,
    session: auth.session,
    connectionErrorText: connection.errorText,
    connectionId: connection.pairId,
    connectionComplete: connection.isComplete,
    connectionRefresh: connection.refresh,
  };
  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const value = useContext(AppSessionContext);
  if (!value) throw new Error('AppSessionProvider is required.');
  return value;
}
