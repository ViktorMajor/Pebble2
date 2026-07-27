create function public.get_shore_memory(target_pair_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  memory jsonb;
begin
  if current_user_id is null or not public.is_pair_member(target_pair_id, current_user_id) then
    raise exception 'Shore unavailable.';
  end if;

  with recent_pebbles as (
    select id, sender_id, touched, created_at
    from public.pebbles
    where pair_id = target_pair_id
    order by created_at desc
    limit 24
  ),
  older_pebbles as (
    select 1
    from public.pebbles
    where pair_id = target_pair_id
    order by created_at desc
    offset 24
  )
  select jsonb_build_object(
    'foundation_density', least(96, (select count(*) from older_pebbles)),
    'recent_pebbles', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'sender_id', sender_id,
            'touched', touched,
            'created_at', created_at
          )
          order by created_at asc
        )
        from recent_pebbles
      ),
      '[]'::jsonb
    )
  ) into memory;

  return memory;
end;
$$;

revoke execute on function public.get_shore_memory(uuid) from public, anon;
grant execute on function public.get_shore_memory(uuid) to authenticated;
