begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pebbles'
  ),
  'pebbles is published to Supabase Realtime'
);

select policy_roles_are(
  'public',
  'pebbles',
  'pebbles_select_for_pair_members',
  array['authenticated'],
  'Realtime source rows remain limited to authenticated shore members'
);

select hasnt_column('public', 'pebbles', 'touched_at', 'Realtime adds no touch timestamp');
select hasnt_column('public', 'pebbles', 'seen_at', 'Realtime adds no seen timestamp');

select * from finish();

rollback;
