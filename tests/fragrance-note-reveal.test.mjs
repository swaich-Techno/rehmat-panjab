import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("ingredient visuals resolve from authoritative product notes and unknown notes fail safely", async () => {
  const [data, reveal, storefront] = await Promise.all([read("lib/fragrance-note-reveal.ts"), read("app/components/fragrance-note-reveal.tsx"), read("lib/storefront.ts")]);
  assert.match(reveal, /ingredientVisualsFor\(product\.slug, product\.notes\)/);
  assert.match(reveal, /primaryFragranceNotes\(product\.notes\)/);
  assert.match(storefront, /const notes = noteGroups \? \{ top: asStrings\(noteGroups\.top\), heart: asStrings\(noteGroups\.heart\), base: asStrings\(noteGroups\.base\) \}/);
  assert.match(data, /if \(!notes \|\| !configured\) return \[\]/);
  assert.match(data, /actual\[index\]\?\.localeCompare\(note/);
  assert.doesNotMatch(reveal, /fragrance-note-label|>TOP<|>HEART<|>BASE</);
});

test("all ten products map three verified notes to approved local assets", async () => {
  const data = await read("lib/fragrance-note-reveal.ts");
  const expected = {
    "musk-rizali": ["bergamot-slice", "saffron-threads", "white-musk-orb"],
    "vanilla-musk": ["vanilla-pod", "almonds", "white-musk-orb"],
    "white-oud": ["white-peppercorns", "bergamot-slice", "wood-chips"],
    "oud-rose": ["rose-petals", "pink-peppercorns", "raspberries"],
    junoon: ["passionfruit", "rose-petals", "saffron-threads"],
    "red-musk": ["red-berries", "saffron-threads", "white-musk-orb"],
    nazakat: ["lychee", "rhubarb", "bergamot-slice"],
    gulnaar: ["candied-pear", "strawberries", "vanilla-pod"],
    "deer-musk": ["cardamom-pods", "bergamot-slice", "velvet-musk-dark"],
    afsoon: ["dark-cherries", "red-berries", "velvet-musk-burgundy"],
  };
  for (const [slug, keys] of Object.entries(expected)) {
    assert.match(data, new RegExp(`"${slug}": \\[([^\\n]+)\\]`));
    for (const key of keys) assert.match(data, new RegExp(`"${key}"`));
  }
});

test("transparent ingredient library is complete and optimized locally", async () => {
  const dir = new URL("public/images/fragrance-notes/", root);
  const files = (await readdir(dir)).filter(file => file.endsWith(".webp"));
  assert.equal(files.length, 20);
  for (const file of files) {
    const bytes = await readFile(new URL(file, dir));
    const info = await stat(new URL(file, dir));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${file} must be WebP`);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${file} must be WebP`);
    assert.ok(info.size < 100_000, `${file} should stay lightweight`);
  }
});

test("splash, falling physics and reduced motion preserve the settled composition", async () => {
  const [reveal, styles, data] = await Promise.all([read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css"), read("lib/fragrance-note-reveal.ts")]);
  assert.match(reveal, /fragrance-liquid-bloom/);
  assert.match(reveal, /fragrance-ingredient/);
  assert.match(reveal, /data-ingredient-key=\{visual\.key\}/);
  assert.match(reveal, /bottom: "(?:4|6|7|8|9|17)%"/);
  assert.match(styles, /@keyframes fragrance-liquid-bloom/);
  assert.match(styles, /@keyframes fragrance-ingredient-drop/);
  assert.match(styles, /100%\{opacity:1;transform:translate3d\(0,0,0\)/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*fragrance-ingredient\{opacity:1!important;transform:rotate/);
  assert.match(styles, /fragrance-ingredient:nth-child\(n\+7\)\{display:none\}/);
  for (const color of ["#fffdf2", "#fff0a8", "#f9fdff", "#e8bd58", "#2d0610"]) assert.ok(data.includes(color));
});

test("accessible notes, replay, single-active state and keyboard dismissal remain intact", async () => {
  const [catalogue, reveal] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/fragrance-note-reveal.tsx")]);
  assert.match(reveal, /fragrance ingredients: \{noteSummary\}/);
  assert.match(reveal, /aria-hidden="true"/);
  assert.match(reveal, /event\.key === "Escape"/);
  assert.match(reveal, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(reveal, /key=\{`\$\{product\.slug\}-\$\{replay\}`\}/);
  assert.match(catalogue, /current\?\.slug===product\.slug\?\{slug:product\.slug,replay:current\.replay\+1\}/);
  assert.match(catalogue, /active=\{activeReveal\?\.slug===product\.slug\}/);
  assert.match(catalogue, /href=\{`\/product\/\$\{product\.slug\}`\}>View details<\/Link>/);
  assert.match(catalogue, /Quick view/i);
});

test("every reveal exposes complete note groups and ingredient names on hover or focus", async () => {
  const [reveal, styles] = await Promise.all([read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css")]);
  assert.match(reveal, /product\.notes\?\.top\.filter\(Boolean\)/);
  assert.match(reveal, /product\.notes\?\.heart\.filter\(Boolean\)/);
  assert.match(reveal, /product\.notes\?\.base\.filter\(Boolean\)/);
  assert.match(reveal, /fragrance-note-map/);
  assert.match(reveal, /fragrance-ingredient-name/);
  assert.match(reveal, /title=\{visual\.note\}/);
  assert.match(reveal, /tabIndex=\{isPrimary \? 0 : undefined\}/);
  assert.match(styles, /fragrance-ingredient:hover \.fragrance-ingredient-name/);
  assert.match(styles, /fragrance-ingredient:focus-visible \.fragrance-ingredient-name/);
});

test("commerce authority and product media behavior remain intact", async () => {
  const [catalogue, media] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/product-media.tsx")]);
  for (const token of ["COMMERCE_ENABLED", "isPurchasable(product,selected)", "selected.availableQuantity", "selected.pricePaise"]) assert.ok(catalogue.includes(token));
  assert.match(media, /product\.notesVerified/);
  assert.match(media, /rose-gold-bottle-oil\.webp/);
});
