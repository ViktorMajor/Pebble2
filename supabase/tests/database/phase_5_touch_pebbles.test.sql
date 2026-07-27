begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select has_function('public', 'touch_pebble', array['uuid'], 'recipient touch operation exists');
select hasnt_column('public', 'pebbles', 'touched_at', 'pebbles has no touch timestamp');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('50000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice-touch@example.test', 'test', now(), now(), now()),
  ('50000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob-touch@example.test', 'test', now(), now(), now()),
  ('50000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory-touch@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('50000000-0000-4000-8000-0000000000a1', 'Alice Touch'),
  ('50000000-0000-4000-8000-0000000000b2', 'Bob Touch'),
  ('50000000-0000-4000-8000-0000000000c3', 'Mallory Touch');

insert into public.pairs (id, status)
values ('51000000-0000-4000-8000-000000000001', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000a1'),
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000b2');

insert into public.pebbles (id, pair_id, sender_id)
values
  ('52000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000a1'),
  ('52000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000a1');

set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-0000000000b2';
set local request.jwt.claim.role = 'authenticated';

select lives_ok(
  $$ select * from public.touch_pebble('52000000-0000-4000-8000-000000000001') $$,
  'recipient can touch an incoming pebble'
);

select results_eq(
  $$ select touched from public.pebbles where id = '52000000-0000-4000-8000-000000000001' $$,
  array[true],
  'recipient touch persists as true'
);

select throws_like(
  $$ update public.pebbles set touched = false where id = '52000000-0000-4000-8000-000000000001' $$,
  '%permission denied%',
  'recipient cannot directly revert a touched pebble'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ select * from public.touch_pebble('52000000-0000-4000-8000-000000000002') $$,
  '%sender cannot touch their own pebble%',
  'sender cannot touch their own pebble'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ select * from public.touch_pebble('52000000-0000-4000-8000-000000000002') $$,
  '%Pebble unavailable%',
  'unrelated user cannot touch a private pebble'
);

select throws_like(
  $$ update public.pebbles set touched = true where id = '52000000-0000-4000-8000-000000000002' $$,
  '%permission denied%',
  'unrelated user cannot directly update a private pebble'
);

reset role;

select throws_like(
  $$ update public.pebbles set touched = false where id = '52000000-0000-4000-8000-000000000001' $$,
  '%cannot be changed back%',
  'database trigger rejects a touched-to-untouched transition'
);

select lives_ok(
  $$ update public.pebbles set touched = true where id = '52000000-0000-4000-8000-000000000002' $$,
  'database trigger permits only untouched-to-touched transition'
);

select results_eq(
  $$ select touched from public.pebbles where id = '52000000-0000-4000-8000-000000000002' $$,
  array[true],
  'second pebble is irreversibly touched'
);

select * from finish();

rollback;
