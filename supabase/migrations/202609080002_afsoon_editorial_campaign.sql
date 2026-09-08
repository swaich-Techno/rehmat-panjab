-- Keep Afsoon commerce imagery honest while retaining the supplied artwork as editorial material.
update public.products
set campaign_image_path = '/images/products/afsoon-editorial-campaign.webp',
    updated_at = now()
where slug = 'afsoon'
  and (campaign_image_path is null or campaign_image_path = '/images/products/product-image-pending.svg');
