import { requireSupabaseClient } from '../../lib/supabase';

export async function closeShore(pairId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc('close_shore', { target_pair_id: pairId });

  if (error) {
    throw error;
  }
}

export async function deletePebbleAccount(): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.functions.invoke('delete-pebble-account');

  if (error) {
    throw error;
  }

  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // The server has already deleted this session's account.
  }
}
