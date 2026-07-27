-- Keep RLS helper functions out of the public RPC namespace. Policies hold
-- function references by OID, so callers cannot resolve the private schema.
create function private.is_pair_member(check_pair_id uuid, check_user_id uuid)
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

create function private.shares_pair_with(first_user_id uuid, second_user_id uuid)
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

drop policy profiles_select_own_or_shore_member on public.profiles;
create policy profiles_select_own_or_shore_member
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or private.shares_pair_with(auth.uid(), profiles.id)
);

drop policy pairs_select_for_members on public.pairs;
create policy pairs_select_for_members
on public.pairs
for select
to authenticated
using (private.is_pair_member(pairs.id, auth.uid()));

drop policy pair_members_select_for_pair_members on public.pair_members;
create policy pair_members_select_for_pair_members
on public.pair_members
for select
to authenticated
using (private.is_pair_member(pair_members.pair_id, auth.uid()));

drop policy pebbles_select_for_pair_members on public.pebbles;
create policy pebbles_select_for_pair_members
on public.pebbles
for select
to authenticated
using (private.is_pair_member(pebbles.pair_id, auth.uid()));

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_pair_member(uuid, uuid) to authenticated;
grant execute on function private.shares_pair_with(uuid, uuid) to authenticated;

revoke execute on function public.is_pair_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.shares_pair_with(uuid, uuid) from public, anon, authenticated;

create function private.start_pair_invite_attempt(attempt_user_id uuid)
returns bigint
language plpgsql
volatile
security definer
set search_path = private, public
as $$
declare
  attempt_id bigint;
begin
  insert into private.pair_invite_attempts (user_id)
  values (attempt_user_id)
  returning id into attempt_id;

  return attempt_id;
end;
$$;

create or replace function public.join_shore_with_invite(invite_token text)
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
  attempt_id bigint;
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

  if private.too_many_pair_invite_attempts(current_user_id) then
    return;
  end if;

  attempt_id := private.start_pair_invite_attempt(current_user_id);

  if invite_token is null or char_length(invite_token) not between 64 and 128 then
    return;
  end if;

  submitted_digest := private.hash_pair_invite_token(btrim(invite_token));

  select *
    into invite_record
    from public.pair_invites
    where token_hash = submitted_digest
    for update;

  if invite_record.id is null then
    return;
  end if;

  select status
    into pair_status
    from public.pairs
    where id = invite_record.pair_id
    for update;

  if pair_status is null or pair_status <> 'active'
    or invite_record.expires_at <= now()
    or invite_record.consumed then
    return;
  end if;

  if public.is_pair_member(invite_record.pair_id, current_user_id) then
    return;
  end if;

  select count(*)
    into member_count
    from public.pair_members
    where pair_members.pair_id = invite_record.pair_id;

  if member_count >= 2 then
    return;
  end if;

  insert into public.pair_members (pair_id, user_id)
  values (invite_record.pair_id, current_user_id);

  update public.pair_invites
  set consumed = true
  where id = invite_record.id;

  delete from private.pair_invite_attempts
  where id = attempt_id;

  pair_id := invite_record.pair_id;
  return next;
end;
$$;
