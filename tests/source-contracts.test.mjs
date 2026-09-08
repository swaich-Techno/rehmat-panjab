import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("product data stays honest and size-safe", async () => {
  const products = await read("lib/products.ts");
  assert.doesNotMatch(products, /enabledSizes:\s*\[[^\]]*24/);
  assert.equal((products.match(/enabledSizes:\s*\[6,\s*12\]/g) ?? []).length, 9);
  for (const price of [49900,79900,59900,84900,89900,69900,109900,64900,94900]) assert.match(products, new RegExp(String(price)));
  for (const name of ["Musk Rizali","Vanilla Musk","White Oud","Oud Rose","JUNOON","Red Musk","NAZAKAT","Zara Candy","Deer Musk"]) assert.match(products,new RegExp(name));
  assert.doesNotMatch(products,/name:\s*"Saffron Amber Oud"/);
  assert.doesNotMatch(products, /rating|reviewCount/i);
});

test("catalogue migration archives the retired oil and preserves inventory",async()=>{const migration=await read("supabase/migrations/202609070002_catalogue_promotions_readiness.sql");assert.match(migration,/slug='saffron-amber-oud'/);assert.match(migration,/status='archived'/);assert.match(migration,/search_aliases/);assert.match(migration,/on conflict\(variant_id\) do nothing/);assert.doesNotMatch(migration,/set quantity\s*=/i);});

test("legacy inspiration slugs redirect on the product route",async()=>{const page=await read("app/product/[slug]/page.tsx");assert.match(page,/productRedirects\[slug\].*permanentRedirect/s);assert.match(page,/export default async function ProductPage[\s\S]*productRedirects\[slug\]/);});

test("promotions stay private and quoted totals are server authoritative",async()=>{const [migration,quote,createOrder,admin]=await Promise.all([read("supabase/migrations/202609070002_catalogue_promotions_readiness.sql"),read("lib/quote.ts"),read("app/api/create-order/route.ts"),read("app/api/admin/promotions/route.ts")]);assert.match(migration,/coupons_code_ci_unique/);assert.match(migration,/coupons super admin/);assert.match(quote,/price_paise/);assert.match(quote,/Math\.max\(0,subtotalPaise-discountPaise\)/);assert.match(createOrder,/calculateOrderQuote/);assert.match(admin,/role!=="super_admin"/);});

test("private routes are noindex and admin access is server-side", async () => {
  const [adminLayout, adminPage, auth, robots] = await Promise.all([read("app/admin/layout.tsx"), read("app/admin/page.tsx"), read("lib/supabase/auth.ts"), read("app/robots.ts")]);
  assert.match(adminLayout, /index:\s*false/);
  assert.match(adminLayout, /follow:\s*false/);
  assert.match(adminPage, /requireAdmin/);
  assert.match(auth, /supabase\.auth\.getUser/);
  assert.match(auth, /admin.*super_admin/);
  assert.match(robots, /\/admin/);
});

test("persistence schema enables RLS and unique vote protection", async () => {
  const migration = await read("supabase/migrations/202609040001_rehmat_core.sql");
  assert.match(migration, /alter table public\.products enable row level security/i);
  assert.match(migration, /unique\(campaign_id,user_id\)/i);
  assert.match(migration, /unique\(user_id,campaign_id\)/i);
  assert.match(migration, /is_super_admin\(\)/i);
  assert.doesNotMatch(migration, /password|access_token|session_cookie/i);
});

test("motion and interaction accessibility are explicit", async () => {
  const [css, quiz, cursor] = await Promise.all([read("app/globals.css"), read("app/find-your-scent/scent-quiz.tsx"), read("app/components/rehmat-oil-cursor.tsx")]);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(quiz, /aria-pressed/);
  assert.match(quiz, /role="progressbar"/);
  assert.match(cursor, /requestAnimationFrame/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
