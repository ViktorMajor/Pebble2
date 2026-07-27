create function private.enforce_pebble_touch_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.pair_id is distinct from old.pair_id
    or new.sender_id is distinct from old.sender_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Pebble event fields cannot be changed.';
  end if;

  if old.touched and not new.touched then
    raise exception 'A touched pebble cannot be changed back.';
  end if;

  if old.touched = new.touched then
    raise exception 'A pebble touch must change untouched to touched.';
  end if;

  return new;
end;
$$;

create trigger pebbles_touch_transition_before_update
before update on public.pebbles
for each row
execute function private.enforce_pebble_touch_transition();

revoke update (touched) on public.pebbles from authenticated;
drop policy if exists pebbles_touch_incoming_for_pair_members on public.pebbles;

create function public.touch_pebble(target_pebble_id uuid)
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

revoke execute on function public.touch_pebble(uuid) from public, anon;
grant execute on function public.touch_pebble(uuid) to authenticated;
