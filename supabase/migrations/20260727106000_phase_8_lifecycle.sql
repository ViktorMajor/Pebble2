create function public.close_shore(target_pair_id uuid)
returns table (
  pair_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_pair public.pairs%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select *
    into target_pair
    from public.pairs
    where id = target_pair_id
    for update;

  if target_pair.id is null or not public.is_pair_member(target_pair_id, current_user_id) then
    raise exception 'Shore unavailable.';
  end if;

  if target_pair.status = 'active' then
    update public.pairs
      set status = 'closed',
          closed_at = now()
      where id = target_pair.id;

    delete from public.pair_invites
      where pair_invites.pair_id = target_pair.id;
  end if;

  pair_id := target_pair.id;
  status := 'closed';
  return next;
end;
$$;

revoke execute on function public.close_shore(uuid) from public, anon;
grant execute on function public.close_shore(uuid) to authenticated;

create or replace function public.touch_pebble(target_pebble_id uuid)
returns table (
  pebble_id uuid,
  touched boolean
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
  target_pebble public.pebbles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select *
    into target_pebble
    from public.pebbles
    where id = target_pebble_id
    for update;

  if target_pebble.id is null then
    raise exception 'Pebble unavailable.';
  end if;

  perform 1
    from public.pairs
    where id = target_pebble.pair_id
      and status = 'active'
    for update;

  if not found then
    raise exception 'This shore is closed.';
  end if;

  if target_pebble.sender_id = current_user_id then
    raise exception 'A sender cannot touch their own pebble.';
  end if;

  if not public.is_pair_member(target_pebble.pair_id, current_user_id) then
    raise exception 'Pebble unavailable.';
  end if;

  if not target_pebble.touched then
    update public.pebbles
      set touched = true
      where id = target_pebble.id;
  end if;

  pebble_id := target_pebble.id;
  touched := true;
  return next;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.pairs;
exception
  when duplicate_object then null;
end;
$$;
