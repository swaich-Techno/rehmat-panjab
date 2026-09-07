import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { addCartLine, cartCount, cartSubtotal, parseStoredCart, updateCartQuantity } from "../lib/cart.ts";
import { createRazorpayOrderToken, verifyRazorpayOrderToken, verifyRazorpayPaymentSignature } from "../lib/razorpay.ts";

const sample = { variantId: "variant-1", productSlug: "musk-rizali", productName: "Musk Rizali", sizeMl: 6, sku: "RP-MR-06", unitPricePaise: 49900, currency: "INR", image: "/musk.webp", maxQuantity: 3 };

test("cart quantities never exceed available stock", () => {
  const once = addCartLine([], { ...sample, quantity: 2 });
  const capped = addCartLine(once, { ...sample, quantity: 4 });
  assert.equal(capped[0].quantity, 3);
  assert.equal(cartCount(capped), 3);
  assert.equal(cartSubtotal(capped), 149700);
  assert.deepEqual(updateCartQuantity(capped, sample.variantId, 0), []);
});

test("persisted cart rejects malformed or stock-breaking lines", () => {
  assert.deepEqual(parseStoredCart("not-json"), []);
  assert.deepEqual(parseStoredCart(JSON.stringify([{ ...sample, quantity: 4 }])), []);
  assert.equal(parseStoredCart(JSON.stringify([{ ...sample, quantity: 2 }])).length, 1);
});

test("Razorpay signatures and server-issued order tokens reject tampering", () => {
  const secret = "test-secret";
  const orderId = "order_test_123";
  const paymentId = "pay_test_456";
  const signature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const token = createRazorpayOrderToken(orderId, secret);
  assert.equal(verifyRazorpayOrderToken(orderId, token, secret), true);
  assert.equal(verifyRazorpayOrderToken(`${orderId}x`, token, secret), false);
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret), true);
  assert.equal(verifyRazorpayPaymentSignature(orderId, `${paymentId}x`, signature, secret), false);
});

test("Razorpay order creation trusts catalogue prices and handles checkout failures", async () => {
  const [createOrder, verifyPayment, checkout] = await Promise.all([
    readFile(new URL("../app/api/create-order/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/verify-payment/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/razorpay-checkout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(createOrder, /select\("id, product_id, price_paise, enabled"\)/);
  assert.match(createOrder, /amount \+= variant\.price_paise \* quantity/);
  assert.doesNotMatch(createOrder, /parsed\.data\.amount/);
  assert.match(verifyPayment, /verifyRazorpayOrderToken/);
  assert.match(verifyPayment, /verifyRazorpayPaymentSignature/);
  assert.match(checkout, /payment\.failed/);
  assert.match(checkout, /ondismiss/);
});

test("final catalogue assigns all approved variants once without deployment stock resets", async () => {
  const [migration, createOrder, verifyPayment, envExample] = await Promise.all([
    readFile(new URL("../supabase/migrations/202609060001_final_catalogue_reviews_layering.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/create-order/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/verify-payment/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);
  for (const fixture of ["49900","79900","59900","85000","119900","69900","109900"]) assert.match(migration, new RegExp(fixture));
  for (const slug of ["musk-rizali","vanilla-musk","saffron-amber-oud","white-oud","oud-rose"]) assert.match(migration, new RegExp(slug));
  assert.match(migration, /catalogue_seed_versions/);
  assert.match(migration, /if not exists .*final-catalogue-2026-09/s);
  assert.match(migration, /quantity = 10, low_stock_threshold = 2/);
  assert.match(createOrder, /amount \+= variant\.price_paise \* quantity/);
  assert.match(verifyPayment, /complete_razorpay_order/);
  assert.match(envExample, /NEXT_PUBLIC_COMMERCE_ENABLED=false/);
});

test("catalogue visibility, purchasing, and admin mutations are server guarded", async () => {
  const [storefront, catalog, productApi, variantApi, cursor, commerce, header, purchase, cartPage, productPage] = await Promise.all([
    readFile(new URL("../lib/storefront.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/products/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/variants/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/rehmat-oil-cursor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/commerce.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/site-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/product-purchase.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cart/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/product/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(storefront, /\.in\("status", \["coming_soon", "active", "sold_out"\]\)/);
  assert.match(catalog, /product\.status === "active".*pricePaise !== null.*availableQuantity > 0/s);
  assert.match(productApi, /requireAdmin/);
  assert.match(productApi, /role !== "super_admin"/);
  assert.match(productApi, /enabled, priced variant with available stock/);
  assert.match(variantApi, /role !== "super_admin"/);
  assert.match(variantApi, /quantity < reserved/);
  assert.doesNotMatch(cursor, /oil-cursor-bottle|oil-satellite|oil-cursor-label/);
  assert.match(cursor, /requestAnimationFrame/);
  assert.match(cursor, /pointer: fine/);
  assert.match(cursor, /prefers-reduced-motion: reduce/);
  assert.match(cursor, /INTERACTIVE_TARGETS/);
  assert.match(commerce, /NEXT_PUBLIC_COMMERCE_ENABLED === "true"/);
  assert.match(storefront, /pricePaise: variant\.price_paise/);
  assert.match(header, /COMMERCE_ENABLED && <button className="header-cart"/);
  assert.match(purchase, /!COMMERCE_ENABLED && <p className="purchase-unavailable"/);
  assert.match(cartPage, /if \(!COMMERCE_ENABLED\) notFound\(\)/);
  assert.match(productPage, /COMMERCE_ENABLED \? \{ sku:.*offers:/s);
});

test("reviews are pending, private by default, rate limited, and moderated server-side", async () => {
  const [migration, publicApi, adminApi, reviewUi, productPage, header, layer] = await Promise.all([
    readFile(new URL("../supabase/migrations/202609060001_final_catalogue_reviews_layering.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/reviews/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/reviews/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/product-reviews.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/product/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/site-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layer/layering-lab.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /status text not null default 'pending'/);
  assert.match(migration, /create or replace view public\.public_product_reviews/);
  assert.doesNotMatch(migration.match(/create or replace view public\.public_product_reviews[\s\S]*?;/)?.[0] ?? "", /email/);
  assert.match(publicApi, /Too many review attempts/);
  assert.match(publicApi, /submit_product_review/);
  assert.match(migration, /verified_purchase boolean not null default false/);
  assert.match(adminApi, /role !== "super_admin"/);
  assert.match(adminApi, /No matching paid order was found/);
  assert.match(reviewUi, /No reviews yet\. Be the first to share your experience with this fragrance\./);
  assert.match(productPage, /aggregateRating/);
  assert.match(productPage, /isPurchasable\(product, variant\)/);
  assert.match(header, /\["Layering Lab", "\/layer"\]/);
  assert.match(layer, /awaiting approval from the house/);
  assert.doesNotMatch(layer, /lightly above/);
});
