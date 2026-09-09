-- Owner-confirmed opening stock for every active 6 ml and 12 ml catalogue variant.
-- Reserved quantities are preserved so existing order reservations remain intact.
update public.inventory as stock
set quantity = 10,
    low_stock_threshold = 2,
    updated_at = now()
from public.product_variants as variant
join public.products as product on product.id = variant.product_id
where stock.variant_id = variant.id
  and product.status = 'active'
  and product.slug in (
    'musk-rizali','vanilla-musk','white-oud','oud-rose','junoon',
    'red-musk','nazakat','zara-candy','deer-musk','afsoon'
  )
  and variant.enabled = true
  and variant.size_ml in (6, 12);

update public.products
set image_alt_text = 'AFSOON fragrance house oil-drop illustration', updated_at = now()
where slug = 'afsoon'
  and image_path = '/images/products/product-image-pending.svg';
