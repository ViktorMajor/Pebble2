import { requireSupabaseClient } from '../../lib/supabase';

export type OwnProfile = { id: string; displayName: string; email: string };

export function normalizeDisplayName(value: string): string | null {
  const displayName = value.trim();
  return displayName.length >= 1 && displayName.length <= 80 ? displayName : null;
}

export async function getOwnProfile(): Promise<OwnProfile> {
  const client = requireSupabaseClient();
  const [{ data: userData, error: userError }, { data: profile, error: profileError }] = await Promise.all([
    client.auth.getUser(),
    client.from('profiles').select('id, display_name').maybeSingle(),
  ]);
  if (userError || !userData.user || profileError || !profile) throw new Error('Profile unavailable.');
  return { id: profile.id, displayName: profile.display_name, email: userData.user.email ?? '' };
}

export async function updateOwnDisplayName(value: string): Promise<string> {
  const displayName = normalizeDisplayName(value);
  if (!displayName) throw new Error('Invalid display name.');
  const client = requireSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error('Authentication required.');
  const { error } = await client.from('profiles').update({ display_name: displayName }).eq('id', userData.user.id);
  if (error) throw error;
  return displayName;
}
