-- Let the invitation creator observe the second member arriving. RLS remains
-- the visibility boundary, and no presence/activity data is published.
do $$
begin
  alter publication supabase_realtime add table public.pair_members;
exception when duplicate_object then null;
end;
$$;
