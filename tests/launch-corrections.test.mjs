import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {calculatePercentageDiscountPaise,calculateShipping,FREE_SHIPPING_THRESHOLD_PAISE} from "../lib/shipping.ts";
import {products,productRedirects} from "../lib/products.ts";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("shipping uses exact post-discount INR minor-unit boundaries",()=>{
  assert.equal(FREE_SHIPPING_THRESHOLD_PAISE,150000);
  assert.equal(calculateShipping(149999).freeShipping,false);
  assert.equal(calculateShipping(150000).deliveryMethod,"free_standard_shipping");
  assert.equal(calculateShipping(150001).shippingPaise,0);
  const below=176469-calculatePercentageDiscountPaise(176469,15);
  const exact=176470-calculatePercentageDiscountPaise(176470,15);
  assert.equal(below,149999);assert.equal(calculateShipping(below).freeShipping,false);
  assert.equal(exact,150000);assert.equal(calculateShipping(exact).freeShipping,true);
});

test("local delivery requires an exact approved PIN and verified activation",()=>{
  const config={autoLocalDeliveryEnabled:true,approvedPins:["141401"]};
  assert.equal(calculateShipping(10000,"141401",config).deliveryMethod,"free_local_delivery");
  assert.equal(calculateShipping(10000,"141402",config).requiresManualConfirmation,true);
  assert.equal(calculateShipping(10000,"near Khanna",config).deliveryMethod,"standard_shipping_pending");
  assert.equal(calculateShipping(10000,"141401",{...config,autoLocalDeliveryEnabled:false}).requiresManualConfirmation,true);
});

test("GULNAAR preserves internal identity and exposes only secondary inspiration",()=>{
  const gulnaar=products.find(product=>product.slug==="gulnaar");
  assert.ok(gulnaar);assert.equal(gulnaar.id,"zara-candy");assert.equal(gulnaar.name,"GULNAAR");
  assert.equal(gulnaar.inspirationLine,"Inspired by Zara Candy");assert.deepEqual(gulnaar.enabledSizes,[6,12]);
  assert.equal(productRedirects["zara-candy"],"gulnaar");
});

test("launch migration preserves inventory and records guarded operational state",async()=>{
  const migration=await read("supabase/migrations/202609100001_launch_contact_shipping_gulnaar.sql"),correction=await read("supabase/migrations/202609100003_contact_and_razorpay_profile.sql");
  assert.doesNotMatch(migration,/update\s+public\.inventory/i);
  assert.match(migration,/product_slug_history/);assert.match(migration,/product_name_snapshot/);
  assert.match(correction,/whatsapp_number='917009464475'/);assert.match(migration,/support_email_verified_at=null/);
  assert.match(migration,/auto_eligibility_enabled boolean not null default false/);
  assert.match(migration,/\('razorpay','pending'/);assert.match(migration,/\('shiprocket','pending'/);
  assert.match(migration,/discount_type='percentage',value=15/);assert.match(migration,/free_shipping=false/);
});

test("customer links and policy safeguards use only the approved contact",async()=>{
  const [merchant,contact,footer,experience,templates,policyApi,deliveryApi,checkout]=await Promise.all([read("lib/merchant.ts"),read("app/contact/page.tsx"),read("app/components/site-footer.tsx"),read("lib/experience-settings.ts"),read("lib/policy-templates.ts"),read("app/api/admin/policies/route.ts"),read("app/api/admin/delivery/route.ts"),read("app/api/create-order/route.ts")]);
  const current=[merchant,contact,footer,experience,templates].join("\n");
  assert.match(current,/\+91 70094 64475/);assert.match(current,/917009464475/);assert.match(contact,/tel:\$\{merchant\.phoneE164\}/);assert.match(contact,/mailto:/);
  assert.doesNotMatch(current,/98769 13550|919876913550|Phone:\s*\+91(?:\D|$)/);
  assert.match(policyApi,/support_email_verified_at/);assert.match(deliveryApi,/\^\\d\{6\}\$/);assert.doesNotMatch(deliveryApi,/Khanna|Samrala/i);
  assert.match(checkout,/delivery_snapshot/);assert.match(checkout,/delivery charge must be calculated and disclosed before payment/);
});

test("Razorpay.me evidence is admin-only and does not activate checkout",async()=>{const [migration,readiness,commerce]=await Promise.all([read("supabase/migrations/202609100003_contact_and_razorpay_profile.sql"),read("app/admin/readiness/page.tsx"),read("lib/commerce.ts")]);assert.match(migration,/razorpay\.me\/@harkiratsingh5450/);assert.match(migration,/'razorpay_kyc_approved',true/);assert.match(migration,/status='pending'/);assert.match(readiness,/Share only after an order total is manually confirmed/);assert.match(commerce,/NEXT_PUBLIC_COMMERCE_ENABLED/);});
