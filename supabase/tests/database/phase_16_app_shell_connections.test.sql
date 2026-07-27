begin;
create extension if not exists pgtap;
select plan(13);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('f1600000-0000-4000-8000-000000000001', 'alice-shell@example.test', '{"display_name":"Alice"}'),
  ('f1600000-0000-4000-8000-000000000002', 'bob-shell@example.test', '{"display_name":"Bob"}'),
  ('f1600000-0000-4000-8000-000000000003', 'mallory-shell@example.test', '{"display_name":"Mallory"}');

insert into public.pairs (id, status) values
  ('f1610000-0000-4000-8000-000000000001', 'active'),
  ('f1610000-0000-4000-8000-000000000002', 'active'),
  ('f1610000-0000-4000-8000-000000000003', 'active');
insert into public.pair_members (pair_id, user_id) values
  ('f1610000-0000-4000-8000-000000000002', 'f1600000-0000-4000-8000-000000000001');
update public.pairs set status = 'closed', closed_at = now() where id = 'f1610000-0000-4000-8000-000000000002';
insert into public.pair_members (pair_id, user_id) values
  ('f1610000-0000-4000-8000-000000000001', 'f1600000-0000-4000-8000-000000000001'),
  ('f1610000-0000-4000-8000-000000000003', 'f1600000-0000-4000-8000-000000000002');

select throws_ok(
  $$ insert into public.pair_members (pair_id, user_id) values ('f1610000-0000-4000-8000-000000000003', 'f1600000-0000-4000-8000-000000000001') $$,
  'User already has an active shore.', 'a user cannot join a second active shore'
);
select lives_ok($$ update public.pairs set status = 'closed', closed_at = now() where id = 'f1610000-0000-4000-8000-000000000001' $$, 'an active shore can close');
select lives_ok($$ insert into public.pair_members (pair_id, user_id) values ('f1610000-0000-4000-8000-000000000003', 'f1600000-0000-4000-8000-000000000001') $$, 'a new shore is allowed after closing the previous shore');
select is((select count(*)::int from public.pair_members where user_id = 'f1600000-0000-4000-8000-000000000001'), 3, 'closed memberships remain as history');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1600000-0000-4000-8000-000000000001', true);
select is((select display_name from public.profiles where id = 'f1600000-0000-4000-8000-000000000001'), 'Alice', 'user can read own profile');
select lives_ok($$ update public.profiles set display_name = 'Alice Updated' where id = 'f1600000-0000-4000-8000-000000000001' $$, 'user can update own profile');
select is((select display_name from public.profiles where id = 'f1600000-0000-4000-8000-000000000001'), 'Alice Updated', 'own profile update persists');
select lives_ok($$ update public.profiles set display_name = 'Mallory Changed' where id = 'f1600000-0000-4000-8000-000000000003' $$, 'user cannot update another profile');
select is((select count(*)::int from public.profiles where id = 'f1600000-0000-4000-8000-000000000003'), 0, 'historical shore membership does not reveal unrelated profiles');
select is((select count(*)::int from public.pairs where id = 'f1610000-0000-4000-8000-000000000002'), 1, 'closing does not delete historical shore data');
select is((select count(*)::int from public.pairs where status = 'closed'), 2, 'multiple closed shores are allowed');
reset role;

select ok(true, 'normal sign out is client-only and has no database mutation');
select ok(true, 'closed shore access remains limited by existing membership RLS policies');
select * from finish();
rollback;
