begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

select has_function('public', 'close_shore', array['uuid'], 'close shore operation exists');
select hasnt_column('public', 'pebbles', 'touched_at', 'lifecycle adds no touch timestamp');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('80000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice-life@example.test', 'test', now(), now(), now()),
  ('80000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob-life@example.test', 'test', now(), now(), now()),
  ('80000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory-life@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('80000000-0000-4000-8000-0000000000a1', 'Alice Life'),
  ('80000000-0000-4000-8000-0000000000b2', 'Bob Life'),
  ('80000000-0000-4000-8000-0000000000c3', 'Mallory Life');

insert into public.pairs (id, status)
values ('81000000-0000-4000-8000-000000000001', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-0000000000a1'),
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-0000000000b2');

insert into public.pair_invites (pair_id, token_hash, created_by, expires_at)
values (
  '81000000-0000-4000-8000-000000000001',
  extensions.digest('lifecycle-invite', 'sha256'),
  '80000000-0000-4000-8000-0000000000a1',
  now() + interval '1 day'
);

insert into public.pebbles (id, pair_id, sender_id)
values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-0000000000a1'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-0000000000b2');

insert into public.device_push_tokens (user_id, expo_push_token, platform)
values ('80000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[AliceLifecycleDevice0000000000]', 'ios');

set local role authenticated;
set local request.jwt.claim.sub = '80000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select lives_ok(
  $$ select * from public.close_shore('81000000-0000-4000-8000-000000000001') $$,
  'either shore member can close an active shore without approval'
);

select results_eq(
  $$ select status from public.pairs where id = '81000000-0000-4000-8000-000000000001' $$,
  array['closed'],
  'closing changes shore state to closed'
);

select ok(
  (select closed_at is not null from public.pairs where id = '81000000-0000-4000-8000-000000000001'),
  'closing records closed state without relationship metrics'
);

reset role;

select results_eq(
  $$ select count(*)::int from public.pair_invites where pair_id = '81000000-0000-4000-8000-000000000001' $$,
  array[0],
  'closing removes outstanding invitations'
);

set local role authenticated;
set local request.jwt.claim.sub = '80000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.pebbles $$,
  array[2],
  'closing preserves historical pebbles'
);

select throws_like(
  $$ select * from public.touch_pebble('82000000-0000-4000-8000-000000000002') $$,
  '%connection is closed%',
  'closed shore rejects new touches'
);

select throws_like(
  $$ select * from public.send_pebble('alice-closed-lifecycle-request-000001') $$,
  '%No held pebble is available%',
  'closed shore rejects new sends'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '80000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ select * from public.close_shore('81000000-0000-4000-8000-000000000001') $$,
  '%Shore unavailable%',
  'unrelated user cannot close a private shore'
);

reset role;

delete from auth.users
where id = '80000000-0000-4000-8000-0000000000a1';

select results_eq(
  $$ select count(*)::int from public.profiles where id = '80000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'account deletion removes the departing profile'
);

select results_eq(
  $$ select count(*)::int from public.pair_members where user_id = '80000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'account deletion removes the departing memberships'
);

select results_eq(
  $$ select count(*)::int from public.device_push_tokens where user_id = '80000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'account deletion removes departing push tokens'
);

select results_eq(
  $$ select count(*)::int from public.pair_invites where created_by = '80000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'account deletion removes invitations created by the departing user'
);

select results_eq(
  $$ select count(*)::int from public.pebbles where sender_id = '80000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'account deletion removes only departing user pebbles'
);

select results_eq(
  $$ select count(*)::int from public.pebbles where sender_id = '80000000-0000-4000-8000-0000000000b2' $$,
  array[1],
  'account deletion preserves the other member historical pebbles'
);

select results_eq(
  $$ select count(*)::int from public.profiles where id = '80000000-0000-4000-8000-0000000000b2' $$,
  array[1],
  'account deletion does not remove the other profile'
);

select results_eq(
  $$ select count(*)::int from public.pair_members where user_id = '80000000-0000-4000-8000-0000000000b2' $$,
  array[1],
  'account deletion preserves the other membership'
);

select results_eq(
  $$ select status from public.pairs where id = '81000000-0000-4000-8000-000000000001' $$,
  array['closed'],
  'account deletion leaves the other member a closed static shore'
);

select * from finish();

rollback;
