-- A member may retain many closed shores, but never enter two active shores.
-- The advisory lock serializes concurrent create/join attempts for one user.
create or replace function public.enforce_pair_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_status text;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select status into pair_status from public.pairs where id = new.pair_id for update;
  if pair_status is null then raise exception 'Pair does not exist.'; end if;
  if pair_status <> 'active' then raise exception 'Cannot join a closed pair.'; end if;

  if exists (
    select 1 from public.pair_members existing_members
    join public.pairs existing_pairs on existing_pairs.id = existing_members.pair_id
    where existing_members.user_id = new.user_id
      and existing_pairs.status = 'active'
      and existing_members.pair_id <> new.pair_id
  ) then
    raise exception 'User already has an active shore.';
  end if;

  if (select count(*) from public.pair_members where pair_id = new.pair_id) >= 2 then
    raise exception 'A pair may contain at most two members.';
  end if;
  return new;
end;
$$;

create index if not exists pair_members_user_pair_idx on public.pair_members (user_id, pair_id);
