import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { requireSupabaseClient } from '../../lib/supabase';
import { getShoreMemory, MAX_FOUNDATION_PEBBLES, RECENT_PEBBLE_LIMIT } from './shoreMemoryService';
import type { ShorePebble } from './shoreTypes';

type PebbleRow = {
  id: string;
  sender_id: string;
  touched: boolean;
  created_at: string;
};

type ShorePebblesState = {
  errorText: string | null;
  foundationDensity: number;
  isLoading: boolean;
  pebbles: ShorePebble[];
};

function toShorePebble(row: PebbleRow, currentUserId: string): ShorePebble {
  return {
    id: row.id,
    createdAt: row.created_at,
    origin: row.sender_id === currentUserId ? 'self' : 'other',
    touched: row.touched,
  };
}

function mergePebble(current: ShorePebble[], next: ShorePebble): ShorePebble[] {
  const existingIndex = current.findIndex((pebble) => pebble.id === next.id);

  if (existingIndex === -1) {
    return [...current, next]
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .slice(0, RECENT_PEBBLE_LIMIT);
  }

  const updated = [...current];
  const existing = updated[existingIndex];
  updated[existingIndex] = existing.touched && !next.touched ? existing : next;
  return updated.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export function useShorePebbles(pairId: string, currentUserId: string, isClosed: boolean) {
  const [state, setState] = useState<ShorePebblesState>({
    errorText: null,
    foundationDensity: 0,
    isLoading: true,
    pebbles: [],
  });
  const [isAppActive, setIsAppActive] = useState(AppState.currentState !== 'background');

  const loadPebbles = useCallback(async () => {
    try {
      const memory = await getShoreMemory(pairId);
      const fetchedPebbles = memory.recentPebbles.map((pebble) => toShorePebble(pebble, currentUserId));
      setState((current) => ({
        errorText: null,
        foundationDensity: memory.foundationDensity,
        isLoading: false,
        pebbles: fetchedPebbles.reduce(mergePebble, current.pebbles),
      }));
    } catch {
      setState((current) => ({
        ...current,
        errorText: 'Could not load shore.',
        isLoading: false,
      }));
      return;
    }
  }, [currentUserId, pairId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsAppActive(nextAppState === 'active');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isAppActive) {
      return;
    }

    const client = requireSupabaseClient();
    const initialLoad = setTimeout(() => {
      void loadPebbles();
    }, 0);

    if (isClosed) {
      return () => {
        clearTimeout(initialLoad);
      };
    }

    const channel = client
      .channel(`shore-pebbles:${pairId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pebbles', filter: `pair_id=eq.${pairId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            return;
          }

          const pebble = toShorePebble(payload.new as PebbleRow, currentUserId);
          setState((current) => ({
            ...current,
            errorText: null,
            foundationDensity:
              current.pebbles.some((existing) => existing.id === pebble.id) || current.pebbles.length < RECENT_PEBBLE_LIMIT
                ? current.foundationDensity
                : Math.min(MAX_FOUNDATION_PEBBLES, current.foundationDensity + 1),
            pebbles: mergePebble(current.pebbles, pebble),
          }));
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void loadPebbles();
        }
      });

    return () => {
      clearTimeout(initialLoad);
      void client.removeChannel(channel);
    };
  }, [currentUserId, isAppActive, isClosed, loadPebbles, pairId]);

  return {
    ...state,
    refresh: loadPebbles,
  };
}
