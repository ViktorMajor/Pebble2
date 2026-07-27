import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: memberships, error: membershipError } = await admin
    .from('pair_members')
    .select('pair_id')
    .eq('user_id', userData.user.id);

  if (membershipError) {
    return json({ error: 'Could not prepare account deletion.' }, 500);
  }

  const pairIds = memberships?.map((membership) => membership.pair_id) ?? [];

  if (pairIds.length) {
    const closedAt = new Date().toISOString();
    const { error: closeError } = await admin
      .from('pairs')
      .update({ status: 'closed', closed_at: closedAt })
      .in('id', pairIds)
      .eq('status', 'active');

    if (closeError) {
      return json({ error: 'Could not prepare account deletion.' }, 500);
    }

    await admin.from('pair_invites').delete().in('pair_id', pairIds);
  }

  await admin.from('device_push_tokens').delete().eq('user_id', userData.user.id);

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteUserError) {
    return json({ error: 'Could not delete account.' }, 500);
  }

  for (const pairId of pairIds) {
    const { count } = await admin.from('pair_members').select('*', { count: 'exact', head: true }).eq('pair_id', pairId);
    if (count === 0) {
      await admin.from('pairs').delete().eq('id', pairId);
    }
  }

  return json({ deleted: true });
});
