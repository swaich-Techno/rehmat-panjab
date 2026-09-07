-- Public review submission without exposing a service-role credential.
create or replace function public.submit_product_review(
  p_product_id uuid, p_display_name text, p_email text, p_rating integer,
  p_title text, p_body text, p_image_path text, p_fingerprint text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not exists(select 1 from public.review_settings where id=true and submissions_enabled=true)
    or not exists(select 1 from public.products where id=p_product_id and status='active' and reviews_enabled=true) then
    raise exception 'reviews_closed';
  end if;
  if char_length(trim(p_display_name)) not between 2 and 80 or char_length(trim(p_email)) not between 3 and 254
    or p_rating not between 1 and 5 or char_length(trim(p_title)) not between 2 and 120
    or char_length(trim(p_body)) not between 20 and 2000 or char_length(p_fingerprint) <> 64 then
    raise exception 'invalid_review';
  end if;
  if (select count(*) from public.review_submission_attempts where fingerprint=p_fingerprint and created_at > now()-interval '1 hour') >= 3 then
    raise exception 'rate_limited';
  end if;
  insert into public.review_submission_attempts(fingerprint) values (p_fingerprint);
  insert into public.product_reviews(product_id,display_name,email,rating,title,body,image_path,status,verified_purchase,original_content)
  values (p_product_id,
    trim(regexp_replace(p_display_name,'<[^>]*>','','g')), lower(trim(p_email)), p_rating,
    trim(regexp_replace(p_title,'<[^>]*>','','g')), trim(regexp_replace(p_body,'<[^>]*>','','g')),
    nullif(p_image_path,''),'pending',false,
    jsonb_build_object('display_name',trim(p_display_name),'title',trim(p_title),'body',trim(p_body)))
  returning id into new_id;
  return new_id;
end $$;
revoke all on function public.submit_product_review(uuid,text,text,integer,text,text,text,text) from public;
grant execute on function public.submit_product_review(uuid,text,text,integer,text,text,text,text) to anon,authenticated;

create or replace function public.can_upload_review_image(object_name text) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.product_reviews where image_path=object_name and status='pending' and created_at > now()-interval '10 minutes');
$$;
create or replace function public.is_approved_review_image(object_name text) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.product_reviews where image_path=object_name and status='approved');
$$;
grant execute on function public.can_upload_review_image(text), public.is_approved_review_image(text) to anon,authenticated;

drop policy if exists "review images constrained insert" on storage.objects;
create policy "review images constrained insert" on storage.objects for insert to anon,authenticated
with check (bucket_id='review-images' and public.can_upload_review_image(name));
drop policy if exists "approved review images read" on storage.objects;
create policy "approved review images read" on storage.objects for select to anon,authenticated
using (bucket_id='review-images' and public.is_approved_review_image(name));
