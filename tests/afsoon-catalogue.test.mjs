import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Afsoon is fully represented without fabricated stock or photography", async () => {
  const [products, migration, media] = await Promise.all([
    read("lib/products.ts"),
    read("supabase/migrations/202609080001_afsoon_suitability_images.sql"),
    read("app/components/product-media.tsx"),
  ]);
  for (const value of ["AFSOON","Inspired by Vampire Blood","49900","89900","Dark Cherry","Velvet Musk","Slightly sensual-sweet leaning"]) assert.match(products, new RegExp(value));
  assert.match(migration, /where p\.slug='afsoon'[\s\S]*on conflict\(variant_id\) do nothing/);
  assert.match(migration, /select v\.id,0,0,2/);
  assert.doesNotMatch(migration, /on conflict\(variant_id\).*do update/s);
  assert.match(media, /Genuine product image pending/);
  assert.match(products, /Afsoon product photograph awaiting owner upload/);
});

test("suitability is backend-managed, searchable, filterable and visible", async () => {
  const [migration, api, storefront, collection, productPage] = await Promise.all([
    read("supabase/migrations/202609080001_afsoon_suitability_images.sql"),
    read("app/api/admin/products/route.ts"),
    read("lib/storefront.ts"),
    read("app/collection/collection-catalogue.tsx"),
    read("app/product/[slug]/page.tsx"),
  ]);
  assert.match(migration, /check \(suitability in \('unisex','men','women'\)\)/);
  assert.match(api, /z\.enum\(\["unisex", "men", "women"\]\)/);
  assert.match(storefront, /suitability_note/);
  assert.match(collection, /catalogue-suitability/);
  assert.match(collection, /suitabilityLabels\[product\.suitability\]/);
  assert.match(productPage, /suggestedGender/);
});

test("permanent collection wording and restrained spill cursor are wired", async () => {
  const [home, collection, layout, cursor, styles] = await Promise.all([
    read("app/page.tsx"), read("app/collection/page.tsx"), read("app/layout.tsx"),
    read("app/components/rehmat-oil-cursor.tsx"), read("app/globals.css"),
  ]);
  for (const source of [home, collection, layout]) assert.match(source, /Your Oil,.*Your Atmosphere/s);
  assert.doesNotMatch(`${home}${collection}${layout}`, /Nine oils\. Nine atmospheres\./);
  assert.match(cursor, /createOilSpill/);
  assert.equal((cursor.match(/oil-spill-speck-/g) ?? []).length >= 1, true);
  assert.match(cursor, /timers\.forEach/);
  assert.match(styles, /oil-spill-absorb 620ms/);
  assert.doesNotMatch(cursor, /oil-cursor-split/);
});
