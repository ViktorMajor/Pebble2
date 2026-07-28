import { requireSupabaseClient } from '../../lib/supabase';
import type { HeldPebble } from './bowlTypes';

type BowlStateResponse = { pebbles?: { id: string; visual_seed: number; visual_variant: number; transfer_event_id: string | null; incoming: boolean; touched: boolean }[] };
export type BowlDevelopmentDiagnostics = {
  pairId: string;
  connectionStatus: 'active' | 'closed';
  migrationStatus: 'six' | 'legacy-six-migration-required';
  memberCount: number;
  activeCount: number;
  heldCount: number;
  heldElsewhereCount: number;
  retiredCount: number;
};

export async function getBowlState(pairId: string): Promise<HeldPebble[]> {
  const { data, error } = await requireSupabaseClient().rpc('get_bowl_state', { target_pair_id: pairId });
  if (error) throw error;
  const response = (data ?? {}) as BowlStateResponse;
  return (response.pebbles ?? []).map((pebble) => ({
    id: pebble.id,
    visualSeed: pebble.visual_seed,
    visualVariant: pebble.visual_variant,
    transferEventId: pebble.transfer_event_id,
    incoming: pebble.incoming,
    touched: pebble.touched,
  }));
}

export async function sendHeldPebble(sendRequestKey: string, pairPebbleId: string) {
  const { data, error } = await requireSupabaseClient().rpc('send_pebble', {
    send_request_key: sendRequestKey,
    selected_pair_pebble_id: pairPebbleId,
  });
  if (error) throw error;
  const event = data?.[0];
  if (!event) throw new Error('Pebble transfer did not complete.');
  return { transferEventId: event.transfer_event_id as string, pairId: event.pair_id as string };
}

export async function touchArrival(transferEventId: string) {
  const { error } = await requireSupabaseClient().rpc('touch_pebble', { target_pebble_id: transferEventId });
  if (error) throw error;
}

export async function getBowlDevelopmentDiagnostics(pairId: string): Promise<BowlDevelopmentDiagnostics> {
  const { data, error } = await requireSupabaseClient().rpc('get_bowl_development_diagnostics', { target_pair_id: pairId });
  if (error) throw error;
  const result = data as Record<string, unknown>;
  return {
    pairId: String(result.pair_id),
    connectionStatus: result.connection_status === 'closed' ? 'closed' : 'active',
    migrationStatus: result.migration_status === 'legacy-six-migration-required' ? 'legacy-six-migration-required' : 'six',
    memberCount: Number(result.member_count),
    activeCount: Number(result.active_count),
    heldCount: Number(result.held_count),
    heldElsewhereCount: Number(result.held_elsewhere_count),
    retiredCount: Number(result.retired_count),
  };
}
