import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("reveal renders every verified note only when an exact local visual exists", async () => {
  const [data, reveal] = await Promise.all([read("lib/fragrance-note-reveal.ts"), read("app/components/fragrance-note-reveal.tsx")]);
  assert.match(data, /\(\["base", "heart", "top"\] as const\)\.flatMap/);
  assert.match(data, /hasCompleteIngredientVisuals/);
  assert.match(data, /visuals\.length === expected/);
  assert.match(reveal, /visuals\.map/);
  assert.match(reveal, /data-note-tier=\{visual\.tier\}/);
  assert.match(reveal, /visual\.tier === "base" \? 0 : visual\.tier === "heart" \? 560 : 1120/);
  assert.doesNotMatch(reveal, /primaryFragranceNotes/);
});

test("transparent ingredient library is complete and optimized locally", async () => {
  const dir = new URL("public/images/fragrance-notes/", root);
  const files = (await readdir(dir)).filter(file => file.endsWith(".webp"));
  assert.equal(files.length, 25);
  for (const file of files) {
    const bytes = await readFile(new URL(file, dir));
    const info = await stat(new URL(file, dir));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${file} must be WebP`);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${file} must be WebP`);
    assert.ok(info.size < 100_000, `${file} should stay lightweight`);
  }
});

test("bottle sequence, replay and reduced motion preserve the settled composition", async () => {
  const [reveal, styles] = await Promise.all([read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css")]);
  for (const token of ["fragrance-liquid-bloom", "fragrance-bottle-cap", "fragrance-particles", "fragrance-note-map", "fragrance-ingredient"]) assert.ok(reveal.includes(token));
  assert.match(styles, /@keyframes fragrance-liquid-bloom/);
  assert.match(styles, /@keyframes fragrance-cap-lift/);
  assert.match(styles, /@keyframes fragrance-ingredient-rise/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*fragrance-bottle-cap\{display:none!important\}/);
  assert.match(reveal, /key=\{`\$\{product\.slug\}-\$\{replay\}`\}/);
});

test("reveal is accessible, coordinated globally and safely dismissible", async () => {
  const [catalogue, reveal] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/fragrance-note-reveal.tsx")]);
  assert.match(reveal, /fragrance ingredients: \{noteSummary\}/);
  assert.match(reveal, /event\.key === "Escape"/);
  assert.match(reveal, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(reveal, /rehmat-fragrance-reveal/);
  assert.match(reveal, /window\.dispatchEvent\(new CustomEvent/);
  assert.match(reveal, /persistent/);
  assert.match(reveal, /document\.addEventListener\("pointerdown", dismiss\)/);
  assert.match(reveal, /type="button"/);
  assert.match(catalogue, /active=\{activeReveal\?\.slug===product\.slug\}/);
  assert.match(catalogue, /View details/);
});

test("commerce authority remains outside the visual reveal", async () => {
  const [catalogue, media] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/product-media.tsx")]);
  for (const token of ["COMMERCE_ENABLED", "isPurchasable(product,selected)", "selected.availableQuantity", "selected.pricePaise"]) assert.ok(catalogue.includes(token));
  assert.match(media, /product\.notes/);
  assert.doesNotMatch(media, /pricePaise|availableQuantity|isPurchasable/);
});
