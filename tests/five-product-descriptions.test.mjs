import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("owner-approved Rehmat names, descriptions and notes remain exact", async () => {
  const migration = await read("supabase/migrations/202609200001_verified_notes_rehmat_names.sql");
  for (const value of [
    "'amber-veil', 'Amber Veil'",
    "'velvet-oud', 'Velvet Oud'",
    "'purple-oud', 'Purple Oud'",
    "'golden-dream', 'Golden Dream'",
    "'dubai-chocolate', 'Dubai Chocolate'",
    '"top":["Saffron","Sweet Amber"]',
    '"top":["Soft Rose"]',
    '"heart":["Dark Oud"]',
    '"heart":["Caramel"]',
    '"top":["Chocolate"]',
  ]) assert.ok(migration.includes(value), value);
  assert.match(migration, /notes_verified = true/);
  assert.match(migration, /array\['BR540'\]/);
  assert.match(migration, /array\['Oud Satin Mood'\]/);
});

test("legacy internal-reference slugs redirect to public Rehmat names", async () => {
  const products = await read("lib/products.ts");
  assert.match(products, /br540:"amber-veil"/);
  assert.match(products, /"oud-satin-mood":"velvet-oud"/);
});

test("the brand signature is present in the shared footer", async () => {
  const footer = await read("app/components/site-footer.tsx");
  assert.match(footer, /Pure • Authentic • Timeless/);
  assert.match(footer, /Premium Arabian attars crafted for everyday luxury and unforgettable moments\./);
});
