-- Additive public-media update for the owner-approved rose-gold bottle reference.
-- Variant and inventory records are not changed.
with approved_notes(slug,notes) as (values
  ('musk-rizali','{"top":["Bergamot"],"heart":["Saffron"],"base":["White Musk"]}'::jsonb),
  ('vanilla-musk','{"top":["Vanilla Bean"],"heart":["Almond"],"base":["White Musk"]}'::jsonb),
  ('white-oud','{"top":["White Pepper"],"heart":["Bergamot"],"base":["Soft Woods"]}'::jsonb),
  ('oud-rose','{"top":["Rose Petals"],"heart":["Pink Pepper"],"base":["Raspberry"]}'::jsonb),
  ('junoon','{"top":["Passionfruit"],"heart":["Turkish Rose"],"base":["Saffron"]}'::jsonb),
  ('red-musk','{"top":["Red Berries"],"heart":["Saffron"],"base":["White Musk"]}'::jsonb),
  ('nazakat','{"top":["Lychee"],"heart":["Rhubarb"],"base":["Bergamot"]}'::jsonb),
  ('zara-candy','{"top":["Candied Pear"],"heart":["Strawberry"],"base":["Vanilla"]}'::jsonb),
  ('deer-musk','{"top":["Cardamom"],"heart":["Bergamot"],"base":["Velvet Musk"]}'::jsonb)
)
update public.products p
set notes=a.notes,notes_verified=true,updated_at=now()
from approved_notes a
where p.slug=a.slug;

with products_for_media as (
  select id,name from public.products
  where slug in ('musk-rizali','vanilla-musk','white-oud','oud-rose','junoon','red-musk','nazakat','zara-candy','deer-musk','afsoon')
), media as (
  select p.id as product_id,p.name,v.role,v.path,v.sort_order
  from products_for_media p
  cross join (values
    ('product','/images/bottles/rose-gold-bottle-oil.webp',0),
    ('card','/images/bottles/rose-gold-bottle-oil.webp',10),
    ('hero','/images/bottles/rose-gold-bottle-oil.webp',20),
    ('social','/images/bottles/rose-gold-bottle-social.webp',40)
  ) as v(role,path,sort_order)
)
insert into public.product_media(product_id,role,storage_path,alt_text,is_generated,status,sort_order)
select product_id,role,path,name || ' perfume oil by Rehmat Panjab',true,'active',sort_order from media
on conflict (product_id,role) where status='active' do update
set storage_path=excluded.storage_path,alt_text=excluded.alt_text,is_generated=true,sort_order=excluded.sort_order,updated_at=now();

update public.products
set image_path='/images/bottles/rose-gold-bottle-oil.webp',
    og_image_path='/images/bottles/rose-gold-bottle-social.webp',
    image_alt_text=name || ' perfume oil by Rehmat Panjab',
    notes_verified=case
      when jsonb_array_length(coalesce(notes->'top','[]'::jsonb))>0
       and jsonb_array_length(coalesce(notes->'heart','[]'::jsonb))>0
       and jsonb_array_length(coalesce(notes->'base','[]'::jsonb))>0 then true
      else notes_verified
    end,
    updated_at=now()
where slug in ('musk-rizali','vanilla-musk','white-oud','oud-rose','junoon','red-musk','nazakat','zara-candy','deer-musk','afsoon');

update public.bottles
set photo_path='/images/bottles/rose-gold-bottle-oil.webp',
    thumbnail_path='/images/bottles/rose-gold-bottle-oil-thumb.webp',
    alt_text=coalesce(nullif(alt_text,''), public_label || ' rose-gold perfume-oil bottle'),
    updated_at=now()
where status='active' and volume_ml in (6,12);

update public.experience_settings
set guide_greeting='Sat Sri Akal. Tell me what you want your fragrance to feel like, and I''ll help you choose.',
    guide_prompts=array[
      'Help me choose my first oil',
      'Find something for everyday wear',
      'Suggest an evening fragrance',
      'Compare two fragrances',
      'Build a layering combination',
      'Show fragrances within my budget'
    ],
    updated_at=now()
where id=true;
