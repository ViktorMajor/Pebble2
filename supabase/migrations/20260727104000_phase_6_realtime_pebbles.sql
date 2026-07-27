do $$
begin
  alter publication supabase_realtime add table public.pebbles;
exception
  when duplicate_object then null;
end;
$$;
