begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'pairs', 'pairs table exists');
select has_table('public', 'pair_members', 'pair_members table exists');
select has_table('public', 'pebbles', 'pebbles table exists');

select has_column('public', 'pebbles', 'touched', 'pebbles has touched boolean');
select col_not_null('public', 'pebbles', 'touched', 'pebbles.touched is not nullable');
select col_has_default('public', 'pebbles', 'touched', 'pebbles.touched has a default');

select hasnt_column('public', 'pebbles', 'message', 'pebbles has no message column');
select hasnt_column('public', 'pebbles', 'content', 'pebbles has no content column');
select hasnt_column('public', 'pebbles', 'caption', 'pebbles has no caption column');
select hasnt_column('public', 'pebbles', 'emoji', 'pebbles has no emoji column');
select hasnt_column('public', 'pebbles', 'reaction', 'pebbles has no reaction column');
select hasnt_column('public', 'pebbles', 'read_at', 'pebbles has no read_at column');
select hasnt_column('public', 'pebbles', 'seen_at', 'pebbles has no seen_at column');
select hasnt_column('public', 'pebbles', 'touched_at', 'pebbles has no touched_at column');

select policies_are(
  'public',
  'pebbles',
  array[
    'pebbles_select_for_pair_members'
  ],
  'pebbles has an explicit pair-member read policy'
);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000d4', 'authenticated', 'authenticated', 'extra@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('00000000-0000-4000-8000-0000000000a1', 'Alice'),
  ('00000000-0000-4000-8000-0000000000b2', 'Bob'),
  ('00000000-0000-4000-8000-0000000000c3', 'Mallory'),
  ('00000000-0000-4000-8000-0000000000d4', 'Extra');

insert into public.pairs (id, status)
values ('10000000-0000-4000-8000-000000000001', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000b2');

insert into public.pebbles (id, pair_id, sender_id)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1'
);

select throws_like(
  $$ insert into public.pair_members (pair_id, user_id)
     values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000d4') $$,
  '%at most two members%',
  'database rejects a third pair member'
);

select throws_like(
  $$ insert into public.pebbles (pair_id, sender_id, touched)
     values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', true) $$,
  '%cannot already be touched%',
  'database rejects pre-touched pebble inserts'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.pairs $$,
  array[1],
  'Alice can see her pair'
);

select results_eq(
  $$ select count(*)::int from public.pair_members $$,
  array[2],
  'Alice can see pair membership for her pair'
);

select results_eq(
  $$ select count(*)::int from public.pebbles $$,
  array[1],
  'Alice can see pebbles in her pair'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.pairs $$,
  array[0],
  'Mallory cannot see Alice and Bob pair'
);

select results_eq(
  $$ select count(*)::int from public.pair_members $$,
  array[0],
  'Mallory cannot see Alice and Bob pair membership'
);

select results_eq(
  $$ select count(*)::int from public.pebbles $$,
  array[0],
  'Mallory cannot see Alice and Bob pebbles'
);

select results_eq(
  $$ select count(*)::int from public.profiles
     where id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2') $$,
  array[0],
  'Mallory cannot see Alice or Bob profiles'
);

select throws_like(
  $$ insert into public.pebbles (pair_id, sender_id)
     values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c3') $$,
  '%permission denied%',
  'Mallory cannot send a pebble into Alice and Bob pair'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000b2';
set local request.jwt.claim.role = 'authenticated';

select * from public.touch_pebble('20000000-0000-4000-8000-000000000001');

select results_eq(
  $$ select touched from public.pebbles where id = '20000000-0000-4000-8000-000000000001' $$,
  array[true],
  'Bob can touch Alice incoming pebble'
);

select * from finish();

rollback;
