begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select has_function(
  'public',
  'create_profile_for_new_user',
  array[]::name[],
  'profile creation is handled by a server-side auth trigger'
);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
values (
  'f1500000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'release-profile@example.test',
  'test',
  now(),
  now(),
  now(),
  '{"display_name":"Release Person"}'::jsonb
);

select results_eq(
  $$ select display_name from public.profiles where id = 'f1500000-0000-4000-8000-000000000001' $$,
  array['Release Person'],
  'auth metadata creates the required profile without a client table write'
);

select results_eq(
  $$ select count(*)::int
     from information_schema.triggers
     where event_object_schema = 'auth'
       and event_object_table = 'users'
       and trigger_name = 'create_profile_after_auth_user_insert' $$,
  array[1],
  'profile trigger is attached to auth.users'
);

select * from finish();

rollback;
