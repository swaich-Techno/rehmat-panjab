begin;

create or replace function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$
begin if not coalesce(value,false) then raise exception 'RLS assertion failed: %',message; end if; end; $$;

insert into auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001','one@example.test','authenticated','authenticated','{}','{}'),
  ('20000000-0000-0000-0000-000000000002','two@example.test','authenticated','authenticated','{}','{}'),
  ('30000000-0000-0000-0000-000000000003','admin@example.test','authenticated','authenticated','{}','{}');
update public.profiles set role='super_admin' where id='30000000-0000-0000-0000-000000000003';

insert into public.customer_addresses(user_id,recipient_name,mobile,email,house,street_village,locality,city,district,state,pin_code,address_type)
values
  ('10000000-0000-0000-0000-000000000001','One','+917000000001','one@example.test','1','Street','Locality','Ludhiana','Ludhiana','Punjab','141001','Home'),
  ('20000000-0000-0000-0000-000000000002','Two','+917000000002','two@example.test','2','Street','Locality','Ludhiana','Ludhiana','Punjab','141001','Home');

insert into public.customer_carts(id,user_id) values
  ('11000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002');
insert into public.customer_cart_items(cart_id,line_key,kind,variant_id,quantity)
select '11000000-0000-0000-0000-000000000001','one-item','product',id,1 from public.product_variants limit 1;
insert into public.customer_cart_items(cart_id,line_key,kind,variant_id,quantity)
select '22000000-0000-0000-0000-000000000002','two-item','product',id,1 from public.product_variants limit 1;

insert into public.orders(id,user_id,status,currency,total_paise,delivery_snapshot) values
  ('12000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','paid','INR',10000,'{"email":"one@example.test"}'),
  ('22000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','paid','INR',10000,'{"email":"two@example.test"}'),
  ('13000000-0000-0000-0000-000000000001',null,'request','INR',10000,'{"email":"one@example.test"}'),
  ('23000000-0000-0000-0000-000000000002',null,'request','INR',10000,'{"email":"two@example.test"}');
insert into public.order_items(order_id,variant_id,quantity,unit_price_paise)
select '12000000-0000-0000-0000-000000000001',id,1,10000 from public.product_variants limit 1;
insert into public.order_items(order_id,variant_id,quantity,unit_price_paise)
select '22000000-0000-0000-0000-000000000002',id,1,10000 from public.product_variants limit 1;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","email":"one@example.test","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=1 from public.profiles),'customer sees only own profile');
select pg_temp.assert_true((select count(*)=1 from public.customer_addresses),'customer sees only own address');
select pg_temp.assert_true((select count(*)=1 from public.customer_carts),'customer sees only own cart');
select pg_temp.assert_true((select count(*)=1 from public.customer_cart_items),'customer sees only own cart item');
select pg_temp.assert_true((select count(*)=1 from public.orders),'customer sees only own order');
select pg_temp.assert_true((select count(*)=1 from public.order_items),'customer sees only own order item');
select pg_temp.assert_true((select count(*)=0 from public.tester_variant_costs),'customer cannot read private tester COGS');
select pg_temp.assert_true((select count(*)=0 from public.tester_pack_rules),'customer cannot read private pack costs');
select pg_temp.assert_true((select count(*)=0 from public.tester_product_intake),'customer cannot read private supplier references or draft content');
select pg_temp.assert_true(public.claim_guest_order('13000000-0000-0000-0000-000000000001'),'matching verified email can claim a guest order');
select pg_temp.assert_true(not public.claim_guest_order('23000000-0000-0000-0000-000000000002'),'different email cannot claim a guest order');
do $$ begin
  begin
    update public.profiles set role='super_admin' where id='10000000-0000-0000-0000-000000000001';
    raise exception 'RLS assertion failed: customer changed role';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000003","email":"admin@example.test","role":"authenticated"}',true);
select pg_temp.assert_true(public.is_super_admin(),'super-admin role resolves through the protected profile');
select pg_temp.assert_true((select count(*)=25 from public.tester_variant_costs),'super-admin can read all private tester costs');
select pg_temp.assert_true((select count(*)=3 from public.tester_pack_rules),'super-admin can read all pack rules');
select pg_temp.assert_true((select count(*)=25 from public.tester_product_intake),'super-admin can read all private tester intake rows');

reset role;
rollback;
