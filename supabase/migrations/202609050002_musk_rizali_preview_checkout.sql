alter table public.inventory
  add column if not exists low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0);

alter table public.orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;

create unique index if not exists orders_razorpay_order_id_idx on public.orders(razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists orders_razorpay_payment_id_idx on public.orders(razorpay_payment_id) where razorpay_payment_id is not null;

update public.products set status = 'active', updated_at = now() where slug = 'musk-rizali';

update public.product_variants as variant
set sku = 'RP-MR-06', price_paise = 59900, enabled = true, updated_at = now()
from public.products as product
where variant.product_id = product.id and product.slug = 'musk-rizali' and variant.size_ml = 6;

update public.inventory as stock
set quantity = 5, reserved = 0, low_stock_threshold = 2, updated_at = now()
from public.product_variants as variant
join public.products as product on product.id = variant.product_id
where stock.variant_id = variant.id and product.slug = 'musk-rizali' and variant.size_ml = 6;

update public.product_variants as variant
set enabled = false, updated_at = now()
from public.products as product
where variant.product_id = product.id and product.slug = 'musk-rizali' and variant.size_ml = 12 and variant.price_paise is null;

create or replace function public.complete_razorpay_order(p_razorpay_order_id text, p_razorpay_payment_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  item record;
  remaining integer := null;
  item_remaining integer;
begin
  select * into target_order from public.orders where razorpay_order_id = p_razorpay_order_id for update;
  if target_order.id is null then raise exception 'order_not_found'; end if;
  if target_order.status = 'paid' then
    if target_order.razorpay_payment_id is distinct from p_razorpay_payment_id then raise exception 'payment_mismatch'; end if;
    select min(stock.quantity - stock.reserved) into remaining
    from public.order_items oi join public.inventory stock on stock.variant_id = oi.variant_id
    where oi.order_id = target_order.id;
    return remaining;
  end if;

  for item in select variant_id, quantity from public.order_items where order_id = target_order.id loop
    update public.inventory
      set quantity = quantity - item.quantity, updated_at = now()
      where variant_id = item.variant_id and quantity - reserved >= item.quantity
      returning quantity - reserved into item_remaining;
    if not found then raise exception 'insufficient_stock'; end if;
    remaining := least(coalesce(remaining, item_remaining), item_remaining);
  end loop;

  update public.orders set status = 'paid', razorpay_payment_id = p_razorpay_payment_id, updated_at = now()
    where id = target_order.id;
  return remaining;
end;
$$;

revoke all on function public.complete_razorpay_order(text, text) from public, anon, authenticated;
grant execute on function public.complete_razorpay_order(text, text) to service_role;
