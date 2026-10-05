import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("answer-led homepage content and structured data describe the same visible answers", async () => {
  const [home, answers, product] = await Promise.all([read("app/page.tsx"), read("lib/answer-engine.ts"), read("app/product/[slug]/page.tsx")]);
  assert.match(home, /"@type":"OnlineStore"/);
  assert.match(home, /"@type":"FAQPage"/);
  assert.match(home, /homepageAnswers\.map/);
  assert.match(home, /Answers before/);
  for (const question of ["What is Rehmat Panjab?", "How do I choose a perfume oil?", "What do top, heart and base notes mean?"]) assert.match(answers, new RegExp(question.replace(/[?]/g, "\\?")));
  assert.match(product, /additionalProperty/);
  assert.match(product, /Top notes/);
  assert.match(product, /Heart notes/);
  assert.match(product, /Base notes/);
});

test("official crest is crawlable and used as the organization and triptych seal", async () => {
  const [home, triptych, reveal, crest] = await Promise.all([read("app/page.tsx"), read("app/components/olfactory-triptych.tsx"), read("app/components/fragrance-note-reveal.tsx"), stat("public/images/brand/rehmat-panjab-crest.webp")]);
  assert.ok(crest.size > 10000);
  for (const source of [home, triptych, reveal]) assert.match(source, /rehmat-panjab-crest\.webp/);
});

test("Brass Lens cursor is restrained and retains native fallbacks", async () => {
  const [cursor, styles] = await Promise.all([read("app/components/rehmat-oil-cursor.tsx"), read("app/globals.css")]);
  assert.match(cursor, /oil-cursor-orbit/);
  assert.match(styles, /width: 14px; height: 14px/);
  assert.match(styles, /\.rehmat-oil-cursor\[data-state="INTERACTIVE"\] \.oil-cursor-orbit/);
  assert.match(styles, /oil-local-ripple 480ms/);
  assert.doesNotMatch(cursor, /oil-cursor-drop|oil-cursor-split|oil-cursor-bottle/);
  assert.match(cursor, /pointer: fine/);
  assert.match(cursor, /prefers-reduced-motion: reduce/);
});

test("Olfactory Triptych reveals base, heart and top with one emphasized layer", async () => {
  const [triptych, reveal, styles, product, storefront, approvedNotes] = await Promise.all([read("app/components/olfactory-triptych.tsx"), read("app/components/fragrance-note-reveal.tsx"), read("app/globals.css"), read("app/product/[slug]/page.tsx"), read("lib/storefront.ts"), read("lib/approved-fragrance-notes.ts")]);
  assert.match(triptych, /Three movements/);
  assert.match(triptych, /Reveal all notes/);
  assert.match(triptych, /activeTier/);
  assert.match(triptych, /group\.tier === "base" \? 0 : group\.tier === "heart" \? 1 : 2/);
  assert.match(reveal, /\[\.\.\.noteGroups\]\.reverse\(\)/);
  assert.match(reveal, /fragrance-triptych-rail/);
  assert.match(styles, /\.olfactory-tier\[aria-pressed="true"\]/);
  assert.match(product, /<OlfactoryTriptych product=\{product\}/);
  assert.match(storefront, /notes,notes_verified,occasions/);
  assert.match(storefront, /row\.notes_verified === true && databaseNotesComplete/);
  assert.match(storefront, /approvedNotesForSlug\(row\.slug\)/);
  assert.match(storefront, /approvedNotesForSlug\(product\.slug\) \?\? product\.notes/);
  for (const slug of ["musk-rizali", "afsoon", "amber-veil", "dubai-chocolate"]) assert.match(approvedNotes, new RegExp(slug));
});
