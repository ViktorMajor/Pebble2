import { useCallback, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { getCurrentShore, type CurrentShore } from './pairingService';

export function useCurrentShore(isAuthenticated: boolean) {
  const [isLoading, setIsLoading] = useState(isAuthenticated && isSupabaseConfigured);
  const [shore, setShore] = useState<CurrentShore | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured) {
      setIsLoading(false);
      setShore(null);
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      setShore(await getCurrentShore());
    } catch {
      setErrorText('Could not load shore.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [refresh]);

  useEffect(() => {
    if (!shore || !isSupabaseConfigured) {
      return;
    }

    if (!supabase) {
      return;
    }

    const client = supabase;

    const channel = client
      .channel(`shore-status:${shore.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pairs', filter: `id=eq.${shore.id}` },
        (payload) => {
          const nextStatus = (payload.new as { status?: unknown }).status;
          if (nextStatus === 'active' || nextStatus === 'closed') {
            setShore((current) => (current ? { ...current, status: nextStatus } : current));
          }
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [shore]);

  return {
    errorText,
    isLoading,
    pairId: shore?.id ?? null,
    status: shore?.status ?? null,
    refresh,
  };
}
