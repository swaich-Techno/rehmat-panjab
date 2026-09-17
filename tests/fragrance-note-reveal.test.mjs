import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("reveal text resolves from the authoritative catalogue product", async () => {
  const [data, reveal, storefront] = await Promise.all([read("lib/fragrance-note-reveal.ts"), read("app/components/fragrance-note-reveal.tsx"), read("lib/storefront.ts")]);
  assert.match(reveal, /primaryFragranceNotes\(product\.notes\)/);
  assert.match(reveal, /\{notes\.top\}/);assert.match(reveal, /\{notes\.heart\}/);assert.match(reveal, /\{notes\.base\}/);
  assert.match(storefront, /const notes = noteGroups \? \{ top: asStrings\(noteGroups\.top\), heart: asStrings\(noteGroups\.heart\), base: asStrings\(noteGroups\.base\) \}/);
  assert.doesNotMatch(data, /Bergamot|Saffron|White Musk|Vanilla Bean|Pink Pepper|Dark Cherry/);
});

test("all ten catalogue entries have structured note groups without a reveal-side fallback", async () => {
  const [migration, products, palettes] = await Promise.all([read("supabase/migrations/202609090003_compact_catalogue_bottle_media.sql"), read("lib/products.ts"), read("lib/fragrance-note-reveal.ts")]);
  const rows = [...migration.matchAll(/\('([^']+)','(\{"top":\[[^']+\})'::jsonb\)/g)].map(([, slug, notes]) => ({ slug, notes: JSON.parse(notes) }));
  assert.equal(rows.length, 9);
  for (const { slug, notes } of rows) {
    assert.ok(notes.top[0] && notes.heart[0] && notes.base[0], `${slug} must provide Top, Heart and Base notes`);
  }
  const afsoon = products.match(/slug:"afsoon"[\s\S]*?notes:\{top:\[(.*?)\],heart:\[(.*?)\],base:\[(.*?)\]\}/);
  assert.ok(afsoon);assert.ok(afsoon[1] && afsoon[2] && afsoon[3]);
  for (const slug of ["musk-rizali","vanilla-musk","white-oud","oud-rose","junoon","red-musk","nazakat","gulnaar","deer-musk","afsoon"]) assert.match(palettes, new RegExp(`"${slug}"`));
});

test("reveal interaction is single-instance, replayable and keyboard dismissible", async () => {
  const [catalogue, reveal, data] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/fragrance-note-reveal.tsx"), read("lib/fragrance-note-reveal.ts")]);
  assert.match(catalogue, /activeReveal.*useState/s);
  assert.match(catalogue, /current\?\.slug===product\.slug\?\{slug:product\.slug,replay:current\.replay\+1\}/);
  assert.match(catalogue, /active=\{activeReveal\?\.slug===product\.slug\}/);
  assert.match(reveal, /aria-label=\{canReveal \? `Show fragrance notes for \$\{product\.name\}`/);
  assert.match(reveal, /event\.key === "Escape"/);
  assert.match(reveal, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(reveal, /key=\{`\$\{product\.slug\}-\$\{replay\}`\}/);
  assert.match(reveal, /active && palette && notes && <div/);
  assert.match(reveal, /disabled=\{!canReveal\}/);
  assert.match(data, /return top && heart && base \? \{ top, heart, base \} : null/);
});

test("effects are decorative, motion-aware and navigation remains separate", async () => {
  const [catalogue, reveal, styles] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css")]);
  assert.match(reveal, /fragrance-light-cracks[\s\S]*aria-hidden="true"/);
  assert.match(reveal, /fragrance-particles[\s\S]*aria-hidden="true"/);
  assert.match(reveal, /role="status"/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*fragrance-light-cracks/);
  assert.match(catalogue, /href=\{`\/product\/\$\{product\.slug\}`\}>View details<\/Link>/);
});

test("commerce authority and product media behavior remain intact", async () => {
  const [catalogue, media] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/product-media.tsx")]);
  for (const token of ["COMMERCE_ENABLED", "isPurchasable(product,selected)", "selected.availableQuantity", "selected.pricePaise"]) assert.ok(catalogue.includes(token));
  assert.match(media, /product\.notesVerified/);
  assert.match(media, /rose-gold-bottle-oil\.webp/);
});
