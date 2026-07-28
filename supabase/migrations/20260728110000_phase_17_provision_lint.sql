-- Remove an unnecessary declaration: integer FOR loops declare their iterator.
create or replace function private.provision_pair_pebbles(target_pair_id uuid)
returns void language plpgsql security definer set search_path=public,private
as $$
declare first_member uuid; second_member uuid; member_count integer;
begin
  perform 1 from public.pairs where id=target_pair_id for update;
  select count(*)::integer into member_count from public.pair_members where pair_id=target_pair_id;
  if member_count<>2 then return; end if;
  if exists(select 1 from public.pair_pebbles where pair_id=target_pair_id) then
    if (select count(*) from public.pair_pebbles where pair_id=target_pair_id)<>private.total_pair_pebbles() then raise exception 'Connection pebble set is incomplete.'; end if;
    return;
  end if;
  select user_id into first_member from public.pair_members where pair_id=target_pair_id order by joined_at,user_id limit 1;
  select user_id into second_member from public.pair_members where pair_id=target_pair_id order by joined_at,user_id offset 1 limit 1;
  for pebble_index in 0..(private.total_pair_pebbles()-1) loop
    insert into public.pair_pebbles(pair_id,current_holder_id,visual_seed)
    values(target_pair_id,case when pebble_index<private.total_pair_pebbles()/2 then first_member else second_member end,(hashtextextended(target_pair_id::text||':'||pebble_index::text,1701)&2147483647)::integer);
  end loop;
end;
$$;
revoke all on function private.provision_pair_pebbles(uuid) from public,anon,authenticated;
