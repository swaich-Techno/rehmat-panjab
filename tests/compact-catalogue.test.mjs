import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("collection uses a compact responsive commerce grid",async()=>{
  const [page,catalogue,styles]=await Promise.all([read("app/collection/page.tsx"),read("app/collection/collection-catalogue.tsx"),read("app/globals.css")]);
  assert.match(page,/THE COLLECTION/);assert.match(page,/Ten concentrated perfume oils/);
  assert.match(styles,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);assert.match(styles,/@media\(max-width:1250px\).*repeat\(3,minmax\(0,1fr\)\)/s);assert.match(styles,/@media\(max-width:900px\).*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(catalogue,/catalogue-filter-panel/);assert.match(catalogue,/Quick view/i);assert.match(catalogue,/Order on WhatsApp/);assert.match(catalogue,/Add to cart/);
});

test("card interaction exposes one verified note from each layer",async()=>{
  const [catalogue,media]=await Promise.all([read("app/collection/collection-catalogue.tsx"),read("app/components/product-media.tsx")]);
  assert.match(catalogue,/product\.notes\.top\[0\]/);assert.match(catalogue,/product\.notes\.heart\[0\]/);assert.match(catalogue,/product\.notes\.base\[0\]/);
  assert.match(media,/product\.notesVerified/);assert.match(media,/rose-gold-bottle-oil\.webp/);assert.match(media,/rose-gold-bottle-reference\.jpeg/);
});

test("public product presentation removes internal artwork labels",async()=>{
  const [media,product,storefront,manifest]=await Promise.all([read("app/components/product-media.tsx"),read("app/product/[slug]/page.tsx"),read("lib/storefront.ts"),read("lib/product-media-manifest.ts")]);
  assert.doesNotMatch(`${media}${product}${storefront}${manifest}`,/Campaign Artwork|Campaign image|Illustration|Artwork 0[1-9]|Artwork 10/i);
  assert.match(manifest,/JUNOON/);assert.match(manifest,/NAZAKAT/);assert.match(manifest,/perfume oil by Rehmat Panjab/);
});

test("guide exposes availability and receives stable product context",async()=>{
  const [guide,api,settings]=await Promise.all([read("app/components/rehmat-guide.tsx"),read("app/api/rehmat-guide/route.ts"),read("lib/experience-settings.ts")]);
  assert.match(guide,/Rehmat Guide is available/);assert.match(guide,/Scent guidance available/);assert.match(guide,/productId:contextProductId\.current/);assert.match(api,/product\.databaseId===parsed\.data\.productId/);assert.match(settings,/Build a layering combination/);
});

test("catalogue migration preserves inventory while assigning exact product media",async()=>{
  const migration=await read("supabase/migrations/202609090003_compact_catalogue_bottle_media.sql");
  assert.match(migration,/rose-gold-bottle-oil\.webp/);assert.doesNotMatch(migration,/update public\.inventory|insert into public\.inventory/i);
  for(const slug of ["musk-rizali","vanilla-musk","white-oud","oud-rose","junoon","red-musk","nazakat","zara-candy","deer-musk","afsoon"])assert.match(migration,new RegExp(`'${slug}'`));
});
