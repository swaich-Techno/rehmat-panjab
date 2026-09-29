import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage opens with the animated Today’s Rehmat first viewport", async () => {
  const [page, hero, today] = await Promise.all([read("app/page.tsx"), read("app/components/cinematic-today.tsx"), read("app/components/todays-rehmat.tsx")]);
  assert.match(page, /<TodaysRehmat products=\{products\}\/>/);
  assert.doesNotMatch(page, /HomepageCampaign/);
  assert.match(today, /todaysRehmat\(products\)/);
  assert.match(hero, /useState\(true\)/);
  assert.match(hero, /requestAnimationFrame/);
  assert.match(hero, /cancelAnimationFrame/);
  assert.match(hero, /IntersectionObserver/);
  assert.match(hero, /Replay fragrance notes/);
  assert.match(hero, /persistent/);
  assert.match(hero, /ProductAddButton/);
  assert.match(hero, /data-scene=\{scene\.id\}/);
});

test("cinematic stage has responsive, paused and reduced-motion states", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.today-cinematic\{/);
  assert.match(css, /\.today-cinematic-stage\{/);
  assert.match(css, /data-visible="false"/);
  assert.match(css, /@media \(max-width:700px\)[\s\S]*\.today-cinematic\{/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)[\s\S]*\.today-cinematic/);
  assert.match(css, /rehmat-panjab-homepage-hero\.webp/);
  assert.match(css, /today-stage-poster/);
  assert.match(css, /@keyframes today-scene-orbit/);
  assert.match(css, /data-visible="false"[\s\S]*today-atmosphere b/);
});

test("daily selection uses IST, weekday profiles, stock and exact ten-day festival windows", async () => {
  const [daily, calendar] = await Promise.all([read("lib/daily-rehmat.ts"), read("lib/festival-calendar.ts")]);
  assert.match(daily, /weekdayProfiles/);
  assert.match(daily, /hasAvailableStock\(product\)/);
  assert.match(daily, /firstPrice\(product\)!==null/);
  assert.match(daily, /hasCompleteIngredientVisuals\(product\.notes,ingredientVisualsFor\(product\.slug,product\.notes\)\)/);
  assert.match(daily, /profile\.terms\.reduce/);
  assert.match(calendar, /timeZone:"Asia\/Kolkata"/);
  assert.match(calendar, /festivalWindowStart\(item\.date\)/);
  assert.match(calendar, /leadDays = 10/);
  assert.doesNotMatch(calendar, /predict|calculate.*lunar/i);
  for (const id of ["sunday-stillness","monday-light","tuesday-spice","wednesday-bloom","thursday-amber","friday-velvet","saturday-radiance"]) assert.match(daily, new RegExp(id));
  assert.match(daily, /festival-radiance/);
});

test("Rehmat AI exposes calendar and grounded assistant modes", async () => {
  const [ui, api, expert, offer, guideSource] = await Promise.all([read("app/components/rehmat-guide.tsx"), read("app/api/rehmat-guide/route.ts"), read("lib/fragrance-ai.ts"), read("lib/public-offer.ts"), read("lib/rehmat-guide.ts")]);
  assert.match(ui, /AI Assistant/);
  assert.match(ui, /verified live offers/);
  assert.match(api, /getCurrentPublicOffer/);
  assert.match(expert, /senior perfumery and fragrance adviser/);
  assert.match(expert, /never claim to authenticate/);
  assert.match(guideSource, /chypre\|fougere\|fougère/);
  assert.match(offer, /coupon_redemptions/);
  assert.match(offer, /total_usage_limit/);
});

test("Guide variety and Moon Paris correction are release scoped", async () => {
  const [guide, route, tester, migration] = await Promise.all([
    read("lib/rehmat-guide.ts"), read("app/api/rehmat-guide/route.ts"), read("lib/tester-packs.ts"),
    read("supabase/migrations/202609260003_cinematic_homepage_moon_paris.sql"),
  ]);
  assert.match(guide, /recentContext/);
  assert.match(guide, /hasExplicitPreference/);
  assert.doesNotMatch(guide, /product\.summary,product\.description/);
  assert.match(guide, /materials_craft/);
  assert.match(guide, /application_storage/);
  assert.match(route, /recentContext/);
  assert.match(tester, /Moon Paris–Inspired Perfume Oil/);
  assert.doesNotMatch(tester, /Mon Paris/);
  assert.match(migration, /where slug = 'mahnoor'/);
  assert.match(migration, /array_replace\(search_aliases, 'Mon Paris', 'Moon Paris'\)/);
});
