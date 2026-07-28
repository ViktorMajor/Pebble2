begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_function('public', 'get_bowl_development_diagnostics', array['uuid'], 'development diagnostics RPC exists');
select function_returns('public', 'get_bowl_development_diagnostics', array['uuid'], 'jsonb', 'development diagnostics returns aggregate JSON');
select is((select prosecdef from pg_proc where oid = 'public.get_bowl_development_diagnostics(uuid)'::regprocedure), true, 'diagnostics derives access in a security definer boundary');
select is((select has_function_privilege('anon', 'public.get_bowl_development_diagnostics(uuid)', 'EXECUTE')), false, 'anonymous callers cannot inspect diagnostics');
select is((select has_function_privilege('authenticated', 'public.get_bowl_development_diagnostics(uuid)', 'EXECUTE')), true, 'authenticated members can call diagnostics');
select function_lang_is('public', 'get_bowl_development_diagnostics', array['uuid'], 'plpgsql', 'diagnostics uses protected database logic');
select matches(pg_get_functiondef('public.get_bowl_development_diagnostics(uuid)'::regprocedure), 'private\.is_pair_member', 'diagnostics verifies membership');
select doesnt_match(pg_get_functiondef('public.get_bowl_development_diagnostics(uuid)'::regprocedure), 'display_name|email|partner_id', 'diagnostics exposes no partner identity or profile data');

select * from finish();
rollback;
