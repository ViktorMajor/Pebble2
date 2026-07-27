create schema if not exists private;

create table public.pair_invites (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index pair_invites_pair_id_idx on public.pair_invites (pair_id);
create index pair_invites_created_by_idx on public.pair_invites (created_by);
create index pair_invites_active_lookup_idx
on public.pair_invites (token_hash, expires_at)
where consumed = false;

create table private.pair_invite_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index pair_invite_attempts_user_recent_idx
on private.pair_invite_attempts (user_id, attempted_at desc);

alter table public.pair_invites enable row level security;

revoke all on public.pair_invites from anon, authenticated;
revoke insert, update, delete on public.pair_members from authenticated;
revoke insert, update, delete on public.pairs from authenticated;

create function private.hash_pair_invite_token(raw_token text)
returns bytea
language sql
immutable
strict
set search_path = public, extensions
as $$
  select extensions.digest(convert_to(raw_token, 'utf8'), 'sha256');
$$;

create function private.generate_pair_invite_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select encode(extensions.gen_random_bytes(32), 'hex');
$$;

create function private.record_invalid_pair_invite_attempt(attempt_user_id uuid)
returns void
language sql
volatile
security definer
set search_path = private, public
as $$
  insert into private.pair_invite_attempts (user_id)
  values (attempt_user_id);
$$;

create function private.too_many_pair_invite_attempts(attempt_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select (
    select count(*)
    from private.pair_invite_attempts
    where user_id = attempt_user_id
      and attempted_at > now() - interval '15 minutes'
  ) >= 10;
$$;

create function public.create_shore_with_invite()
returns table (
  pair_id uuid,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  new_pair_id uuid;
  raw_token text;
  token_digest bytea;
  invite_expires_at timestamptz := now() + interval '7 days';
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
  ) then
    raise exception 'Profile required.';
  end if;

  insert into public.pairs default values
  returning id into new_pair_id;

  insert into public.pair_members (pair_id, user_id)
  values (new_pair_id, current_user_id);

  raw_token := private.generate_pair_invite_token();
  token_digest := private.hash_pair_invite_token(raw_token);

  insert into public.pair_invites (pair_id, token_hash, created_by, expires_at)
  values (new_pair_id, token_digest, current_user_id, invite_expires_at);

  pair_id := new_pair_id;
  invite_token := raw_token;
  expires_at := invite_expires_at;
  return next;
end;
$$;

create function public.join_shore_with_invite(invite_token text)
returns table (
  pair_id uuid
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  submitted_digest bytea;
  invite_record public.pair_invites%rowtype;
  pair_status text;
  member_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if invite_token is null or char_length(invite_token) < 64 then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Invalid invitation.';
  end if;

  if private.too_many_pair_invite_attempts(current_user_id) then
    raise exception 'Too many invalid invitation attempts.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
  ) then
    raise exception 'Profile required.';
  end if;

  submitted_digest := private.hash_pair_invite_token(btrim(invite_token));

  select *
    into invite_record
    from public.pair_invites
    where token_hash = submitted_digest
    for update;

  if invite_record.id is null then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Invalid invitation.';
  end if;

  select status
    into pair_status
    from public.pairs
    where id = invite_record.pair_id
    for update;

  if pair_status is null or pair_status <> 'active' then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Invalid invitation.';
  end if;

  if invite_record.expires_at <= now() then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Invitation expired.';
  end if;

  if invite_record.consumed then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Invitation already used.';
  end if;

  select count(*)
    into member_count
    from public.pair_members
    where pair_members.pair_id = invite_record.pair_id;

  if member_count >= 2 then
    perform private.record_invalid_pair_invite_attempt(current_user_id);
    raise exception 'Shore is already full.';
  end if;

  insert into public.pair_members (pair_id, user_id)
  values (invite_record.pair_id, current_user_id);

  update public.pair_invites
  set consumed = true
  where id = invite_record.id;

  pair_id := invite_record.pair_id;
  return next;
end;
$$;

revoke execute on function public.create_shore_with_invite() from public, anon;
revoke execute on function public.join_shore_with_invite(text) from public, anon;

grant execute on function public.create_shore_with_invite() to authenticated;
grant execute on function public.join_shore_with_invite(text) to authenticated;
