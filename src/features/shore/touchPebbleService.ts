import { requireSupabaseClient } from '../../lib/supabase';

export async function touchPebble(pebbleId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc('touch_pebble', {
    target_pebble_id: pebbleId,
  });

  if (error) {
    throw error;
  }
}
