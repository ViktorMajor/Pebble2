-- Phase 17: finite, persistent pair-owned pebble identities.
-- public.pebbles remains the immutable transfer/touch event history.

create function private.total_pair_pebbles()
returns integer
language sql
immutable
set search_path = public
as $$ select 8 $$;

create table public.pair_pebbles (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  current_holder_id uuid references public.profiles (id) on delete set null,
  visual_seed integer not null check (visual_seed >= 0),
  created_at timestamptz not null default now(),
  unique (pair_id, visual_seed),
  unique (pair_id, id)
);

create index pair_pebbles_holder_idx
on public.pair_pebbles (current_holder_id, pair_id);

alter table public.pebbles
  add column pair_pebble_id uuid,
  add constraint pebbles_pair_pebble_fk
    foreign key (pair_id, pair_pebble_id)
    references public.pair_pebbles (pair_id, id)
    on delete restrict;

create index pebbles_pair_pebble_created_idx
on public.pebbles (pair_pebble_id, created_at desc)
where pair_pebble_id is not null;

create function private.set_physical_transfer_event_time()
returns trigger language plpgsql set search_path=public
as $$ begin if new.pair_pebble_id is not null then new.created_at:=clock_timestamp(); end if; return new; end; $$;
create trigger pebbles_physical_transfer_time_before_insert
before insert on public.pebbles for each row execute function private.set_physical_transfer_event_time();

alter table private.pebble_send_requests
  add column pair_pebble_id uuid references public.pair_pebbles (id) on delete restrict;

create function private.enforce_pair_pebble_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.pair_id is distinct from old.pair_id
    or new.visual_seed is distinct from old.visual_seed
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Pebble identity fields cannot be changed.';
  end if;

  if new.current_holder_id is not null and not exists (
    select 1
    from public.pair_members
    where pair_id = new.pair_id
      and user_id = new.current_holder_id
  ) then
    raise exception 'Pebble holder must belong to the connection.';
  end if;

  return new;
end;
$$;

create trigger pair_pebbles_identity_before_write
before insert or update on public.pair_pebbles
for each row
execute function private.enforce_pair_pebble_identity();

create function private.provision_pair_pebbles(target_pair_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  first_member uuid;
  second_member uuid;
  member_count integer;
begin
  perform 1 from public.pairs where id = target_pair_id for update;

  select count(*)::integer
    into member_count
    from public.pair_members
    where pair_id = target_pair_id;

  if member_count <> 2 then
    return;
  end if;

  if exists (select 1 from public.pair_pebbles where pair_id = target_pair_id) then
    if (select count(*) from public.pair_pebbles where pair_id = target_pair_id) <> private.total_pair_pebbles() then
      raise exception 'Connection pebble set is incomplete.';
    end if;
    return;
  end if;

  select user_id into first_member
  from public.pair_members
  where pair_id = target_pair_id
  order by joined_at, user_id
  limit 1;

  select user_id into second_member
  from public.pair_members
  where pair_id = target_pair_id
  order by joined_at, user_id
  offset 1 limit 1;

  for pebble_index in 0..(private.total_pair_pebbles() - 1) loop
    insert into public.pair_pebbles (pair_id, current_holder_id, visual_seed)
    values (
      target_pair_id,
      case when pebble_index < private.total_pair_pebbles() / 2 then first_member else second_member end,
      (hashtextextended(target_pair_id::text || ':' || pebble_index::text, 1701) & 2147483647)::integer
    );
  end loop;
end;
$$;

create function private.provision_pair_pebbles_after_member_join()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.provision_pair_pebbles(new.pair_id);
  return new;
end;
$$;

create trigger pair_members_provision_pebbles_after_insert
after insert on public.pair_members
for each row
execute function private.provision_pair_pebbles_after_member_join();

do $$
declare
  target_pair_id uuid;
begin
  for target_pair_id in
    select pair_id
    from public.pair_members
    group by pair_id
    having count(*) = 2
  loop
    perform private.provision_pair_pebbles(target_pair_id);
  end loop;
end;
$$;

alter table public.pair_pebbles enable row level security;
revoke all on public.pair_pebbles from anon, authenticated;
grant select on public.pair_pebbles to authenticated;

create policy pair_pebbles_select_for_members
on public.pair_pebbles
for select
to authenticated
using (
  private.is_pair_member(pair_pebbles.pair_id, auth.uid())
  and pair_pebbles.current_holder_id = auth.uid()
);

create or replace function private.enforce_pebble_touch_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.pair_id is distinct from old.pair_id
    or new.pair_pebble_id is distinct from old.pair_pebble_id
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

drop function public.send_pebble(text);

create function public.send_pebble(send_request_key text, selected_pair_pebble_id uuid)
returns table (
  transfer_event_id uuid,
  pair_pebble_id uuid,
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
  selected_pebble public.pair_pebbles%rowtype;
  partner_user_id uuid;
  existing_request private.pebble_send_requests%rowtype;
  new_event public.pebbles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_request_key is null or char_length(normalized_request_key) not between 16 and 128 then
    raise exception 'Invalid send request.';
  end if;

  if selected_pair_pebble_id is null then
    raise exception 'Pebble unavailable.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || normalized_request_key, 0));

  select * into existing_request
  from private.pebble_send_requests requests
  where requests.user_id = current_user_id and requests.request_key = normalized_request_key;

  if existing_request.id is not null then
    if existing_request.pair_pebble_id is distinct from selected_pair_pebble_id then
      raise exception 'Send request already belongs to another pebble.';
    end if;

    select events.id, events.pair_pebble_id, events.pair_id, events.created_at
      into transfer_event_id, pair_pebble_id, pair_id, created_at
      from public.pebbles events
      where events.id = existing_request.pebble_id;
    return next;
    return;
  end if;

  select identities.* into selected_pebble
  from public.pair_pebbles identities
  join public.pairs on pairs.id = identities.pair_id
  where identities.id = selected_pair_pebble_id
    and identities.current_holder_id = current_user_id
    and pairs.status = 'active'
    and private.is_pair_member(identities.pair_id, current_user_id)
  for update of identities;

  if selected_pebble.id is null then
    raise exception 'Pebble unavailable.';
  end if;

  perform 1 from public.pairs selected_pair
  where selected_pair.id = selected_pebble.pair_id and selected_pair.status = 'active'
  for update;
  if not found then
    raise exception 'This connection is closed.';
  end if;

  select members.user_id into partner_user_id
  from public.pair_members members
  where members.pair_id = selected_pebble.pair_id and members.user_id <> current_user_id
  limit 1;

  if partner_user_id is null or (
    select count(*) from public.pair_members members where members.pair_id = selected_pebble.pair_id
  ) <> 2 then
    raise exception 'The connection is still waiting.';
  end if;

  if exists (
    select 1 from public.pebbles recent_events
    where recent_events.sender_id = current_user_id
      and recent_events.pair_id = selected_pebble.pair_id
      and recent_events.created_at > now() - interval '2 seconds'
  ) then
    raise exception 'Pebble sending is temporarily resting.';
  end if;

  insert into public.pebbles (pair_id, pair_pebble_id, sender_id)
  values (selected_pebble.pair_id, selected_pebble.id, current_user_id)
  returning * into new_event;

  update public.pair_pebbles
  set current_holder_id = partner_user_id
  where pair_pebbles.id = selected_pebble.id;

  insert into private.pebble_send_requests (user_id, request_key, pair_id, pebble_id, pair_pebble_id)
  values (current_user_id, normalized_request_key, selected_pebble.pair_id, new_event.id, selected_pebble.id);

  transfer_event_id := new_event.id;
  pair_pebble_id := selected_pebble.id;
  pair_id := new_event.pair_id;
  created_at := new_event.created_at;
  return next;
end;
$$;

revoke execute on function public.send_pebble(text, uuid) from public, anon;
grant execute on function public.send_pebble(text, uuid) to authenticated;

-- Compatibility for development builds created before Phase 17. The server,
-- rather than the caller, chooses one currently held identity. New clients use
-- the two-argument operation so the pressed physical pebble is transferred.
create function public.send_pebble(send_request_key text)
returns table (pebble_id uuid, pair_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public, private
as $$
declare selected_id uuid; existing_request private.pebble_send_requests%rowtype;
begin
  select * into existing_request from private.pebble_send_requests requests
  where requests.user_id=auth.uid() and requests.request_key=btrim(send_request_key);
  if existing_request.id is not null then
    return query select events.id,events.pair_id,events.created_at from public.pebbles events where events.id=existing_request.pebble_id;
    return;
  end if;
  select identities.id into selected_id
  from public.pair_pebbles identities
  join public.pairs on pairs.id = identities.pair_id
  where identities.current_holder_id = auth.uid() and pairs.status = 'active'
  order by identities.visual_seed
  limit 1;
  if selected_id is null then raise exception 'No held pebble is available.'; end if;
  return query select result.transfer_event_id, result.pair_id, result.created_at
  from public.send_pebble(send_request_key, selected_id) result;
end;
$$;
revoke execute on function public.send_pebble(text) from public, anon;
grant execute on function public.send_pebble(text) to authenticated;

create or replace function public.touch_pebble(target_pebble_id uuid)
returns table (pebble_id uuid, touched boolean)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
  target_event public.pebbles%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.'; end if;

  select * into target_event
  from public.pebbles events
  where events.id = target_pebble_id
  for update;

  if target_event.id is null then raise exception 'Pebble unavailable.'; end if;

  perform 1 from public.pairs target_pair
  where target_pair.id = target_event.pair_id and target_pair.status = 'active'
  for update;
  if not found then raise exception 'This connection is closed.'; end if;

  if target_event.sender_id = current_user_id then
    raise exception 'A sender cannot touch their own pebble.';
  end if;
  if not private.is_pair_member(target_event.pair_id, current_user_id) then
    raise exception 'Pebble unavailable.';
  end if;

  if target_event.pair_pebble_id is not null then
    if not exists (
      select 1 from public.pair_pebbles
      where id = target_event.pair_pebble_id
        and pair_id = target_event.pair_id
        and current_holder_id = current_user_id
    ) or exists (
      select 1 from public.pebbles later
      where later.pair_pebble_id = target_event.pair_pebble_id
        and (later.created_at, later.id) > (target_event.created_at, target_event.id)
    ) then
      raise exception 'Pebble is no longer awaiting touch.';
    end if;
  end if;

  if not target_event.touched then
    update public.pebbles set touched = true where id = target_event.id;
  end if;

  pebble_id := target_event.id;
  touched := true;
  return next;
end;
$$;

create function public.get_bowl_state(target_pair_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
  bowl_state jsonb;
begin
  if current_user_id is null or not private.is_pair_member(target_pair_id, current_user_id) then
    raise exception 'Connection unavailable.';
  end if;

  select jsonb_build_object(
    'pebbles', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', identities.id,
        'visual_seed', identities.visual_seed,
        'transfer_event_id', latest.id,
        'incoming', coalesce(latest.sender_id <> current_user_id, false),
        'touched', coalesce(latest.touched, true)
      ) order by identities.visual_seed
    ) filter (where identities.id is not null), '[]'::jsonb)
  ) into bowl_state
  from public.pair_pebbles identities
  left join lateral (
    select events.id, events.sender_id, events.touched
    from public.pebbles events
    where events.pair_pebble_id = identities.id
    order by events.created_at desc, events.id desc
    limit 1
  ) latest on true
  where identities.pair_id = target_pair_id
    and identities.current_holder_id = current_user_id;

  return bowl_state;
end;
$$;

revoke execute on function public.get_bowl_state(uuid) from public, anon;
grant execute on function public.get_bowl_state(uuid) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.pair_pebbles;
exception when duplicate_object then null;
end;
$$;

revoke all on function private.total_pair_pebbles() from public, anon, authenticated;
revoke all on function private.provision_pair_pebbles(uuid) from public, anon, authenticated;
revoke all on function private.provision_pair_pebbles_after_member_join() from public, anon, authenticated;
revoke all on function private.enforce_pair_pebble_identity() from public, anon, authenticated;
revoke all on function private.set_physical_transfer_event_time() from public, anon, authenticated;
