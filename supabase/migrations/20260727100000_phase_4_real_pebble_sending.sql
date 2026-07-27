create table private.pebble_send_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_key text not null check (char_length(request_key) between 16 and 128),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  pebble_id uuid not null references public.pebbles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, request_key)
);

create index pebble_send_requests_user_recent_idx
on private.pebble_send_requests (user_id, created_at desc);

revoke insert on public.pebbles from authenticated;
drop policy if exists pebbles_insert_by_sender_pair_member on public.pebbles;

create function public.send_pebble(send_request_key text)
returns table (
  pebble_id uuid,
  pair_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_request_key text := btrim(send_request_key);
  active_pair_id uuid;
  active_pair_count integer;
  existing_request private.pebble_send_requests%rowtype;
  new_pebble public.pebbles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_request_key is null or char_length(normalized_request_key) not between 16 and 128 then
    raise exception 'Invalid send request.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || normalized_request_key, 0));

  select *
    into existing_request
    from private.pebble_send_requests
    where user_id = current_user_id
      and request_key = normalized_request_key;

  if existing_request.id is not null then
    select pebbles.id, pebbles.pair_id, pebbles.created_at
      into pebble_id, pair_id, created_at
      from public.pebbles
      where pebbles.id = existing_request.pebble_id;

    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
  ) then
    raise exception 'Profile required.';
  end if;

  select count(*)
    into active_pair_count
    from public.pair_members
    join public.pairs on pairs.id = pair_members.pair_id
    where pair_members.user_id = current_user_id
      and pairs.status = 'active';

  select pairs.id
    into active_pair_id
    from public.pair_members
    join public.pairs on pairs.id = pair_members.pair_id
    where pair_members.user_id = current_user_id
      and pairs.status = 'active'
    order by pairs.created_at desc
    limit 1;

  if active_pair_count <> 1 or active_pair_id is null then
    raise exception 'Exactly one active shore is required.';
  end if;

  perform 1
  from public.pairs
  where id = active_pair_id
    and status = 'active'
  for update;

  if exists (
    select 1
    from public.pebbles
    where pebbles.sender_id = current_user_id
      and pebbles.pair_id = active_pair_id
      and pebbles.created_at > now() - interval '2 seconds'
  ) then
    raise exception 'Pebble sending is temporarily resting.';
  end if;

  insert into public.pebbles (pair_id, sender_id)
  values (active_pair_id, current_user_id)
  returning * into new_pebble;

  insert into private.pebble_send_requests (user_id, request_key, pair_id, pebble_id)
  values (current_user_id, normalized_request_key, active_pair_id, new_pebble.id);

  pebble_id := new_pebble.id;
  pair_id := new_pebble.pair_id;
  created_at := new_pebble.created_at;
  return next;
end;
$$;

revoke execute on function public.send_pebble(text) from public, anon;
grant execute on function public.send_pebble(text) to authenticated;
