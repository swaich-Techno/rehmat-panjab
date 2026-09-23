import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("cinematic campaign uses owned assets and an accessible escape path", async () => {
  const campaign = await read("app/components/homepage-campaign.tsx");
  assert.match(campaign, /rehmat-panjab-homepage-hero\.webp/);
  assert.match(campaign, /rose-gold-bottle-oil\.webp/);
  assert.match(campaign, /href="#featured-fragrances"/);
  assert.match(campaign, /requestAnimationFrame/);
  assert.match(campaign, /cancelAnimationFrame/);
  assert.match(campaign, /prefers-reduced-motion/);
});

test("storefront motion has mobile and reduced-motion fallbacks", async () => {
  const css = await read("app/globals.css");
  const productMotion = await read("app/components/product-story-motion.tsx");
  assert.match(css, /\.campaign-cinema\s*\{[^}]*height:\s*360svh/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.campaign-cinema\s*\{\s*height:250svh/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.campaign-cinema\s*\{\s*height:100svh/);
  assert.match(productMotion, /observer\.disconnect\(\)/);
  assert.match(productMotion, /removeEventListener\("scroll"/);
});
