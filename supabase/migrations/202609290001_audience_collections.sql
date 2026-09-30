-- Additive merchandising classification for the Men, Women and Unisex edits.
-- These are discovery labels rather than restrictions: every product remains
-- available to every customer, and no commerce, variant or inventory data changes.
with classification(slug,suitability,suitability_note) as (values
  ('musk-rizali','unisex','Presented as unisex; choose by notes and mood'),
  ('vanilla-musk','unisex','Presented as unisex; choose by notes and mood'),
  ('white-oud','men','Fresh-woody direction; wearable by anyone'),
  ('oud-rose','women','Floral-fruity direction; wearable by anyone'),
  ('junoon','unisex','Presented as unisex; choose by notes and mood'),
  ('red-musk','unisex','Presented as unisex; choose by notes and mood'),
  ('nazakat','women','Radiant floral-fruity direction; wearable by anyone'),
  ('gulnaar','women','Sweet fruity direction; wearable by anyone'),
  ('deer-musk','men','Aromatic musky direction; wearable by anyone'),
  ('afsoon','unisex','Dark fruity-amber direction; wearable by anyone'),
  ('amber-veil','unisex','Amber-woody direction; wearable by anyone'),
  ('velvet-oud','women','Rose, oud and vanilla direction; wearable by anyone'),
  ('purple-oud','men','Dark oud and smoky-wood direction; wearable by anyone'),
  ('golden-dream','unisex','Warm gourmand direction; wearable by anyone'),
  ('dubai-chocolate','unisex','Chocolate-gourmand direction; wearable by anyone'),
  ('mahnoor','women','Berry-floral direction; wearable by anyone'),
  ('milaap','women','Rose and soft-musk direction; wearable by anyone'),
  ('sukoon-oud','unisex','Rose, oud and amber direction; wearable by anyone'),
  ('shaan-oud','men','Woody-spiced oud direction; wearable by anyone'),
  ('samandar','men','Fresh marine-woody direction; wearable by anyone'),
  ('neel','men','Fresh citrus-woody direction; wearable by anyone'),
  ('ishq','women','Fruity-floral direction; wearable by anyone'),
  ('siyah-oud','men','Spiced oud and amber direction; wearable by anyone'),
  ('safaa-musk','unisex','Clean white-musk direction; wearable by anyone'),
  ('adaa','women','Tropical fruity-floral direction; wearable by anyone')
)
update public.products product
set suitability=classification.suitability,
    suitability_note=classification.suitability_note,
    updated_at=now()
from classification
where product.slug=classification.slug
  and product.status<>'archived';
