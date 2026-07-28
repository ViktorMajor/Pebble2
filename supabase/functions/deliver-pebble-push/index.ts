import { createClient } from 'npm:@supabase/supabase-js@2';

type ExpoPushTicket = {
  details?: { error?: string };
  status: 'ok' | 'error';
};

type PushToken = {
  expo_push_token: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Supabase Edge Function environment is incomplete.');
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return json({ error: 'Authentication required.' }, 401);
  }

  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authenticatedClient.auth.getUser();

  if (userError || !userData.user) {
    return json({ error: 'Authentication required.' }, 401);
  }

  let body: { pebbleId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (typeof body.pebbleId !== 'string' || !uuidPattern.test(body.pebbleId)) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: pebble, error: pebbleError } = await admin
    .from('pebbles')
    .select('pair_id, pair_pebble_id, sender_id')
    .eq('id', body.pebbleId)
    .maybeSingle();

  if (pebbleError || !pebble || pebble.sender_id !== userData.user.id) {
    return json({ error: 'Pebble unavailable.' }, 404);
  }

  const { data: pair } = await admin.from('pairs').select('status, pebble_model_status').eq('id', pebble.pair_id).maybeSingle();
  if (!pair || pair.status !== 'active' || pair.pebble_model_status !== 'six') {
    return json({ delivered: false });
  }

  const { data: recipientMembership, error: membershipError } = await admin
    .from('pair_members')
    .select('user_id')
    .eq('pair_id', pebble.pair_id)
    .neq('user_id', userData.user.id)
    .maybeSingle();

  if (membershipError || !recipientMembership) {
    return json({ delivered: false });
  }

  if (pebble.pair_pebble_id) {
    const [{ data: identity }, { data: latestEvent }] = await Promise.all([
      admin.from('pair_pebbles').select('current_holder_id, retired_at').eq('id', pebble.pair_pebble_id).maybeSingle(),
      admin.from('pebbles').select('id').eq('pair_pebble_id', pebble.pair_pebble_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (identity?.retired_at || identity?.current_holder_id !== recipientMembership.user_id || latestEvent?.id !== body.pebbleId) {
      return json({ delivered: false });
    }
  }

  const { data: tokens, error: tokenError } = await admin
    .from('device_push_tokens')
    .select('expo_push_token')
    .eq('user_id', recipientMembership.user_id);

  if (tokenError || !tokens?.length) {
    return json({ delivered: false });
  }

  const { error: deliveryError } = await admin.from('pebble_push_deliveries').insert({
    pebble_id: body.pebbleId,
  });

  if (deliveryError) {
    return json({ delivered: false });
  }

  const pushTokens = tokens as PushToken[];
  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-encoding': 'gzip, deflate',
      'content-type': 'application/json',
    },
    body: JSON.stringify(
      pushTokens.map((token) => ({
        to: token.expo_push_token,
        sound: 'default',
        title: 'Pebble',
        body: 'A pebble arrived.',
        data: { type: 'pebble', pairId: pebble.pair_id },
      })),
    ),
  });

  if (!expoResponse.ok) {
    return json({ delivered: false }, 502);
  }

  const expoResult = (await expoResponse.json()) as { data?: ExpoPushTicket[] };
  const invalidTokens = pushTokens
    .filter((_, index) => expoResult.data?.[index]?.status === 'error' && expoResult.data[index]?.details?.error === 'DeviceNotRegistered')
    .map((token) => token.expo_push_token);

  if (invalidTokens.length) {
    await admin
      .from('device_push_tokens')
      .delete()
      .eq('user_id', recipientMembership.user_id)
      .in('expo_push_token', invalidTokens);
  }

  return json({ delivered: true });
});
