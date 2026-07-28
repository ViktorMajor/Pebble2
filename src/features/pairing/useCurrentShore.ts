import { useCallback, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { getCurrentShore, type CurrentShore } from './pairingService';

export function useCurrentShore(userId: string | null) {
  const [isLoading, setIsLoading] = useState(Boolean(userId) && isSupabaseConfigured);
  const [shore, setShore] = useState<CurrentShore | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setIsLoading(false);
      setShore(null);
      setResolvedUserId(null);
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
      setResolvedUserId(userId);
    }
  }, [userId]);

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
          if (nextStatus === 'closed') {
            setShore(null);
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
    isLoading: Boolean(userId) && (isLoading || resolvedUserId !== userId),
    pairId: shore?.id ?? null,
    status: shore?.status ?? null,
    refresh,
  };
}
