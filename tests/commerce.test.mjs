import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { addCartLine, cartCount, cartSubtotal, parseStoredCart, updateCartQuantity } from "../lib/cart.ts";

const sample = { variantId: "variant-1", productSlug: "musk-rizali", productName: "Musk Rizali", sizeMl: 6, sku: "RP-MR-06", unitPricePaise: 249900, currency: "INR", image: "/musk.webp", maxQuantity: 3 };

test("cart quantities never exceed available stock", () => {
  const once = addCartLine([], { ...sample, quantity: 2 });
  const capped = addCartLine(once, { ...sample, quantity: 4 });
  assert.equal(capped[0].quantity, 3);
  assert.equal(cartCount(capped), 3);
  assert.equal(cartSubtotal(capped), 749700);
  assert.deepEqual(updateCartQuantity(capped, sample.variantId, 0), []);
});

test("persisted cart rejects malformed or stock-breaking lines", () => {
  assert.deepEqual(parseStoredCart("not-json"), []);
  assert.deepEqual(parseStoredCart(JSON.stringify([{ ...sample, quantity: 4 }])), []);
  assert.equal(parseStoredCart(JSON.stringify([{ ...sample, quantity: 2 }])).length, 1);
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
  assert.match(commerce, /NEXT_PUBLIC_COMMERCE_ENABLED === "true"/);
  assert.match(storefront, /COMMERCE_ENABLED \? variant\.price_paise : null/);
  assert.match(header, /COMMERCE_ENABLED && <button className="header-cart"/);
  assert.match(purchase, /if \(!COMMERCE_ENABLED\)/);
  assert.match(cartPage, /if \(!COMMERCE_ENABLED\) notFound\(\)/);
  assert.match(productPage, /COMMERCE_ENABLED \? \{ sku:.*offers:/s);
});
