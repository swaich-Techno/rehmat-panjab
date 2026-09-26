import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration=readFileSync("supabase/migrations/202609260002_add_new_fragrance_bottle_sizes.sql","utf8");

test("ten new fragrances receive the exact approved 3, 6 and 12 ml catalogue",()=>{
  const rows=[
    ["MN",24900,49900,79900],["ML",24900,49900,79900],["SO",29900,59900,89900],
    ["SH",34900,69900,109900],["SD",24900,49900,79900],["NL",24900,49900,79900],
    ["IQ",24900,49900,79900],["SY",24900,49900,79900],["SF",24900,49900,79900],
    ["AD",24900,49900,79900]
  ];
  for(const [code,p3,p6,p12] of rows){
    for(const [size,price] of [["03",p3],["06",p6],["12",p12]]){
      assert.match(migration,new RegExp(`'RP-${code}-${size}',${price}`));
    }
  }
  assert.match(migration,/quantity=10,low_stock_threshold=2/);
  assert.match(migration,/tester_pack_eligible=\(excluded\.size_ml=3\)/);
  assert.match(migration,/conflicting SKU or price/);
  assert.match(migration,/count\(distinct variant\.sku\)/);
});

test("shared commerce remains server-authoritative and Razorpay stays gated",()=>{
  const purchase=readFileSync("app/components/product-purchase.tsx","utf8");
  const collection=readFileSync("app/collection/collection-catalogue.tsx","utf8");
  const quote=readFileSync("lib/quote.ts","utf8");
  const account=readFileSync("lib/account-cart.ts","utf8");
  const cart=readFileSync("app/cart/page-content.tsx","utf8");
  assert.match(purchase,/sizeMl: selected\.sizeMl/);
  assert.match(collection,/sku:selected\.sku/);
  assert.match(quote,/price_paise/);
  assert.match(account,/quantity-stock\.reserved/);
  assert.match(cart,/checkoutEnabled \?/);
});
