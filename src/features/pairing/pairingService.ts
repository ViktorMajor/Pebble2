import { requireSupabaseClient } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const inviteKey = (pairId: string) => `pebble.invite.${pairId}`;

export type ShoreInvite = {
  pairId: string;
  inviteToken: string;
  expiresAt: string;
};

export type CurrentShore = {
  id: string;
  status: 'active';
};

export type ClosedShore = { id: string; closedAt: string };
export type ShoreConnection = { id: string; status: 'active' | 'closed'; closedAt: string | null; partnerName: string | null; hasPendingInvite: boolean };

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

  const result = {
    pairId: invite.pair_id,
    inviteToken: invite.invite_token,
    expiresAt: invite.expires_at,
  };
  await AsyncStorage.setItem(inviteKey(result.pairId), result.inviteToken);
  return result;
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

export async function getLocalInvitation(pairId: string): Promise<string | null> { return AsyncStorage.getItem(inviteKey(pairId)); }
export async function clearLocalInvitation(pairId: string): Promise<void> { await AsyncStorage.removeItem(inviteKey(pairId)); }

export async function getCurrentShore(): Promise<CurrentShore | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('pairs')
    .select('id, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.status !== 'active') {
    return null;
  }

  return { id: data.id, status: 'active' };
}

export async function getShoreConnections(currentUserId: string): Promise<{ active: ShoreConnection | null; closed: ClosedShore[] }> {
  const client = requireSupabaseClient();
  const { data: pairs, error } = await client.from('pairs').select('id, status, closed_at').order('created_at', { ascending: false });
  if (error) throw error;
  const activePair = pairs?.find((pair) => pair.status === 'active') ?? null;
  const closed = (pairs ?? []).filter((pair) => pair.status === 'closed').map((pair) => ({ id: pair.id, closedAt: pair.closed_at ?? '' }));
  if (!activePair) return { active: null, closed };
  const { data: members, error: membersError } = await client.from('pair_members').select('user_id, profiles(display_name)').eq('pair_id', activePair.id);
  if (membersError) throw membersError;
  const partner = (members ?? []).find((member) => member.user_id !== currentUserId) as { profiles?: { display_name?: string } | null } | undefined;
  return { active: { id: activePair.id, status: 'active', closedAt: null, partnerName: partner?.profiles?.display_name ?? null, hasPendingInvite: (members?.length ?? 0) < 2 }, closed };
}

export async function getShoreStatus(pairId: string): Promise<'active' | 'closed' | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('pairs').select('status').eq('id', pairId).maybeSingle();
  if (error) throw error;
  return data?.status === 'active' || data?.status === 'closed' ? data.status : null;
}
