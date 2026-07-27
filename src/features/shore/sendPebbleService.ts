import { requireSupabaseClient } from '../../lib/supabase';

export type SentPebble = {
  id: string;
  pairId: string;
  createdAt: string;
};

export function createSendRequestKey() {
  const maybeCrypto = globalThis as {
    crypto?: {
      getRandomValues?: (values: Uint8Array) => Uint8Array;
      randomUUID?: () => string;
    };
  };

  const randomUUID = maybeCrypto.crypto?.randomUUID;

  if (randomUUID) {
    return randomUUID();
  }

  const randomBytes = maybeCrypto.crypto?.getRandomValues?.(new Uint8Array(16));
  if (!randomBytes) {
    throw new Error('Secure randomness is unavailable.');
  }

  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sendPebble(sendRequestKey: string): Promise<SentPebble> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('send_pebble', {
    send_request_key: sendRequestKey,
  });

  if (error) {
    throw error;
  }

  const sentPebble = data?.[0];

  if (!sentPebble) {
    throw new Error('Could not send pebble.');
  }

  return {
    id: sentPebble.pebble_id,
    pairId: sentPebble.pair_id,
    createdAt: sentPebble.created_at,
  };
}
