import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public catalogue restores reference names without changing stable slugs", async () => {
  const [names, storefront, migration] = await Promise.all([
    read("lib/public-product-names.ts"),
    read("lib/storefront.ts"),
    read("supabase/migrations/202610040001_restore_reference_product_names.sql"),
  ]);
  for (const [slug, name] of [
    ["junoon", "Oud Maracuja"], ["nazakat", "Delina"], ["gulnaar", "Zara Candy"],
    ["afsoon", "Vampire Blood"], ["amber-veil", "BR540"], ["velvet-oud", "Oud Satin Mood"],
    ["mahnoor", "Moon Paris"], ["samandar", "Acqua di Giò"], ["adaa", "Bombshell"],
  ]) {
    assert.match(names, new RegExp(`\\"?${slug}\\"?: \\"${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(migration, new RegExp(`'${slug}','${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
  }
  assert.match(storefront, /publicProductName\(row\.slug, row\.name\)/);
  assert.match(storefront, /imageAlt: `\$\{displayName\} perfume oil by Rehmat Panjab`/);
  assert.match(storefront, /inspirationLine: undefined/);
  assert.doesNotMatch(migration, /update public\.product_variants|update public\.inventory/);
});

test("tester names contain no Inspired Perfume Oil suffix or secondary inspiration line", async () => {
  const testers = await read("lib/tester-packs.ts");
  assert.doesNotMatch(testers, /Inspired Perfume Oil/i);
  assert.doesNotMatch(testers, /inspirationLine:/);
  for (const name of ["Oud Maracuja", "Delina", "Zara Candy", "Vampire Blood", "Moon Paris", "Wisal", "Oud Mood", "Oud for Glory", "Acqua di Giò", "Light Blue", "Love Spell", "Bombshell"])
    assert.match(testers, new RegExp(`name: \\"${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\"`));
});
