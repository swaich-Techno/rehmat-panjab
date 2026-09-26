import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("ingredient visuals resolve from authoritative product notes with a local fallback", async () => {
  const [data, reveal, storefront] = await Promise.all([read("lib/fragrance-note-reveal.ts"), read("app/components/fragrance-note-reveal.tsx"), read("lib/storefront.ts")]);
  assert.match(reveal, /ingredientVisualsFor\(product\.slug, product\.notes\)/);
  assert.match(reveal, /primaryFragranceNotes\(product\.notes\)/);
  assert.match(storefront, /const notes = noteGroups \? \{ top: asStrings\(noteGroups\.top\), heart: asStrings\(noteGroups\.heart\), base: asStrings\(noteGroups\.base\) \}/);
  assert.match(data, /if \(!notes\) return \[\]/);
  assert.match(data, /if \(!configured\)/);
  assert.match(data, /aliases\.find/);
  assert.match(data, /actual\[index\]\?\.localeCompare\(note/);
  assert.doesNotMatch(reveal, /fragrance-note-label|>TOP<|>HEART<|>BASE</);
});

test("all configured products map three verified notes to approved local assets", async () => {
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
    "amber-veil": ["saffron-threads", "jasmine-sambac", "wood-chips"],
    "velvet-oud": ["rose-petals", "wood-chips", "vanilla-pod"],
    "purple-oud": ["cardamom-pods", "wood-chips", "amber-resin"],
    "golden-dream": ["vanilla-pod", "caramel", "amber-resin"],
    "dubai-chocolate": ["dark-chocolate", "vanilla-pod", "hazelnuts"],
  };
  for (const [slug, keys] of Object.entries(expected)) {
    assert.match(data, new RegExp(`"${slug}": \\[([^\\n]+)\\]`));
    for (const key of keys) assert.match(data, new RegExp(`"${key}"`));
  }
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

test("bottle opening, rising note tiers and reduced motion preserve the settled composition", async () => {
  const [reveal, styles, data] = await Promise.all([read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css"), read("lib/fragrance-note-reveal.ts")]);
  assert.match(reveal, /fragrance-liquid-bloom/);
  assert.match(reveal, /fragrance-ingredient/);
  assert.match(reveal, /data-ingredient-key=\{visual\.key\}/);
  assert.match(reveal, /tier: "Base"/);
  assert.match(reveal, /tier: "Heart"/);
  assert.match(reveal, /tier: "Top"/);
  assert.match(reveal, /fragrance-bottle-cap/);
  assert.match(styles, /@keyframes fragrance-liquid-bloom/);
  assert.match(styles, /@keyframes fragrance-cap-lift/);
  assert.match(styles, /@keyframes fragrance-ingredient-rise/);
  assert.match(styles, /100%\{opacity:1;transform:translate3d\(-50%,0,0\)/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*fragrance-bottle-cap\{display:none!important\}/);
  assert.match(styles, /fragrance-ingredient\{opacity:1!important;transform:translate3d\(-50%,0,0\)!important\}/);
  assert.match(styles, /fragrance-note-map>span:nth-child\(3\)\{animation-delay:1320ms\}/);
  for (const color of ["#fffdf2", "#fff0a8", "#f9fdff", "#e8bd58", "#2d0610"]) assert.ok(data.includes(color));
  for (const slug of ["mahnoor","milaap","sukoon-oud","shaan-oud","samandar","neel","ishq","siyah-oud","safaa-musk","adaa"]) assert.match(data,new RegExp(`"${slug}": \\{`));
});

test("accessible notes, replay, single-active state and keyboard dismissal remain intact", async () => {
  const [catalogue, reveal] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/fragrance-note-reveal.tsx")]);
  assert.match(reveal, /fragrance ingredients: \{noteSummary\}/);
  assert.match(reveal, /aria-hidden="true"/);
  assert.match(reveal, /event\.key === "Escape"/);
  assert.match(reveal, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(reveal, /document\.addEventListener\("pointerdown", dismiss\)/);
  assert.match(reveal, /type="button"/);
  assert.match(reveal, /onClick=\{\(\) => \{ cancelQueuedReveal\(\); transientReveal\.current = false; onActivate\(\); \}\}/);
  assert.doesNotMatch(reveal, /event\.key === "Enter" \|\| event\.key === " "/);
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
  assert.match(reveal, /tabIndex=\{0\}/);
  assert.match(styles, /fragrance-ingredient:hover \.fragrance-ingredient-name/);
  assert.match(styles, /fragrance-ingredient:focus-visible \.fragrance-ingredient-name/);
});

test("commerce authority and product media behavior remain intact", async () => {
  const [catalogue, media] = await Promise.all([read("app/collection/collection-catalogue.tsx"), read("app/components/product-media.tsx")]);
  for (const token of ["COMMERCE_ENABLED", "isPurchasable(product,selected)", "selected.availableQuantity", "selected.pricePaise"]) assert.ok(catalogue.includes(token));
  assert.match(media, /product\.notesVerified/);
  assert.match(media, /rose-gold-bottle-oil\.webp/);
});
