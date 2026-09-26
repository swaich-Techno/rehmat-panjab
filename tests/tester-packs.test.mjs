import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");
const roundRupees=(paise)=>Math.round(paise/100)*100;
const total=(prices,discount)=>roundRupees(prices.reduce((sum,price)=>sum+price,0)*(100-discount)/100);

test("all twenty-five 3 ml variants are draft-gated with independent inventory",async()=>{
  const migration=await read("supabase/migrations/202609240001_three_ml_testers.sql");
  for(const [slug,sku,price] of [
    ["musk-rizali","RP-MR-03",29900],["vanilla-musk","RP-VM-03",34900],["white-oud","RP-WO-03",34900],["oud-rose","RP-OR-03",39900],["junoon","RP-JN-03",39900],["red-musk","RP-RM-03",34900],["nazakat","RP-NZ-03",34900],["gulnaar","RP-GL-03",34900],["deer-musk","RP-DM-03",37900],["afsoon","RP-AF-03",29900],["amber-veil","RP-AV-03",29900],["velvet-oud","RP-VO-03",37900],["purple-oud","RP-PO-03",32900],["golden-dream","RP-GD-03",29900],["dubai-chocolate","RP-DC-03",24900],
    ["mahnoor","RP-MN-03",24900],["milaap","RP-ML-03",24900],["sukoon-oud","RP-SO-03",29900],["shaan-oud","RP-SH-03",34900],["samandar","RP-SD-03",24900],["neel","RP-NL-03",24900],["ishq","RP-IQ-03",24900],["siyah-oud","RP-SY-03",24900],["safaa-musk","RP-SF-03",24900],["adaa","RP-AD-03",24900],
  ])assert.match(migration,new RegExp(`\\('${slug}','${sku}',${price}\\)`));
  assert.match(migration,/size_ml=3 and variant\.tester_pack_eligible/);
  assert.match(migration,/select variant\.id,0,0,2/);
  assert.match(migration,/enabled=false,[\s\S]*status='draft'/);
  assert.doesNotMatch(migration,/size_ml\s+in\s*\(6,\s*12\)/i);
});

test("pack prices use distinct lowest approved testers, whole-rupee rounding and exact discounts",async()=>{
  const source=await read("lib/tester-packs.ts");
  const prices=[24900,29900,29900,29900,29900,32900,34900,34900,34900,34900,34900,37900,37900,39900,39900];
  assert.equal(total(prices.slice(0,2),5),52100);
  assert.equal(total(prices.slice(0,3),8),77900);
  assert.equal(total(prices.slice(0,5),12),127200);
  const expanded=[...prices,24900,24900,29900,34900,24900,24900,24900,24900,24900,24900].sort((a,b)=>a-b);
  assert.equal(total(expanded.slice(0,2),5),47300);
  assert.equal(total(expanded.slice(0,3),8),68700);
  assert.equal(total(expanded.slice(0,5),12),109600);
  assert.match(source,/pricesPaise\.length !== packSize/);
  assert.match(source,/discountPercent: 5/); assert.match(source,/discountPercent: 8/); assert.match(source,/discountPercent: 12/);
  assert.match(source,/roundPaiseToWholeRupee/);
});

test("approved launch migration activates exactly twenty 3 ml variants at owner-approved prices",async()=>{
  const [migration,source]=await Promise.all([read("supabase/migrations/202609260001_launch_complete_three_ml.sql"),read("lib/tester-packs.ts")]);
  const approved=[
    ["RP-MR-03",24900],["RP-VM-03",29900],["RP-WO-03",29900],["RP-OR-03",34900],["RP-JN-03",34900],
    ["RP-RM-03",29900],["RP-NZ-03",29900],["RP-GL-03",29900],["RP-DM-03",34900],["RP-AF-03",29900],
    ["RP-MN-03",24900],["RP-ML-03",24900],["RP-SO-03",29900],["RP-SH-03",34900],["RP-SD-03",24900],
    ["RP-NL-03",24900],["RP-IQ-03",24900],["RP-SY-03",24900],["RP-SF-03",24900],["RP-AD-03",24900],
  ];
  for(const [sku,price] of approved){assert.match(migration,new RegExp(`\\('${sku}',${price}\\)`));assert.match(source,new RegExp(`sku: "${sku}", pricePaise: ${price}`));}
  assert.match(migration,/quantity=10,low_stock_threshold=2/);
  assert.match(migration,/enabled=true,[\s\S]*status='active',[\s\S]*tester_pack_eligible=true/);
  assert.match(migration,/Expected exactly 20 live 3 ml variants/);
  assert.match(migration,/RP-AV-03','RP-VO-03','RP-PO-03','RP-GD-03','RP-DC-03/);
  assert.doesNotMatch(migration,/size_ml\s+in\s*\(6,\s*12\)/i);
  assert.match(source,/Inspired by Zara Candy/);
});

test("server quote rejects duplicates and revalidates price, eligibility, stock and margin",async()=>{
  const [route,quote,createOrder]=await Promise.all([read("app/api/tester-packs/quote/route.ts"),read("lib/quote.ts"),read("app/api/create-order/route.ts")]);
  for(const pattern of [/new Set\(parsed\.data\.variantIds\)/,/price_paise/,/tester_pack_eligible/,/quantity-inventory\.reserved/,/margin_approved/,/packaging_approved/])assert.match(route,pattern);
  assert.match(quote,/new Set\(pack\.variantIds\)/);assert.match(quote,/calculateTesterPackPrice/);assert.match(quote,/couponDiscount>discountPaise/);assert.match(quote,/couponId=null;couponCode=null/);
  assert.match(createOrder,/testerPacks/);assert.match(createOrder,/tester_pack_group_id/);assert.match(createOrder,/calculateOrderQuote\(parsed\.data\.lines/);
});

test("packaging costs and private COGS launch gates are recorded",async()=>{
  const [migration,adminApi,costs]=await Promise.all([read("supabase/migrations/202609240001_three_ml_testers.sql"),read("app/api/admin/testers/route.ts"),read("lib/tester-packs.ts")]);
  for(const pattern of [/1175/,/1170/,/3520/,/4695/,/7045/,/total_oil_purchase_cost_paise/,/total_purchased_ml/,/margin_approved/,/packaging_approved/])assert.match(migration,pattern);
  assert.match(migration,/select variant\.id,1175,null,variant\.price_paise/);
  assert.match(migration,/alter table public\.tester_variant_costs enable row level security/);
  assert.doesNotMatch(migration,/public reads tester costs/i);
  assert.match(adminApi,/costSummary\.missing\.length === 0/);assert.match(adminApi,/bottle\?\.status !== "active"/);assert.match(adminApi,/quantity < 1/);
  for(const gate of [/contentApproved/,/imageApproved/,/minimumMarginPercent/,/packagingApproved/])assert.match(adminApi,gate);
  assert.match(costs,/costPerMlPaise = input\.totalOilPurchaseCostPaise! \/ input\.totalPurchasedMl/);
  assert.match(costs,/threeMlOilCostPaise = costPerMlPaise \* 3/);
  assert.match(costs,/\+ input\.packInsertCostPaise!/);
});

test("private oil inputs calculate exact 3 ml costs including corrected Musk Rizali",async()=>{
  const migration=await read("supabase/migrations/202609240001_three_ml_testers.sql");
  const inputs=[
    ["musk-rizali",154000,50,9240],["mahnoor",30500,50,1830],["milaap",21000,25,2520],
    ["sukoon-oud",44000,25,5280],["shaan-oud",55500,25,6660],["samandar",17000,25,2040],
    ["neel",17000,25,2040],["ishq",16000,25,1920],["siyah-oud",16500,25,1980],
    ["safaa-musk",51000,50,3060],["adaa",17000,25,2040],
  ];
  for(const [slug,purchase,ml,expected] of inputs){
    assert.match(migration,new RegExp(`\\('${slug}',${purchase},${ml}::numeric\\)`));
    assert.equal(purchase/ml*3,expected);
  }
  assert.equal(9240+1175,10415);
  assert.match(migration,/minimum_margin_percent/);
  assert.match(migration,/tester_product_intake/);
});

test("new names stay primary while scent-direction references remain secondary",async()=>{
  const migration=await read("supabase/migrations/202609240001_three_ml_testers.sql");
  for(const name of ["MAHNOOR","MILAAP","SUKOON OUD","SHAAN OUD","SAMANDAR","NEEL","ISHQ","SIYAH OUD","SAFAA MUSK","ADAA"])assert.match(migration,new RegExp(`'${name}'`));
  assert.match(migration,/alter table public\.tester_product_intake enable row level security/);
  assert.doesNotMatch(migration,/public reads tester intake/i);
  for(const reference of ["Mon Paris scent direction","Wisal scent direction","Oud Mood scent direction","Oud for Glory scent direction","Acqua di Giò scent direction","Light Blue scent direction","Love Spell scent direction","Black Oud scent direction","Musk Al Tahara scent direction","Bombshell scent direction"])assert.match(migration,new RegExp(reference));
  assert.match(migration,/status='active',notes=excluded\.notes,notes_verified=true/);
  assert.match(migration,/select variant\.id,0,0,2/);
});

test("tester UI is responsive, persistent-cart ready and shows live launch state",async()=>{
  const [builder,home,cart,provider,css,commerce]=await Promise.all([read("app/testers/tester-builder.tsx"),read("app/components/tester-preview.tsx"),read("lib/cart.ts"),read("app/components/cart-provider.tsx"),read("app/globals.css"),read("lib/commerce.ts")]);
  assert.match(builder,/aria-pressed/);assert.match(builder,/Checking availability/);assert.match(builder,/testerPack:/);assert.match(builder,/selectedLive\.map/);
  assert.match(home,/Discover the 3 ml Tester Collection/);assert.match(home,/Explore Individual Testers/);assert.match(home,/Available now/);assert.match(home,/Copy code/);assert.match(home,/policies\/terms/);
  assert.match(cart,/testerPack\?/);assert.match(provider,/localStorage/);assert.match(css,/@media\(max-width:600px\)[^{]*\{[^}]*\.tester-preview/s);
  assert.match(css,/perspective:900px/);assert.match(css,/rotateY\(-4deg\)/);assert.match(css,/scroll-snap-type:x mandatory/);assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(commerce,/NEXT_PUBLIC_COMMERCE_ENABLED === "true"/);
});
