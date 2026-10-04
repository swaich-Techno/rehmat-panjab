import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("offers page publishes only established promotion terms", () => {
  const offers = read("lib/public-offers.ts");
  const page = read("app/offers/page.tsx");
  assert.match(offers, /WELCOME_PUBLIC_LABEL/);
  assert.match(offers, /BUY_TWO_GIFT_LABEL/);
  assert.match(offers, /FESTIVAL_PUBLIC_LABEL/);
  assert.match(offers, /Maximum saving ₹900/);
  assert.match(offers, /No discount or coupon is promised/);
  assert.match(page, /single highest-value eligible saving is applied/i);
  assert.doesNotMatch(page, /9\.4K|128 comments|limited seats|hurry/i);
});

test("offer dates and verified festival calendar remain explicit", () => {
  const offers = read("lib/public-offers.ts");
  const promotions = read("lib/promotions.mjs");
  assert.match(promotions, /2026-10-08T18:30:00\.000Z/);
  assert.match(promotions, /2026-10-23T18:29:59\.999Z/);
  assert.match(offers, /Dussehra falls on 20 October 2026/);
  assert.match(offers, /festivalDate: "8 November 2026"/);
  assert.match(offers, /revealDate: "29 October 2026"/);
});

test("offers are discoverable and product pages retain authentic bottle interaction", () => {
  const header = read("app/components/site-header.tsx");
  const footer = read("app/components/site-footer.tsx");
  const sitemap = read("app/sitemap.ts");
  const product = read("app/product/[slug]/page.tsx");
  assert.match(header, /\["Offers", "\/offers"\]/);
  assert.match(footer, /href="\/offers"/);
  assert.match(sitemap, /"\/offers"/);
  assert.match(product, /InteractiveProductMedia product=\{product\}/);
  assert.match(product, /product-opening-commerce/);
  assert.match(product, /id="choose-bottle"/);
  assert.doesNotMatch(product, /invented|placeholder\.com/i);
});
