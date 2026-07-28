begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

select has_table('public','pair_pebbles','stable pair pebble identities exist');
select has_column('public','pair_pebbles','visual_seed','visual identity is persisted');
select has_column('public','pair_pebbles','current_holder_id','current holder is persisted');
select has_column('public','pebbles','pair_pebble_id','transfer events reference stable identities');
select hasnt_column('public','pebbles','touched_at','touch time is not relationship telemetry');
select has_function('public','send_pebble',array['text','uuid']::name[],'selected pebble transfer RPC exists');
select has_function('public','get_bowl_state',array['uuid']::name[],'private bowl state RPC exists');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('17000000-0000-4000-8000-000000000001','authenticated','authenticated','alice17@example.test','test',now(),now(),now()),
('17000000-0000-4000-8000-000000000002','authenticated','authenticated','bob17@example.test','test',now(),now(),now()),
('17000000-0000-4000-8000-000000000003','authenticated','authenticated','mallory17@example.test','test',now(),now(),now());
insert into public.profiles(id,display_name) values
('17000000-0000-4000-8000-000000000001','Alice'),('17000000-0000-4000-8000-000000000002','Bob'),('17000000-0000-4000-8000-000000000003','Mallory');
insert into public.pairs(id,status) values ('17100000-0000-4000-8000-000000000001','active');
insert into public.pair_members(pair_id,user_id) values
('17100000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001'),
('17100000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000002');

select is((select count(*)::int from public.pair_pebbles where pair_id='17100000-0000-4000-8000-000000000001' and retired_at is null),6,'each completed connection has the configured finite set');
select is((select count(distinct visual_seed)::int from public.pair_pebbles where pair_id='17100000-0000-4000-8000-000000000001' and retired_at is null),6,'visual seeds are unique and stable in a connection');
select is((select count(*)::int from public.pair_pebbles where current_holder_id='17000000-0000-4000-8000-000000000001' and retired_at is null),3,'creator initially holds half');
select is((select count(*)::int from public.pair_pebbles where current_holder_id='17000000-0000-4000-8000-000000000002' and retired_at is null),3,'joining member initially holds half');

set local role authenticated;
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*)::int from public.pair_pebbles),3,'member can read only identities in their own bowl');
create temporary table selected as select id from public.pair_pebbles where current_holder_id='17000000-0000-4000-8000-000000000001' order by visual_seed limit 1;
create temporary table transfer_one as select * from public.send_pebble('phase17-alice-transfer-000001',(select id from selected));
select is((select count(*)::int from transfer_one),1,'owned pebble transfers once');
reset role;
select is((select current_holder_id from public.pair_pebbles where id=(select id from selected)),'17000000-0000-4000-8000-000000000002'::uuid,'transfer changes the holder to the partner');
select is((select sender_id from public.pebbles where id=(select transfer_event_id from transfer_one)),'17000000-0000-4000-8000-000000000001'::uuid,'sender is derived from authentication');
set local role authenticated; set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001'; set local request.jwt.claim.role='authenticated';
create temporary table transfer_retry as select * from public.send_pebble('phase17-alice-transfer-000001',(select id from selected));
select is((select transfer_event_id from transfer_retry),(select transfer_event_id from transfer_one),'duplicate request is idempotent');
select is((select count(*)::int from public.pebbles where pair_pebble_id=(select id from selected)),1,'idempotent retry creates no duplicate event');
select throws_like($$select * from public.send_pebble('phase17-alice-transfer-000002',(select id from selected))$$,'%Pebble unavailable%','sender cannot transfer a partner-held pebble');
select throws_like($$update public.pair_pebbles set current_holder_id='17000000-0000-4000-8000-000000000001' where id=(select id from selected)$$,'%permission denied%','clients cannot mutate holder state directly');

reset role; set local role authenticated;
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000003'; set local request.jwt.claim.role='authenticated';
select is((select count(*)::int from public.pair_pebbles),0,'non-member cannot read identities');
select throws_like($$select * from public.send_pebble('phase17-mallory-transfer-0001',(select id from selected))$$,'%Pebble unavailable%','non-member cannot transfer a private pebble');

reset role; set local role authenticated;
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000002'; set local request.jwt.claim.role='authenticated';
select lives_ok($$select * from public.touch_pebble((select transfer_event_id from transfer_one))$$,'recipient can touch the latest incoming transfer');
select is((select touched from public.pebbles where id=(select transfer_event_id from transfer_one)),true,'touch persists without a timestamp');
create temporary table transfer_back as select * from public.send_pebble('phase17-bob-transfer-0000001',(select id from selected));
reset role;
select is((select current_holder_id from public.pair_pebbles where id=(select id from selected)),'17000000-0000-4000-8000-000000000001'::uuid,'the same identity can travel back');
set local role authenticated; set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000002'; set local request.jwt.claim.role='authenticated';
select throws_like($$select * from public.touch_pebble((select transfer_event_id from transfer_one))$$,'%no longer awaiting touch%','only the latest eligible transfer can be touched');

reset role; set local role authenticated;
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001'; set local request.jwt.claim.role='authenticated';
select lives_ok($$select * from public.touch_pebble((select transfer_event_id from transfer_back))$$,'new recipient can touch the latest arrival');
select lives_ok($$select * from public.close_shore('17100000-0000-4000-8000-000000000001')$$,'connection can close without deleting identities or history');
select throws_like($$select * from public.send_pebble('phase17-closed-transfer-0001',(select id from selected))$$,'%Pebble unavailable%','closed connection blocks transfer');
reset role;
select is((select count(*)::int from public.pair_pebbles where pair_id='17100000-0000-4000-8000-000000000001' and retired_at is null),6,'closing preserves the finite identity set');

select * from finish();
rollback;
