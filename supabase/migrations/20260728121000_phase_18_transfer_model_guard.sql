-- Reapply the Phase 18 selected-transfer function for development databases
-- that applied the six-pebble structural migration before its final RPC guard.
create or replace function public.send_pebble(send_request_key text, selected_pair_pebble_id uuid)
returns table (transfer_event_id uuid, pair_pebble_id uuid, pair_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public, private, extensions
as $$
declare
  current_user_id uuid := auth.uid(); normalized_request_key text := btrim(send_request_key);
  selected_pebble public.pair_pebbles%rowtype; partner_user_id uuid;
  existing_request private.pebble_send_requests%rowtype; new_event public.pebbles%rowtype; model_status text;
begin
  if current_user_id is null then raise exception 'Authentication required.'; end if;
  if normalized_request_key is null or char_length(normalized_request_key) not between 16 and 128 then raise exception 'Invalid send request.'; end if;
  if selected_pair_pebble_id is null then raise exception 'Pebble unavailable.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || normalized_request_key, 0));
  select * into existing_request from private.pebble_send_requests requests where requests.user_id=current_user_id and requests.request_key=normalized_request_key;
  if existing_request.id is not null then
    if existing_request.pair_pebble_id is distinct from selected_pair_pebble_id then raise exception 'Send request already belongs to another pebble.'; end if;
    select events.id,events.pair_pebble_id,events.pair_id,events.created_at into transfer_event_id,pair_pebble_id,pair_id,created_at from public.pebbles events where events.id=existing_request.pebble_id;
    return next; return;
  end if;
  select pairs.pebble_model_status into model_status from public.pair_pebbles identities join public.pairs on pairs.id=identities.pair_id
  where identities.id=selected_pair_pebble_id and identities.current_holder_id=current_user_id and private.is_pair_member(identities.pair_id,current_user_id);
  if model_status='legacy-six-migration-required' then raise exception 'Connection requires six-pebble migration review.'; end if;
  select identities.* into selected_pebble from public.pair_pebbles identities join public.pairs on pairs.id=identities.pair_id
  where identities.id=selected_pair_pebble_id and identities.current_holder_id=current_user_id and identities.retired_at is null
    and pairs.status='active' and pairs.pebble_model_status='six' and private.is_pair_member(identities.pair_id,current_user_id)
  for update of identities;
  if selected_pebble.id is null then raise exception 'Pebble unavailable.'; end if;
  perform 1 from public.pairs selected_pair where selected_pair.id=selected_pebble.pair_id and selected_pair.status='active' and selected_pair.pebble_model_status='six' for update;
  if not found then raise exception 'This connection is closed.'; end if;
  select members.user_id into partner_user_id from public.pair_members members where members.pair_id=selected_pebble.pair_id and members.user_id<>current_user_id limit 1;
  if partner_user_id is null or (select count(*) from public.pair_members members where members.pair_id=selected_pebble.pair_id)<>2 then raise exception 'The connection is still waiting.'; end if;
  if exists(select 1 from public.pebbles recent_events where recent_events.sender_id=current_user_id and recent_events.pair_id=selected_pebble.pair_id and recent_events.created_at>now()-interval '2 seconds') then raise exception 'Pebble sending is temporarily resting.'; end if;
  insert into public.pebbles(pair_id,pair_pebble_id,sender_id) values(selected_pebble.pair_id,selected_pebble.id,current_user_id) returning * into new_event;
  update public.pair_pebbles set current_holder_id=partner_user_id where pair_pebbles.id=selected_pebble.id and retired_at is null;
  if not found then raise exception 'Pebble unavailable.'; end if;
  insert into private.pebble_send_requests(user_id,request_key,pair_id,pebble_id,pair_pebble_id) values(current_user_id,normalized_request_key,selected_pebble.pair_id,new_event.id,selected_pebble.id);
  transfer_event_id:=new_event.id; pair_pebble_id:=selected_pebble.id; pair_id:=new_event.pair_id; created_at:=new_event.created_at; return next;
end;
$$;
revoke execute on function public.send_pebble(text,uuid) from public,anon;
grant execute on function public.send_pebble(text,uuid) to authenticated;
