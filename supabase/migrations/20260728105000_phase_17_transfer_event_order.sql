-- now() is transaction-stable. Physical transfer events need a strict backend
-- ordering even when security tests or retries exercise multiple RPCs in one
-- transaction. This timestamp is never exposed as relationship telemetry.
create function private.set_physical_transfer_event_time()
returns trigger language plpgsql set search_path=public
as $$ begin if new.pair_pebble_id is not null then new.created_at:=clock_timestamp(); end if; return new; end; $$;
create trigger pebbles_physical_transfer_time_before_insert
before insert on public.pebbles for each row execute function private.set_physical_transfer_event_time();
revoke all on function private.set_physical_transfer_event_time() from public,anon,authenticated;
