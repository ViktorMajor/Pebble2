import { requireSupabaseClient } from '../../lib/supabase';

export const MAX_FOUNDATION_PEBBLES = 96;
export const RECENT_PEBBLE_LIMIT = 24;

export type ShoreMemoryPebble = {
  created_at: string;
  id: string;
  sender_id: string;
  touched: boolean;
};

export type ShoreMemory = {
  foundationDensity: number;
  recentPebbles: ShoreMemoryPebble[];
};

type ShoreMemoryResponse = {
  foundation_density?: unknown;
  recent_pebbles?: unknown;
};

export async function getShoreMemory(pairId: string): Promise<ShoreMemory> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('get_shore_memory', { target_pair_id: pairId });

  if (error) {
    throw error;
  }

  const response = (data ?? {}) as ShoreMemoryResponse;
  const recentPebbles = Array.isArray(response.recent_pebbles) ? (response.recent_pebbles as ShoreMemoryPebble[]) : [];
  const foundationDensity = typeof response.foundation_density === 'number' ? response.foundation_density : 0;

  return {
    foundationDensity: Math.max(0, Math.min(MAX_FOUNDATION_PEBBLES, foundationDensity)),
    recentPebbles,
  };
}
