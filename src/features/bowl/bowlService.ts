import { requireSupabaseClient } from '../../lib/supabase';
import type { HeldPebble } from './bowlTypes';

type BowlStateResponse = { pebbles?: { id: string; visual_seed: number; transfer_event_id: string | null; incoming: boolean; touched: boolean }[] };

export async function getBowlState(pairId: string): Promise<HeldPebble[]> {
  const { data, error } = await requireSupabaseClient().rpc('get_bowl_state', { target_pair_id: pairId });
  if (error) throw error;
  const response = (data ?? {}) as BowlStateResponse;
  return (response.pebbles ?? []).map((pebble) => ({
    id: pebble.id,
    visualSeed: pebble.visual_seed,
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
