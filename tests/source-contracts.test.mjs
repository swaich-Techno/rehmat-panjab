import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("product data stays honest and size-safe", async () => {
  const products = await read("lib/products.ts");
  assert.doesNotMatch(products, /enabledSizes:\s*\[[^\]]*24/);
  assert.match(products, /enabledSizes:\s*\[6, 12\]/);
  assert.doesNotMatch(products, /price|rating|reviews/i);
  assert.match(products, /coming_soon/);
});

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
  const [css, quiz] = await Promise.all([read("app/globals.css"), read("app/find-your-scent/scent-quiz.tsx")]);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(quiz, /Hold to feel/);
  assert.match(quiz, /500/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
