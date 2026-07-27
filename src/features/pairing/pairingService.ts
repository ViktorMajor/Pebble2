import { requireSupabaseClient } from '../../lib/supabase';

export type ShoreInvite = {
  pairId: string;
  inviteToken: string;
  expiresAt: string;
};

export type CurrentShore = {
  id: string;
  status: 'active' | 'closed';
};

export async function createShoreWithInvite(): Promise<ShoreInvite> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('create_shore_with_invite');

  if (error) {
    throw error;
  }

  const invite = data?.[0];

  if (!invite) {
    throw new Error('Could not create shore.');
  }

  return {
    pairId: invite.pair_id,
    inviteToken: invite.invite_token,
    expiresAt: invite.expires_at,
  };
}

export async function joinShoreWithInvite(inviteToken: string): Promise<string> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('join_shore_with_invite', {
    invite_token: inviteToken.trim(),
  });

  if (error) {
    throw error;
  }

  const result = data?.[0];

  if (!result) {
    throw new Error('Could not join shore.');
  }

  return result.pair_id;
}

export async function getCurrentShore(): Promise<CurrentShore | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('pairs')
    .select('id, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || (data.status !== 'active' && data.status !== 'closed')) {
    return null;
  }

  return { id: data.id, status: data.status };
}
