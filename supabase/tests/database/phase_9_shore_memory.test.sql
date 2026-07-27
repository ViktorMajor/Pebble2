begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select has_function('public', 'get_shore_memory', array['uuid'], 'shore memory operation exists');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('90000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'alice-memory@example.test', 'test', now(), now(), now()),
  ('90000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'bob-memory@example.test', 'test', now(), now(), now()),
  ('90000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'mallory-memory@example.test', 'test', now(), now(), now());

insert into public.profiles (id, display_name)
values
  ('90000000-0000-4000-8000-0000000000a1', 'Alice Memory'),
  ('90000000-0000-4000-8000-0000000000b2', 'Bob Memory'),
  ('90000000-0000-4000-8000-0000000000c3', 'Mallory Memory');

insert into public.pairs (id, status)
values ('91000000-0000-4000-8000-000000000001', 'active');

insert into public.pair_members (pair_id, user_id)
values
  ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-0000000000a1'),
  ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-0000000000b2');

insert into public.pebbles (pair_id, sender_id, created_at)
select
  '91000000-0000-4000-8000-000000000001',
  case when sequence % 2 = 0 then '90000000-0000-4000-8000-0000000000a1'::uuid else '90000000-0000-4000-8000-0000000000b2'::uuid end,
  now() - (36 - sequence) * interval '1 minute'
from generate_series(1, 36) as sequence;

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-0000000000a1';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select jsonb_array_length(public.get_shore_memory('91000000-0000-4000-8000-000000000001')->'recent_pebbles') $$,
  array[24],
  'shore memory returns only a capped recent interactive set'
);

select results_eq(
  $$ select (public.get_shore_memory('91000000-0000-4000-8000-000000000001')->>'foundation_density')::int $$,
  array[12],
  'older pebbles become bounded shore foundation density'
);

select ok(
  not (public.get_shore_memory('91000000-0000-4000-8000-000000000001') ? 'total_count'),
  'shore memory exposes no total or relationship statistic'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-0000000000c3';
set local request.jwt.claim.role = 'authenticated';

select throws_like(
  $$ select public.get_shore_memory('91000000-0000-4000-8000-000000000001') $$,
  '%Shore unavailable%',
  'unrelated user cannot read private shore memory'
);

select throws_like(
  $$ select public.get_shore_memory('00000000-0000-4000-8000-000000000099') $$,
  '%Shore unavailable%',
  'memory operation does not reveal unknown shores'
);

select * from finish();

rollback;
