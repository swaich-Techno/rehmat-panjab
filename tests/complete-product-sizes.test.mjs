import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("the remaining five products expose approved 3 ml variants without changing 6 or 12 ml",async()=>{
  const [migration,testers]=await Promise.all([
    read("supabase/migrations/202610060001_activate_remaining_three_ml.sql"),
    read("lib/tester-packs.ts"),
  ]);
  for(const [slug,name,sku,price] of [
    ["amber-veil","BR540","RP-AV-03",29900],
    ["velvet-oud","Oud Satin Mood","RP-VO-03",37900],
    ["purple-oud","Purple Oud","RP-PO-03",32900],
    ["golden-dream","Golden Dream","RP-GD-03",29900],
    ["dubai-chocolate","Dubai Chocolate","RP-DC-03",24900],
  ]){
    assert.match(migration,new RegExp(`\\('${slug}','${sku}',${price}\\)`));
    assert.match(testers,new RegExp(`slug: "${slug}", name: "${name}", sku: "${sku}", pricePaise: ${price}`));
  }
  assert.match(migration,/enabled=true,[\s\S]*status='active',[\s\S]*tester_pack_eligible=true/);
  assert.match(migration,/quantity=10,low_stock_threshold=2/);
  assert.match(migration,/size_ml in \(3,6,12\)\)<>3/);
  assert.doesNotMatch(migration,/update public\.product_variants[^;]*size_ml\s+in\s*\(6,\s*12\)/is);
});
