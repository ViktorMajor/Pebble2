create function public.get_bowl_development_diagnostics(target_pair_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
  result jsonb;
begin
  if current_user_id is null or not private.is_pair_member(target_pair_id, current_user_id) then
    raise exception 'Connection unavailable.';
  end if;

  select jsonb_build_object(
    'pair_id', pairs.id,
    'connection_status', pairs.status,
    'migration_status', pairs.pebble_model_status,
    'member_count', (select count(*) from public.pair_members members where members.pair_id = pairs.id),
    'active_count', (select count(*) from public.pair_pebbles identities where identities.pair_id = pairs.id and identities.retired_at is null),
    'held_count', (select count(*) from public.pair_pebbles identities where identities.pair_id = pairs.id and identities.retired_at is null and identities.current_holder_id = current_user_id),
    'held_elsewhere_count', (select count(*) from public.pair_pebbles identities where identities.pair_id = pairs.id and identities.retired_at is null and identities.current_holder_id is distinct from current_user_id),
    'retired_count', (select count(*) from public.pair_pebbles identities where identities.pair_id = pairs.id and identities.retired_at is not null)
  ) into result
  from public.pairs
  where pairs.id = target_pair_id;

  if result is null then raise exception 'Connection unavailable.'; end if;
  return result;
end;
$$;

revoke all on function public.get_bowl_development_diagnostics(uuid) from public, anon;
grant execute on function public.get_bowl_development_diagnostics(uuid) to authenticated;

comment on function public.get_bowl_development_diagnostics(uuid) is
  'Member-only aggregate diagnostics for the development Bowl Lab. Returns no partner identity and is never called by production UI.';
