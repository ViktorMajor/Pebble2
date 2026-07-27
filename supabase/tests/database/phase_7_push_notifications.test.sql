begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select has_table('public', 'device_push_tokens', 'device push token table exists');
select has_column('public', 'device_push_tokens', 'user_id', 'token belongs to a user');
select has_column('public', 'device_push_tokens', 'expo_push_token', 'token value is stored');
select has_column('public', 'device_push_tokens', 'platform', 'token platform is stored');
select has_column('public', 'device_push_tokens', 'created_at', 'token creation time is stored');
select has_column('public', 'device_push_tokens', 'updated_at', 'token update time is stored');
select has_table('public', 'pebble_push_deliveries', 'server delivery idempotency table exists');

select policies_are(
  'public',
  'device_push_tokens',
  array[
    'device_push_tokens_delete_own',
    'device_push_tokens_insert_own',
    'device_push_tokens_select_own',
    'device_push_tokens_update_own'
  ],
  'device tokens have owner-only policies'
);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('70000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice-push@example.test', 'test', now(), now(), now()),
  ('70000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob-push@example.test', 'test', now(), now(), now()),
  ('70000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory-push@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('70000000-0000-4000-8000-0000000000a1', 'Alice Push'),
  ('70000000-0000-4000-8000-0000000000b2', 'Bob Push'),
  ('70000000-0000-4000-8000-0000000000c3', 'Mallory Push');

insert into public.device_push_tokens (id, user_id, expo_push_token, platform)
values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[AliceDeviceToken000000000000]', 'ios'),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-0000000000b2', 'ExponentPushToken[BobDeviceToken00000000000000]', 'android');

set local role authenticated;
set local request.jwt.claim.sub = '70000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.device_push_tokens $$,
  array[1],
  'Alice can read only her own token'
);

select results_eq(
  $$ select count(*)::int from public.device_push_tokens where user_id = '70000000-0000-4000-8000-0000000000b2' $$,
  array[0],
  'Alice cannot read her partner token'
);

select lives_ok(
  $$ update public.device_push_tokens
       set platform = 'android'
       where id = '71000000-0000-4000-8000-000000000001' $$,
  'Alice can update her own token'
);

select throws_like(
  $$ insert into public.device_push_tokens (user_id, expo_push_token, platform)
       values ('70000000-0000-4000-8000-0000000000b2', 'ExponentPushToken[CannotCreateForPartner000000]', 'ios') $$,
  '%row-level security%',
  'Alice cannot create a token for Bob'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '70000000-0000-4000-8000-0000000000b2';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.device_push_tokens where user_id = '70000000-0000-4000-8000-0000000000a1' $$,
  array[0],
  'Bob cannot read Alice token'
);

select results_eq(
  $$ with changed as (
       update public.device_push_tokens
       set platform = 'android'
       where id = '71000000-0000-4000-8000-000000000001'
       returning id
     ) select count(*)::int from changed $$,
  array[0],
  'Bob cannot update Alice token'
);

select results_eq(
  $$ with removed as (
       delete from public.device_push_tokens
       where id = '71000000-0000-4000-8000-000000000001'
       returning id
     ) select count(*)::int from removed $$,
  array[0],
  'Bob cannot delete Alice token'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '70000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.device_push_tokens $$,
  array[0],
  'Mallory cannot read Alice or Bob tokens'
);

select throws_like(
  $$ insert into public.device_push_tokens (user_id, expo_push_token, platform)
       values ('70000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[MalloryCannotForgeOwner00000]', 'ios') $$,
  '%row-level security%',
  'Mallory cannot forge another user token'
);

select * from finish();

rollback;
