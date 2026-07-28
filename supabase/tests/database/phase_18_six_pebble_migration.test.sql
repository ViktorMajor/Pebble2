begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

select is(private.total_pair_pebbles(), 6, 'the permanent server constant is six');
select has_column('public', 'pair_pebbles', 'retired_at', 'retired identities remain auditable');
select has_column('public', 'pairs', 'pebble_model_status', 'connection migration state is explicit');
select has_column('public', 'pair_pebbles', 'visual_variant', 'six visual roles are stable');
select has_function('private', 'migrate_pair_to_six', array['uuid']::name[], 'deterministic migration function exists');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('18000000-0000-4000-8000-000000000001','authenticated','authenticated','alice18@example.test','test',now(),now(),now()),
('18000000-0000-4000-8000-000000000002','authenticated','authenticated','bob18@example.test','test',now(),now(),now());
insert into public.profiles(id,display_name) values
('18000000-0000-4000-8000-000000000001','Alice 18'),
('18000000-0000-4000-8000-000000000002','Bob 18');

insert into public.pairs(id,status) values ('18100000-0000-4000-8000-000000000001','active');
insert into public.pair_members(pair_id,user_id) values
('18100000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000001'),
('18100000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000002');

select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and retired_at is null),6,'new connection provisions six active identities');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and current_holder_id='18000000-0000-4000-8000-000000000001'),3,'creator receives three');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and current_holder_id='18000000-0000-4000-8000-000000000002'),3,'joiner receives three');
select is((select count(distinct id)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001'),6,'stable identities are unique');
select is((select count(distinct visual_seed)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001'),6,'visual identities are unique');
select is((select count(distinct visual_variant)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001'),6,'all six stable visual roles are present');

-- Recreate a safe Phase 17 eight-identity set: two extra untouched identities,
-- one held by each person. The migration deterministically retires one per bowl.
insert into public.pair_pebbles(pair_id,current_holder_id,visual_seed,visual_variant) values
('18100000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000001',2147483646,6),
('18100000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000002',2147483647,7);
create temporary table safe_participated as
select id from public.pair_pebbles
where pair_id='18100000-0000-4000-8000-000000000001' and visual_variant=0;
insert into public.pebbles(pair_id,pair_pebble_id,sender_id)
select '18100000-0000-4000-8000-000000000001',id,'18000000-0000-4000-8000-000000000001'
from safe_participated;
update public.pairs set pebble_model_status='legacy-six-migration-required' where id='18100000-0000-4000-8000-000000000001';
select is(private.migrate_pair_to_six('18100000-0000-4000-8000-000000000001'),'six','safe legacy set migrates automatically');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and retired_at is null),6,'safe migration leaves six active holders');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and retired_at is not null),2,'safe migration retires exactly two');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and current_holder_id='18000000-0000-4000-8000-000000000001' and retired_at is null),3,'safe untouched migration preserves three for creator');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001' and current_holder_id='18000000-0000-4000-8000-000000000002' and retired_at is null),3,'safe untouched migration preserves three for joiner');
select is((select retired_at is null from public.pair_pebbles where id=(select id from safe_participated)),true,'a participated identity is never retired');
select is((select count(*)::int from public.pebbles where pair_pebble_id=(select id from safe_participated)),1,'safe migration preserves participated transfer history');

-- An ambiguous legacy set has seven identities represented in real transfer
-- history. It is marked for review; none are silently retired or rewritten.
update public.pairs set status='closed',closed_at=now() where id='18100000-0000-4000-8000-000000000001';
insert into public.pairs(id,status) values ('18100000-0000-4000-8000-000000000002','active');
insert into public.pair_members(pair_id,user_id) values
('18100000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000001'),
('18100000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000002');
insert into public.pair_pebbles(pair_id,current_holder_id,visual_seed,visual_variant) values
('18100000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000001',2147483501,6),
('18100000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000002',2147483502,7);
insert into public.pebbles(pair_id,pair_pebble_id,sender_id)
select identities.pair_id,identities.id,identities.current_holder_id
from public.pair_pebbles identities
where identities.pair_id='18100000-0000-4000-8000-000000000002'
order by identities.visual_seed limit 7;
update public.pairs set pebble_model_status='legacy-six-migration-required' where id='18100000-0000-4000-8000-000000000002';
select is(private.migrate_pair_to_six('18100000-0000-4000-8000-000000000002'),'legacy-six-migration-required','ambiguous history is marked for explicit review');
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000002' and retired_at is not null),0,'ambiguous history retires nothing');
select is((select count(*)::int from public.pebbles where pair_id='18100000-0000-4000-8000-000000000002'),7,'ambiguous transfer history remains unchanged');

-- Clear only the rollback-scoped fixture events after proving preservation so
-- the pre-existing two-second send rest guard does not mask the model guard.
delete from public.pebbles where pair_id='18100000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claim.sub='18000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*)::int from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000001'),3,'RLS hides retired and partner-held identities');
select throws_like($$select * from public.send_pebble('phase18-legacy-block-0001',(select id from public.pair_pebbles where pair_id='18100000-0000-4000-8000-000000000002' limit 1))$$,'%migration review%','ambiguous connection cannot transfer');
reset role;

select is((select active_before from private.pair_pebble_migration_audit where pair_id='18100000-0000-4000-8000-000000000001'),8,'migration audit records the original active total');
select is((select retired_count from private.pair_pebble_migration_audit where pair_id='18100000-0000-4000-8000-000000000001'),2,'migration audit records retirement count');

select * from finish();
rollback;
