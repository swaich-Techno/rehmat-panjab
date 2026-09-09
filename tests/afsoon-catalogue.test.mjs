import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Afsoon is fully represented without fabricated stock or photography", async () => {
  const [products, migration, editorialMigration, media, storefront, productPage] = await Promise.all([
    read("lib/products.ts"),
    read("supabase/migrations/202609080001_afsoon_suitability_images.sql"),
    read("supabase/migrations/202609080002_afsoon_editorial_campaign.sql"),
    read("app/components/product-media.tsx"),
    read("lib/storefront.ts"),
    read("app/product/[slug]/page.tsx"),
  ]);
  for (const value of ["AFSOON","Inspired by Vampire Blood","49900","89900","Dark Cherry","Velvet Musk","Slightly sensual-sweet leaning"]) assert.match(products, new RegExp(value));
  assert.match(migration, /where p\.slug='afsoon'[\s\S]*on conflict\(variant_id\) do nothing/);
  assert.match(migration, /select v\.id,0,0,2/);
  assert.doesNotMatch(migration, /on conflict\(variant_id\).*do update/s);
  assert.doesNotMatch(media, /Genuine product image pending/);
  assert.match(products, /AFSOON fragrance house oil-drop illustration/);
  assert.match(editorialMigration, /afsoon-editorial-campaign\.webp/);
  assert.match(storefront, /image: publicImage\(row\.image_path/);
  assert.match(productPage, /Editorial campaign artwork · This is not a genuine product photograph\./);
});

test("owner-confirmed inventory and availability stay variant-authoritative", async () => {
  const [migration, catalogue, collection, purchase, quiz, styles] = await Promise.all([
    read("supabase/migrations/202609080003_active_catalogue_inventory.sql"),
    read("lib/catalog.ts"),
    read("app/collection/collection-catalogue.tsx"),
    read("app/components/product-purchase.tsx"),
    read("app/find-your-scent/scent-quiz.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(migration, /set quantity = 10/);
  assert.match(migration, /variant\.size_ml in \(6, 12\)/);
  assert.doesNotMatch(migration, /reserved\s*=/);
  assert.match(catalogue, /variant\.availableQuantity > 0/);
  assert.match(collection, /availabilityLabel\(product\)/);
  assert.equal((collection.match(/availabilityLabel\(product\)/g) ?? []).length, 1);
  assert.match(purchase, /filter\(\(variant\) => variant\.availableQuantity > 0\)/);
  assert.match(quiz, /grounded in the active Rehmat fragrance collection/);
  assert.match(styles, /\.cart-layer \{[^}]*overflow: hidden/);
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
