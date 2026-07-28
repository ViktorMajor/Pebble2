-- Phase 18: permanent six-pebble circulation model.
-- Existing transfer history is never rewritten. Two never-transferred Phase 17
-- identities are retired deterministically when that can be done safely.

alter table public.pair_pebbles
  add column retired_at timestamptz,
  add column retirement_reason text,
  add column visual_variant smallint,
  add constraint pair_pebbles_retirement_consistent check (
    (retired_at is null and retirement_reason is null)
    or (retired_at is not null and retirement_reason is not null)
  );

alter table public.pairs
  add column pebble_model_status text not null default 'legacy_eight_pending',
  add constraint pairs_pebble_model_status_valid check (
    pebble_model_status in ('six', 'legacy-six-migration-required')
    or pebble_model_status = 'legacy_eight_pending'
  );

create table private.pair_pebble_migration_audit (
  pair_id uuid primary key references public.pairs (id) on delete cascade,
  status text not null check (status in ('six', 'legacy-six-migration-required')),
  active_before integer not null,
  retired_count integer not null,
  migrated_at timestamptz not null default now()
);

create or replace function private.total_pair_pebbles()
returns integer
language sql
immutable
set search_path = public
as $$ select 6 $$;

create function private.migrate_pair_to_six(target_pair_id uuid)
returns text
language plpgsql
security definer
set search_path = public, private
as $$
declare
  active_before integer;
  untouched_count integer;
  holder_candidate_count integer;
  retired_count integer := 0;
  result_status text;
begin
  perform 1 from public.pairs where id = target_pair_id for update;
  if not found then
    raise exception 'Connection unavailable.';
  end if;

  select count(*)::integer into active_before
  from public.pair_pebbles
  where pair_id = target_pair_id and retired_at is null;

  if active_before = 0 or active_before = private.total_pair_pebbles() then
    result_status := 'six';
  elsif active_before <> 8 then
    result_status := 'legacy-six-migration-required';
  else
    select count(*)::integer into untouched_count
    from public.pair_pebbles identities
    where identities.pair_id = target_pair_id
      and identities.retired_at is null
      and not exists (
        select 1 from public.pebbles events
        where events.pair_pebble_id = identities.id
      );

    if untouched_count < 2 then
      result_status := 'legacy-six-migration-required';
    else
      select count(distinct identities.current_holder_id)::integer
        into holder_candidate_count
      from public.pair_pebbles identities
      where identities.pair_id = target_pair_id
        and identities.retired_at is null
        and identities.current_holder_id is not null
        and not exists (
          select 1 from public.pebbles events
          where events.pair_pebble_id = identities.id
        );

      if holder_candidate_count >= 2 then
        with ranked as (
          select identities.id,
            row_number() over (
              partition by identities.current_holder_id
              order by identities.visual_seed desc, identities.id desc
            ) as holder_rank
          from public.pair_pebbles identities
          where identities.pair_id = target_pair_id
            and identities.retired_at is null
            and identities.current_holder_id is not null
            and not exists (
              select 1 from public.pebbles events
              where events.pair_pebble_id = identities.id
            )
        ), selected as (
          select id from ranked where holder_rank = 1 order by id limit 2
        )
        update public.pair_pebbles identities
        set retired_at = clock_timestamp(),
            retirement_reason = 'phase-18-untouched-provisional'
        where identities.id in (select id from selected);
      else
        with selected as (
          select identities.id
          from public.pair_pebbles identities
          where identities.pair_id = target_pair_id
            and identities.retired_at is null
            and not exists (
              select 1 from public.pebbles events
              where events.pair_pebble_id = identities.id
            )
          order by identities.visual_seed desc, identities.id desc
          limit 2
        )
        update public.pair_pebbles identities
        set retired_at = clock_timestamp(),
            retirement_reason = 'phase-18-untouched-provisional'
        where identities.id in (select id from selected);
      end if;

      get diagnostics retired_count = row_count;
      if retired_count = 2 and (
        select count(*) from public.pair_pebbles
        where pair_id = target_pair_id and retired_at is null
      ) = private.total_pair_pebbles() then
        result_status := 'six';
      else
        raise exception 'Six-pebble migration did not retire exactly two identities.';
      end if;
    end if;
  end if;

  update public.pairs set pebble_model_status = result_status where id = target_pair_id;
  insert into private.pair_pebble_migration_audit(pair_id, status, active_before, retired_count)
  values(target_pair_id, result_status, active_before, retired_count)
  on conflict (pair_id) do update
    set status = excluded.status,
        active_before = excluded.active_before,
        retired_count = excluded.retired_count,
        migrated_at = now();
  return result_status;
end;
$$;

do $$
declare target_pair_id uuid;
begin
  for target_pair_id in select id from public.pairs order by created_at, id loop
    perform private.migrate_pair_to_six(target_pair_id);
  end loop;
end;
$$;

with ranked as (
  select id,
    row_number() over (
      partition by pair_id
      order by (retired_at is not null), visual_seed, id
    ) - 1 as visual_variant
  from public.pair_pebbles
)
update public.pair_pebbles identities
set visual_variant = ranked.visual_variant
from ranked where ranked.id = identities.id;

alter table public.pair_pebbles
  alter column visual_variant set not null,
  add constraint pair_pebbles_visual_variant_range check (visual_variant between 0 and 7),
  add constraint pair_pebbles_visual_variant_unique unique (pair_id, visual_variant);

alter table public.pairs alter column pebble_model_status set default 'six';
alter table public.pairs drop constraint pairs_pebble_model_status_valid;
alter table public.pairs add constraint pairs_pebble_model_status_valid check (
  pebble_model_status in ('six', 'legacy-six-migration-required')
);

create or replace function private.enforce_pair_pebble_identity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare model_status text;
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.pair_id is distinct from old.pair_id
    or new.visual_seed is distinct from old.visual_seed
    or new.visual_variant is distinct from old.visual_variant
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Pebble identity fields cannot be changed.';
  end if;

  if tg_op = 'UPDATE' and old.retired_at is not null and (
    new.retired_at is distinct from old.retired_at
    or new.retirement_reason is distinct from old.retirement_reason
    or new.current_holder_id is distinct from old.current_holder_id
  ) then
    raise exception 'A retired pebble identity is immutable.';
  end if;

  if new.current_holder_id is not null and not exists (
    select 1 from public.pair_members
    where pair_id = new.pair_id and user_id = new.current_holder_id
  ) then
    raise exception 'Pebble holder must belong to the connection.';
  end if;

  if tg_op = 'UPDATE' and new.current_holder_id is distinct from old.current_holder_id then
    if old.retired_at is not null or new.retired_at is not null then
      raise exception 'A retired pebble cannot be transferred.';
    end if;
    select pebble_model_status into model_status from public.pairs where id = new.pair_id;
    if model_status <> 'six' then
      raise exception 'Connection requires six-pebble migration review.';
    end if;
  end if;
  return new;
end;
$$;

create function private.enforce_physical_transfer_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.pair_pebble_id is not null and exists (
    select 1 from public.pairs
    where id = new.pair_id and pebble_model_status <> 'six'
  ) then
    raise exception 'Connection requires six-pebble migration review.';
  elsif new.pair_pebble_id is not null and not exists (
    select 1
    from public.pair_pebbles identities
    join public.pairs on pairs.id = identities.pair_id
    where identities.id = new.pair_pebble_id
      and identities.pair_id = new.pair_id
      and identities.current_holder_id = new.sender_id
      and identities.retired_at is null
      and pairs.status = 'active'
      and pairs.pebble_model_status = 'six'
  ) then
    raise exception 'Pebble is not eligible for transfer.';
  end if;
  return new;
end;
$$;

create trigger pebbles_transfer_eligibility_before_insert
before insert on public.pebbles
for each row execute function private.enforce_physical_transfer_eligibility();

create or replace function private.provision_pair_pebbles(target_pair_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare first_member uuid; second_member uuid; member_count integer; active_count integer;
begin
  perform 1 from public.pairs where id = target_pair_id for update;
  select count(*)::integer into member_count from public.pair_members where pair_id = target_pair_id;
  if member_count <> 2 then return; end if;

  select count(*)::integer into active_count from public.pair_pebbles
  where pair_id = target_pair_id and retired_at is null;
  if active_count > 0 then
    if active_count <> private.total_pair_pebbles()
      or (select pebble_model_status from public.pairs where id = target_pair_id) <> 'six' then
      raise exception 'Connection pebble set requires migration review.';
    end if;
    return;
  end if;

  select user_id into first_member from public.pair_members
  where pair_id = target_pair_id order by joined_at, user_id limit 1;
  select user_id into second_member from public.pair_members
  where pair_id = target_pair_id order by joined_at, user_id offset 1 limit 1;

  for pebble_index in 0..(private.total_pair_pebbles() - 1) loop
    insert into public.pair_pebbles(pair_id, current_holder_id, visual_seed, visual_variant)
    values(
      target_pair_id,
      case when pebble_index < private.total_pair_pebbles() / 2 then first_member else second_member end,
      (hashtextextended(target_pair_id::text || ':' || pebble_index::text, 1801) & 2147483647)::integer,
      pebble_index
    );
  end loop;
  update public.pairs set pebble_model_status = 'six' where id = target_pair_id;
end;
$$;

drop policy pair_pebbles_select_own_bowl on public.pair_pebbles;
create policy pair_pebbles_select_own_bowl
on public.pair_pebbles for select to authenticated
using (
  retired_at is null
  and private.is_pair_member(pair_pebbles.pair_id, auth.uid())
  and pair_pebbles.current_holder_id = auth.uid()
);

create or replace function public.get_bowl_state(target_pair_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare current_user_id uuid := auth.uid(); bowl_state jsonb; model_status text;
begin
  if current_user_id is null or not private.is_pair_member(target_pair_id, current_user_id) then
    raise exception 'Connection unavailable.';
  end if;
  select pebble_model_status into model_status from public.pairs where id = target_pair_id;
  if model_status <> 'six' then
    raise exception 'Connection requires six-pebble migration review.';
  end if;

  select jsonb_build_object(
    'pebbles', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', identities.id,
        'visual_seed', identities.visual_seed,
        'visual_variant', identities.visual_variant,
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
    order by events.created_at desc, events.id desc limit 1
  ) latest on true
  where identities.pair_id = target_pair_id
    and identities.retired_at is null
    and identities.current_holder_id = current_user_id;
  return bowl_state;
end;
$$;

create or replace function public.send_pebble(send_request_key text)
returns table (pebble_id uuid, pair_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public, private
as $$
declare selected_id uuid; existing_request private.pebble_send_requests%rowtype;
begin
  select * into existing_request from private.pebble_send_requests requests
  where requests.user_id = auth.uid() and requests.request_key = btrim(send_request_key);
  if existing_request.id is not null then
    return query select events.id, events.pair_id, events.created_at
    from public.pebbles events where events.id = existing_request.pebble_id;
    return;
  end if;
  select identities.id into selected_id
  from public.pair_pebbles identities
  join public.pairs on pairs.id = identities.pair_id
  where identities.current_holder_id = auth.uid()
    and identities.retired_at is null
    and pairs.status = 'active'
    and pairs.pebble_model_status = 'six'
  order by identities.visual_seed limit 1;
  if selected_id is null then raise exception 'No held pebble is available.'; end if;
  return query select result.transfer_event_id, result.pair_id, result.created_at
  from public.send_pebble(send_request_key, selected_id) result;
end;
$$;

create function private.assert_active_pair_has_six_pebbles()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare target_pair_id uuid := coalesce(new.pair_id, old.pair_id);
begin
  if exists (
    select 1 from public.pairs
    where id = target_pair_id and status = 'active' and pebble_model_status = 'six'
  ) and (select count(*) from public.pair_members where pair_id = target_pair_id) = 2 then
    if (select count(*) from public.pair_pebbles
      where pair_id = target_pair_id and retired_at is null and current_holder_id is not null
    ) <> private.total_pair_pebbles() then
      raise exception 'An active connection must circulate exactly six pebbles.';
    end if;
  end if;
  return null;
end;
$$;

create constraint trigger pair_pebbles_six_invariant
after insert or update or delete on public.pair_pebbles
deferrable initially deferred
for each row execute function private.assert_active_pair_has_six_pebbles();

revoke all on table private.pair_pebble_migration_audit from public, anon, authenticated;
revoke all on function private.migrate_pair_to_six(uuid) from public, anon, authenticated;
revoke all on function private.assert_active_pair_has_six_pebbles() from public, anon, authenticated;
revoke all on function private.total_pair_pebbles() from public, anon, authenticated;
revoke all on function private.provision_pair_pebbles(uuid) from public, anon, authenticated;
revoke all on function private.enforce_pair_pebble_identity() from public, anon, authenticated;
revoke all on function private.enforce_physical_transfer_eligibility() from public, anon, authenticated;
