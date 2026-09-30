import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("catalogue exposes prominent Men, Women and Unisex edits",async()=>{
  const [page,catalogue,collections,styles,storefront]=await Promise.all([read("app/collection/page.tsx"),read("app/collection/collection-catalogue.tsx"),read("lib/search-collections.ts"),read("app/globals.css"),read("lib/storefront.ts")]);
  for(const slug of ["mens-perfume-oils","womens-perfume-oils","unisex-perfume-oils"]){
    assert.match(page,new RegExp(slug));
    assert.match(collections,new RegExp(slug));
  }
  assert.match(page,/helpful edits, not rules/i);
  assert.match(page,/showAudienceFilter/);
  assert.match(catalogue,/All fragrances/);
  assert.match(catalogue,/aria-pressed=\{filters\.suitability===value\}/);
  assert.match(catalogue,/updateFilter\("suitability",value\)/);
  assert.match(storefront,/hasAudienceEdits/);
  assert.match(storefront,/audienceEditBySlug\[row\.slug\]/);
  assert.match(collections,/"white-oud":"men"/);
  assert.match(collections,/"oud-rose":"women"/);
  assert.match(styles,/\.audience-collection-grid/);
  assert.match(styles,/\.catalogue-audience-options button/);
  assert.match(styles,/min-height:48px/);
  assert.match(styles,/@media\(max-width:700px\).*\.audience-collections/s);
});

test("audience migration is additive and cannot change commerce data",async()=>{
  const migration=await read("supabase/migrations/202609290001_audience_collections.sql");
  for(const value of ["'men'","'women'","'unisex'"])assert.match(migration,new RegExp(value));
  assert.match(migration,/wearable by anyone/i);
  const statements=migration.replace(/^--.*$/gm,"");
  assert.doesNotMatch(statements,/product_variants|inventory|price_paise|quantity\s*=|delete\s+from/i);
});
