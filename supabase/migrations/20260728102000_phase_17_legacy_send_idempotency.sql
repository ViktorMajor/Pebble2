-- Preserve idempotency for the temporary one-argument compatibility RPC even
-- after its originally selected physical pebble has moved to the other bowl.
create or replace function public.send_pebble(send_request_key text)
returns table (pebble_id uuid,pair_id uuid,created_at timestamptz)
language plpgsql security definer set search_path=public,private
as $$
declare selected_id uuid; existing_request private.pebble_send_requests%rowtype;
begin
  select * into existing_request from private.pebble_send_requests requests
  where requests.user_id=auth.uid() and requests.request_key=btrim(send_request_key);
  if existing_request.id is not null then
    return query select events.id,events.pair_id,events.created_at from public.pebbles events where events.id=existing_request.pebble_id;
    return;
  end if;
  select identities.id into selected_id from public.pair_pebbles identities
  join public.pairs selected_pair on selected_pair.id=identities.pair_id
  where identities.current_holder_id=auth.uid() and selected_pair.status='active'
  order by identities.visual_seed limit 1;
  if selected_id is null then raise exception 'No held pebble is available.'; end if;
  return query select result.transfer_event_id,result.pair_id,result.created_at from public.send_pebble(send_request_key,selected_id) result;
end;
$$;
revoke execute on function public.send_pebble(text) from public,anon;
grant execute on function public.send_pebble(text) to authenticated;
