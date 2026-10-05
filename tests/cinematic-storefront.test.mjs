import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage opens with the animated Today’s Rehmat first viewport", async () => {
  const [page, hero, today, tester] = await Promise.all([read("app/page.tsx"), read("app/components/cinematic-today.tsx"), read("app/components/todays-rehmat.tsx"), read("app/components/tester-preview.tsx")]);
  assert.match(page, /<TodaysRehmat products=\{products\}\s*\/>/);
  assert.doesNotMatch(page, /HomepageCampaign/);
  assert.match(today, /todaysRehmat\(products\)/);
  assert.match(hero, /Perfume oil,/);
  assert.match(hero, /Discover Today’s Rehmat/);
  assert.match(hero, /Find My Scent/);
  assert.match(hero, /import\("gsap"\)/);
  assert.match(hero, /import\("gsap\/ScrollTrigger"\)/);
  assert.match(hero, /gsap\.context/);
  assert.match(hero, /gsap\.matchMedia/);
  assert.match(hero, /end: "\+=60%"/);
  assert.match(hero, /requestAnimationFrame/);
  assert.match(hero, /cancelAnimationFrame/);
  assert.match(hero, /IntersectionObserver/);
  assert.match(hero, /visibilitychange/);
  assert.match(hero, /Pause motion/);
  assert.match(hero, /Replay/);
  assert.match(hero, /persistent/);
  assert.match(hero, /\[\.\.\.notes\]\.reverse\(\)/);
  assert.match(page, /<TesterPreview compact \/>/);
  assert.match(tester, /launchTesters\.slice\(0,3\)/);
  assert.match(page, /products\.slice\(0, 3\)/);
  for (const path of ["Start Small", "Find My Scent", "Explore the House"]) assert.match(page, new RegExp(path));
});

test("cinematic stage has responsive, paused and reduced-motion states", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.today-cinematic\{/);
  assert.match(css, /\.today-cinematic-scene\{/);
  assert.match(css, /data-visible="false"/);
  assert.match(css, /data-paused="true"/);
  assert.match(css, /data-save-data="true"/);
  assert.match(css, /@media\(max-width:700px\)[\s\S]*\.today-cinematic/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.today-cinematic/);
  assert.match(css, /rehmat-panjab-homepage-hero\.webp/);
  assert.match(css, /today-stage-poster/);
  assert.match(css, /cinematic-mist/);
  assert.match(css, /home-paths-grid/);
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
});

test("Guide variety and public reference-name correction are release scoped", async () => {
  const [guide, route, tester, migration] = await Promise.all([
    read("lib/rehmat-guide.ts"), read("app/api/rehmat-guide/route.ts"), read("lib/tester-packs.ts"),
    read("supabase/migrations/202610040001_restore_reference_product_names.sql"),
  ]);
  assert.match(guide, /recentContext/);
  assert.match(guide, /hasExplicitPreference/);
  assert.doesNotMatch(guide, /product\.summary,product\.description/);
  assert.match(guide, /materials_craft/);
  assert.match(guide, /application_storage/);
  assert.match(route, /recentContext/);
  assert.match(tester, /name: "Moon Paris"/);
  assert.doesNotMatch(tester, /Inspired Perfume Oil/);
  assert.match(migration, /\('mahnoor','Moon Paris'/);
  assert.match(migration, /inspiration_line = null/);
});
