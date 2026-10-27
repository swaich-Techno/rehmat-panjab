import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("offers page publishes only established promotion terms", () => {
  const offers = read("lib/public-offers.ts");
  const page = read("app/offers/page.tsx") + read("app/offers/offer-list.tsx");
  assert.match(offers, /WELCOME_PUBLIC_LABEL/);
  assert.match(offers, /BUY_TWO_GIFT_LABEL/);
  assert.match(offers, /FESTIVAL_PUBLIC_LABEL/);
  assert.match(offers, /Maximum saving ₹900/);
  assert.match(offers, /Shop 60% off/);
  assert.match(offers, /Try 3 ml for ₹99/);
  assert.match(offers, /does not reserve stock/);
  assert.match(page, /single highest-value eligible saving is applied/i);
  assert.doesNotMatch(page, /9\.4K|128 comments|limited seats|hurry/i);
});

test("offer dates and verified festival calendar remain explicit", () => {
  const offers = read("lib/public-offers.ts");
  const promotions = read("lib/promotions.mjs");
  assert.match(promotions, /2026-10-08T18:30:00\.000Z/);
  assert.match(promotions, /2026-10-23T18:29:59\.999Z/);
  assert.match(promotions, /2026-10-31T18:30:00\.000Z/);
  assert.match(promotions, /2026-11-10T18:29:59\.999Z/);
  assert.match(offers, /Dussehra falls on 20 October 2026/);
  assert.match(offers, /1 November 2026, 12:00 AM IST/);
  assert.match(offers, /10 November 2026, 11:59 PM IST/);
});

test("Diwali popup is session-limited, accessible and reduced-motion safe",()=>{const popup=read("app/components/diwali-campaign.tsx"),styles=read("app/globals.css");assert.match(popup,/sessionStorage/);assert.match(popup,/1_200/);assert.match(popup,/role="dialog"/);assert.match(popup,/aria-modal="true"/);assert.match(popup,/event\.key === "Escape"/);assert.match(popup,/document\.body\.style\.overflow/);assert.match(popup,/navigator\.share/);assert.match(styles,/prefers-reduced-motion:reduce/);assert.match(styles,/\.diwali-popup/);});

test("upcoming Ouds and Attars remain presentation-only",()=>{const data=read("lib/upcoming-fragrances.ts"),component=read("app/components/upcoming-fragrances.tsx"),collection=read("app/collection/page.tsx");for(const name of ["Dehn Al Oud Hindi","Dehn Al Oud Cambodi","Tobacco Oud","Saffron Oud","Attar Mitti","Ruh Khus","Shamama","Attar Motia"])assert.match(data,new RegExp(name));assert.match(component,/Coming soon/i);assert.doesNotMatch(component,/href=|ProductAddButton|formatMoney|price_paise|₹/i);assert.match(collection,/numberOfItems:products\.length/);});

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
