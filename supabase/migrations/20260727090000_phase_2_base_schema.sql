create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.pairs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (
    (status = 'active' and closed_at is null)
    or (status = 'closed' and closed_at is not null)
  )
);

create table public.pair_members (
  pair_id uuid not null references public.pairs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (pair_id, user_id)
);

create table public.pebbles (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null,
  sender_id uuid not null,
  created_at timestamptz not null default now(),
  touched boolean not null default false,
  foreign key (pair_id) references public.pairs (id) on delete cascade,
  foreign key (pair_id, sender_id) references public.pair_members (pair_id, user_id) on delete cascade
);

create index pair_members_user_id_idx on public.pair_members (user_id);
create index pebbles_pair_id_created_at_idx on public.pebbles (pair_id, created_at);

create function public.enforce_pair_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_status text;
begin
  select status
    into pair_status
    from public.pairs
    where id = new.pair_id
    for update;

  if pair_status is null then
    raise exception 'Pair does not exist.';
  end if;

  if pair_status <> 'active' then
    raise exception 'Cannot join a closed pair.';
  end if;

  if (
    select count(*)
    from public.pair_members
    where pair_id = new.pair_id
  ) >= 2 then
    raise exception 'A pair may contain at most two members.';
  end if;

  return new;
end;
$$;

create trigger pair_members_limit_before_insert
before insert on public.pair_members
for each row
execute function public.enforce_pair_member_limit();

create function public.enforce_pebble_insert_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.touched <> false then
    raise exception 'A new pebble cannot already be touched.';
  end if;

  if not exists (
    select 1
    from public.pairs
    where id = new.pair_id
      and status = 'active'
  ) then
    raise exception 'Cannot send a pebble to a closed pair.';
  end if;

  return new;
end;
$$;

create trigger pebbles_insert_invariants_before_insert
before insert on public.pebbles
for each row
execute function public.enforce_pebble_insert_invariants();

create function public.is_pair_member(check_pair_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_members
    where pair_id = check_pair_id
      and user_id = check_user_id
  );
$$;

create function public.shares_pair_with(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_members as first_member
    join public.pair_members as second_member
      on second_member.pair_id = first_member.pair_id
    where first_member.user_id = first_user_id
      and second_member.user_id = second_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.pairs enable row level security;
alter table public.pair_members enable row level security;
alter table public.pebbles enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.pairs from anon, authenticated;
revoke all on public.pair_members from anon, authenticated;
revoke all on public.pebbles from anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update (display_name) on public.profiles to authenticated;
grant select on public.pairs to authenticated;
grant select on public.pair_members to authenticated;
grant select, insert, update (touched) on public.pebbles to authenticated;

create policy profiles_select_own_or_shore_member
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.shares_pair_with(auth.uid(), profiles.id)
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy pairs_select_for_members
on public.pairs
for select
to authenticated
using (
  public.is_pair_member(pairs.id, auth.uid())
);

create policy pair_members_select_for_pair_members
on public.pair_members
for select
to authenticated
using (
  public.is_pair_member(pair_members.pair_id, auth.uid())
);

create policy pebbles_select_for_pair_members
on public.pebbles
for select
to authenticated
using (
  public.is_pair_member(pebbles.pair_id, auth.uid())
);

create policy pebbles_insert_by_sender_pair_member
on public.pebbles
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and touched = false
  and public.is_pair_member(pebbles.pair_id, auth.uid())
  and exists (
    select 1
    from public.pairs
    where pairs.id = pebbles.pair_id
      and pairs.status = 'active'
  )
);

create policy pebbles_touch_incoming_for_pair_members
on public.pebbles
for update
to authenticated
using (
  sender_id <> auth.uid()
  and public.is_pair_member(pebbles.pair_id, auth.uid())
)
with check (
  sender_id <> auth.uid()
  and touched = true
  and public.is_pair_member(pebbles.pair_id, auth.uid())
);
