import { requireSupabaseClient } from '../../lib/supabase';

type PushPlatform = 'android' | 'ios';

export async function registerDevicePushToken(
  userId: string,
  expoPushToken: string,
  platform: PushPlatform,
): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from('device_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) {
    throw error;
  }
}

export async function deleteDevicePushToken(expoPushToken: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from('device_push_tokens').delete().eq('expo_push_token', expoPushToken);

  if (error) {
    throw error;
  }
}

export async function requestPebblePushDelivery(pebbleId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.functions.invoke('deliver-pebble-push', {
    body: { pebbleId },
  });

  if (error) {
    throw error;
  }
}
