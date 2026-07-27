begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select has_function('public', 'send_pebble', array['text']::name[], 'send_pebble RPC exists');
select has_table('private', 'pebble_send_requests', 'private idempotency table exists');
select hasnt_column('public', 'pebbles', 'message', 'pebbles still has no message column');
select hasnt_column('public', 'pebbles', 'content', 'pebbles still has no content column');
select hasnt_column('public', 'pebbles', 'metadata', 'pebbles has no arbitrary metadata column');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice4@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob4@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory4@example.test', 'test', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000d4', 'authenticated', 'authenticated', 'closed4@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('00000000-0000-4000-8000-0000000000a1', 'Alice'),
  ('00000000-0000-4000-8000-0000000000b2', 'Bob'),
  ('00000000-0000-4000-8000-0000000000c3', 'Mallory'),
  ('00000000-0000-4000-8000-0000000000d4', 'Closed');

insert into public.pairs (id, status, closed_at)
values
  ('40000000-0000-4000-8000-000000000001', 'active', null),
  ('40000000-0000-4000-8000-000000000002', 'active', null),
  ('40000000-0000-4000-8000-000000000003', 'closed', now());

insert into public.pair_members (pair_id, user_id)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1'),
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000b2'),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000c3');

-- Closed-pair membership is inserted before closure by temporarily reopening the pair.
update public.pairs
set status = 'active',
    closed_at = null
where id = '40000000-0000-4000-8000-000000000003';

insert into public.pair_members (pair_id, user_id)
values ('40000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000d4');

update public.pairs
set status = 'closed',
    closed_at = now()
where id = '40000000-0000-4000-8000-000000000003';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ insert into public.pebbles (pair_id, sender_id)
     values ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000b2') $$,
  '%permission denied%',
  'Alice cannot spoof Bob with direct pebble insert'
);

create temporary table alice_send as
select * from public.send_pebble('alice-request-000000000000000001');

select results_eq(
  $$ select count(*)::int from alice_send $$,
  array[1],
  'Alice can send exactly one pebble through RPC'
);

select results_eq(
  $$ select sender_id
     from public.pebbles
     where id = (select pebble_id from alice_send) $$,
  array['00000000-0000-4000-8000-0000000000a1'::uuid],
  'send_pebble sets sender_id from auth.uid'
);

select results_eq(
  $$ select count(*)::int
     from public.pebbles
     where pair_id = '40000000-0000-4000-8000-000000000001' $$,
  array[1],
  'Alice send creates one pebble in her active pair'
);

create temporary table alice_retry as
select * from public.send_pebble('alice-request-000000000000000001');

select results_eq(
  $$ select alice_send.pebble_id = alice_retry.pebble_id from alice_send, alice_retry $$,
  array[true],
  'retrying the same request key returns the same pebble'
);

select results_eq(
  $$ select count(*)::int
     from public.pebbles
     where pair_id = '40000000-0000-4000-8000-000000000001' $$,
  array[1],
  'idempotent retry does not create a duplicate pebble'
);

select throws_like(
  $$ select * from public.send_pebble('alice-request-000000000000000002') $$,
  '%temporarily resting%',
  'rapid second send with a new request key is rejected'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ insert into public.pebbles (pair_id, sender_id)
     values ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c3') $$,
  '%permission denied%',
  'Mallory cannot directly insert a pebble into Alice and Bob pair'
);

create temporary table mallory_send as
select * from public.send_pebble('mallory-request-00000000000001');

select results_eq(
  $$ select pair_id from mallory_send $$,
  array['40000000-0000-4000-8000-000000000002'::uuid],
  'Mallory RPC send targets only Mallory active pair'
);

select results_eq(
  $$ select count(*)::int
     from public.pebbles
     where pair_id = '40000000-0000-4000-8000-000000000001'
       and sender_id = '00000000-0000-4000-8000-0000000000c3' $$,
  array[0],
  'Mallory cannot insert pebbles into another pair through RPC'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000d4';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ select * from public.send_pebble('closed-request-000000000000001') $$,
  '%Exactly one active shore is required%',
  'closed pair rejects new pebbles'
);

select results_eq(
  $$ select count(*)::int
     from public.pebbles
     where pair_id = '40000000-0000-4000-8000-000000000003' $$,
  array[0],
  'closed pair has no new pebbles'
);

select * from finish();

rollback;
