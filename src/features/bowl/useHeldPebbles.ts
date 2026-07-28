import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { requireSupabaseClient } from '../../lib/supabase';
import { getBowlState } from './bowlService';
import type { HeldPebble } from './bowlTypes';

export function useHeldPebbles(pairId: string, isClosed: boolean) {
  const [pebbles, setPebbles] = useState<HeldPebble[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setErrorText(null); setPebbles(await getBowlState(pairId)); }
    catch { setErrorText('load'); }
    finally { setIsLoading(false); }
  }, [pairId]);

  useEffect(() => {
    const client = requireSupabaseClient();
    const timer = setTimeout(() => void refresh(), 0);
    if (isClosed) return () => clearTimeout(timer);
    const channel = client.channel(`bowl:${pairId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pair_pebbles', filter: `pair_id=eq.${pairId}` }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pebbles', filter: `pair_id=eq.${pairId}` }, () => void refresh())
      .subscribe();
    const appState = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { clearTimeout(timer); appState.remove(); void client.removeChannel(channel); };
  }, [isClosed, pairId, refresh]);

  return { pebbles, isLoading, errorText, refresh };
}
