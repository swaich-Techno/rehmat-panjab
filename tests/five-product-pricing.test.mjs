import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/202609190001_add_five_price_catalogue_products.sql", import.meta.url);

test("owner-approved five-product prices, costs and stock are recorded exactly", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  for (const row of [
    /'br540', 6::numeric, 'RP-BR540-06', 29900, 8400/,
    /'br540', 12::numeric, 'RP-BR540-12', 54900, 16800/,
    /'oud-satin-mood', 6::numeric, 'RP-OSM-06', 32900, 9000/,
    /'oud-satin-mood', 12::numeric, 'RP-OSM-12', 59900, 18000/,
    /'purple-oud', 6::numeric, 'RP-PO-06', 34900, 9600/,
    /'purple-oud', 12::numeric, 'RP-PO-12', 64900, 19200/,
    /'golden-dream', 6::numeric, 'RP-GD-06', 49900, null::integer/,
    /'golden-dream', 12::numeric, 'RP-GD-12', 89900, null::integer/,
    /'dubai-chocolate', 6::numeric, 'RP-DC-06', 39900, null::integer/,
    /'dubai-chocolate', 12::numeric, 'RP-DC-12', 69900, null::integer/,
  ]) assert.match(migration, row);
  assert.match(migration, /bottle_cost_paise = case volume_ml when 6 then 2300 when 12 then 2400 end/);
  assert.match(migration, /packaging_cost_paise = 5000/);
  assert.match(migration, /select variant\.id, 10, 0, 2/);
});

test("unverified fragrance facts are not invented and costs stay in admin data", async () => {
  const [migration, api, admin, collection] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(new URL("../app/api/admin/variants/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/products/variant-manager.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/collection/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /notes_verified = false/);
  assert.match(migration, /'\{\}'::jsonb, false/);
  assert.match(api, /oil_cost_paise/);
  assert.match(admin, /Oil cost \(₹, internal\)/);
  assert.match(collection, /\{products\.length\} concentrated perfume oils/);
});
