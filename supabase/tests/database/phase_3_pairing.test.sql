begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

select has_table('public', 'pair_invites', 'pair_invites table exists');
select has_column('public', 'pair_invites', 'token_hash', 'pair_invites stores token hash');
select hasnt_column('public', 'pair_invites', 'token', 'pair_invites does not store plaintext token');
select hasnt_column('public', 'pair_invites', 'invite_token', 'pair_invites does not store raw invite token');
select col_not_null('public', 'pair_invites', 'expires_at', 'pair_invites.expires_at is not nullable');
select col_not_null('public', 'pair_invites', 'consumed', 'pair_invites.consumed is not nullable');
select col_has_default('public', 'pair_invites', 'consumed', 'pair_invites.consumed has default');
select has_function('public', 'create_shore_with_invite', array[]::name[], 'create shore RPC exists');
select has_function('public', 'join_shore_with_invite', array['text']::name[], 'join shore RPC exists');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice3@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob3@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory3@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000d4', 'authenticated', 'authenticated', 'extra3@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('00000000-0000-4000-8000-0000000000a1', 'Alice'),
  ('00000000-0000-4000-8000-0000000000b2', 'Bob'),
  ('00000000-0000-4000-8000-0000000000c3', 'Mallory'),
  ('00000000-0000-4000-8000-0000000000d4', 'Extra');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

create temporary table alice_created_shore as
select * from public.create_shore_with_invite();

select results_eq(
  $$ select count(*)::int from alice_created_shore where length(invite_token) = 64 $$,
  array[1],
  'Alice receives a high-entropy invite token once'
);

reset role;

select results_eq(
  $$ select count(*)::int
     from public.pair_invites
     join alice_created_shore on alice_created_shore.pair_id = pair_invites.pair_id
     where encode(token_hash, 'hex') = alice_created_shore.invite_token $$,
  array[0],
  'database stores a non-reversible token hash, not the raw token'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.pairs $$,
  array[0],
  'Mallory cannot discover Alice shore'
);

select results_eq(
  $$ select count(*)::int from public.pair_members $$,
  array[0],
  'Mallory cannot inspect Alice shore membership'
);

select throws_like(
  $$ select count(*) from public.pair_invites $$,
  '%permission denied%',
  'Mallory cannot enumerate invitations through table APIs'
);

select throws_like(
  $$ insert into public.pair_members (pair_id, user_id)
     select pair_id, '00000000-0000-4000-8000-0000000000c3'
     from alice_created_shore $$,
  '%permission denied%',
  'Mallory cannot forge membership with direct insert'
);

select throws_like(
  $$ update public.pair_members
     set user_id = '00000000-0000-4000-8000-0000000000c3' $$,
  '%permission denied%',
  'Mallory cannot modify another user membership'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000b2';
set local request.jwt.claim.role = 'authenticated';

create temporary table bob_joined_shore as
select *
from public.join_shore_with_invite((select invite_token from alice_created_shore));

select results_eq(
  $$ select count(*)::int from bob_joined_shore $$,
  array[1],
  'Bob joins Alice shore through the server operation'
);

reset role;

select results_eq(
  $$ select count(*)::int
     from public.pair_members
     where pair_id = (select pair_id from alice_created_shore) $$,
  array[2],
  'Alice shore has exactly two members after Bob joins'
);

select results_eq(
  $$ select consumed
     from public.pair_invites
     where pair_id = (select pair_id from alice_created_shore) $$,
  array[true],
  'invite is consumed after successful join'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.join_shore_with_invite((select invite_token from alice_created_shore)) $$,
  array[0],
  'Mallory cannot reuse a consumed invite and receives no invitation state'
);

select results_eq(
  $$ select count(*)::int from public.pairs $$,
  array[0],
  'Mallory still cannot discover Alice and Bob shore after failed reuse'
);

reset role;

update public.pairs
set status = 'closed', closed_at = now()
where id in (
  select pair_members.pair_id
  from public.pair_members
  where pair_members.user_id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2')
);

insert into public.pairs (id, status)
values ('30000000-0000-4000-8000-000000000001', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1'),
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000b2');

insert into public.pair_invites (pair_id, token_hash, created_by, expires_at)
values (
  '30000000-0000-4000-8000-000000000001',
  private.hash_pair_invite_token('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
  '00000000-0000-4000-8000-0000000000a1',
  now() + interval '1 day'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.join_shore_with_invite('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') $$,
  array[0],
  'Mallory cannot join a full shore and receives no shore state'
);

reset role;

update public.pairs
set status = 'closed', closed_at = now()
where id in (
  select pair_members.pair_id
  from public.pair_members
  where pair_members.user_id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2')
);

insert into public.pairs (id, status)
values ('30000000-0000-4000-8000-000000000002', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a1'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000b2');

select throws_like(
  $$ insert into public.pair_members (pair_id, user_id)
     values ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000d4') $$,
  '%at most two members%',
  'database trigger rejects a third member independent of client behavior'
);

select results_eq(
  $$ select count(*)::int
     from public.pair_members
     where pair_id = '30000000-0000-4000-8000-000000000002' $$,
  array[2],
  'full shore remains at two members after rejected third insert'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::int from public.join_shore_with_invite('not-a-real-token') $$,
  array[0],
  'Mallory invalid token attempt is rejected without an oracle'
);

reset role;

select results_eq(
  $$ select count(*)::int
     from private.pair_invite_attempts
     where user_id = '00000000-0000-4000-8000-0000000000c3' $$,
  array[3],
  'failed invitation attempts persist after the RPC returns'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select * from public.join_shore_with_invite('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
select * from public.join_shore_with_invite('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc');
select * from public.join_shore_with_invite('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');
select * from public.join_shore_with_invite('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
select * from public.join_shore_with_invite('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
select * from public.join_shore_with_invite('1111111111111111111111111111111111111111111111111111111111111111');
select * from public.join_shore_with_invite('2222222222222222222222222222222222222222222222222222222222222222');
select * from public.join_shore_with_invite('3333333333333333333333333333333333333333333333333333333333333333');

reset role;

select results_eq(
  $$ select count(*)::int
     from private.pair_invite_attempts
     where user_id = '00000000-0000-4000-8000-0000000000c3' $$,
  array[10],
  'invalid invitation attempts are capped at ten per fifteen minutes'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select * from public.join_shore_with_invite('4444444444444444444444444444444444444444444444444444444444444444');

reset role;

select results_eq(
  $$ select count(*)::int
     from private.pair_invite_attempts
     where user_id = '00000000-0000-4000-8000-0000000000c3' $$,
  array[10],
  'rate-limited invitation attempts do not create additional records'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select ok(
  not has_function_privilege(
    'authenticated',
    'public.is_pair_member(uuid, uuid)'::regprocedure,
    'execute'
  ),
  'pair membership helper is not callable through the public RPC namespace'
);

select ok(
  not has_schema_privilege('authenticated', 'private', 'usage'),
  'private security helpers cannot be resolved by application clients'
);

select * from finish();

rollback;
