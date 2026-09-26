import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";
import test from "node:test";

const read=path=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("customer account routes and passwordless Supabase authentication are complete",async()=>{
  for(const path of ["app/account/page.tsx","app/account/sign-in/page.tsx","app/account/orders/page.tsx","app/account/orders/[orderId]/page.tsx","app/account/profile/page.tsx","app/account/addresses/page.tsx","app/auth/callback/route.ts"])assert.ok((await stat(new URL(`../${path}`,import.meta.url))).isFile());
  const [signin,callback,header,layout]=await Promise.all([read("app/account/sign-in/magic-link-sign-in.tsx"),read("app/auth/callback/route.ts"),read("app/components/site-header.tsx"),read("app/account/layout.tsx")]);
  assert.match(signin,/signInWithOtp/);assert.match(signin,/emailRedirectTo/);assert.doesNotMatch(signin,/signInWithOAuth/);
  assert.match(callback,/exchangeCodeForSession/);assert.match(header,/href="\/account"/);assert.match(header,/mobile-account-link/);assert.match(layout,/index:false/);
});

test("customer data is owner-scoped and guest claims require the verified order email",async()=>{
  const [core,accounts,claim,orders,detail]=await Promise.all([read("supabase/migrations/202609040001_rehmat_core.sql"),read("supabase/migrations/202609250001_customer_accounts.sql"),read("app/api/account/orders/claim/route.ts"),read("app/account/orders/page.tsx"),read("app/account/orders/[orderId]/page.tsx")]);
  assert.match(core,/orders own read[\s\S]*user_id = auth\.uid\(\)/);assert.match(core,/order items own read[\s\S]*o\.user_id = auth\.uid\(\)/);
  assert.match(accounts,/customers manage own cart[\s\S]*user_id=auth\.uid\(\)/);assert.match(accounts,/customers manage own cart items[\s\S]*cart\.user_id=auth\.uid\(\)/);
  assert.match(accounts,/lower\(coalesce\(delivery_snapshot->>'email',''\)\)=verified_email/);assert.match(accounts,/user_id is null/);assert.match(accounts,/grant execute[\s\S]*authenticated/);
  assert.match(claim,/claim_guest_order/);assert.match(orders,/\.eq\("user_id",data\.user\.id\)/);assert.match(detail,/\.eq\("user_id",data\.user\.id\)/);
  assert.doesNotMatch(`${orders}${detail}`,/tester_variant_costs|gross_margin|service_role|admin_notes/i);
});

test("signed-in cart merge and Buy Again revalidate current catalogue authority",async()=>{
  const [provider,cartApi,reprice,buyAgain,client]=await Promise.all([read("app/components/cart-provider.tsx"),read("app/api/account/cart/route.ts"),read("lib/account-cart.ts"),read("app/api/account/orders/[orderId]/buy-again/route.ts"),read("app/account/orders/buy-again.tsx")]);
  assert.match(provider,/mergeCartLines/);assert.match(provider,/\/api\/account\/cart/);assert.match(cartApi,/repriceCartItems/);assert.match(reprice,/price_paise/);assert.match(reprice,/quantity-stock\.reserved/);assert.match(reprice,/calculateTesterPackPrice/);
  assert.match(provider,/remote\.authenticated===false/);assert.match(cartApi,/authenticated:false,lines:null/);
  assert.match(buyAgain,/\.eq\("user_id",data\.user\.id\)/);assert.match(buyAgain,/repriceCartItems/);assert.doesNotMatch(buyAgain,/coupon|previous.*price/i);assert.match(client,/Previous coupons are not restored/);
});

test("Add to Cart coverage remains server-gated across customer purchase surfaces",async()=>{
  const [home,collection,purchase,builder,guide,commerce,whatsapp]=await Promise.all([read("app/page.tsx"),read("app/collection/collection-catalogue.tsx"),read("app/components/product-purchase.tsx"),read("app/testers/tester-builder.tsx"),read("app/components/rehmat-guide.tsx"),read("lib/commerce.ts"),read("app/components/whatsapp-order.tsx")]);
  assert.match(home,/ProductAddButton/);assert.match(collection,/Add to cart/);assert.match(collection,/Quick view/);assert.match(purchase,/Add to cart/);assert.match(builder,/cart\.add/);assert.match(guide,/Add to cart/);
  assert.match(commerce,/RAZORPAY_CHECKOUT_ENABLED = COMMERCE_ENABLED && RAZORPAY_ENABLED/);assert.match(whatsapp,/order request/i);assert.doesNotMatch(whatsapp,/orders.*insert|order history/i);
});

test("tester and account migrations preserve draft, private-cost and structural gates",async()=>{
  const [tester,accounts]=await Promise.all([read("supabase/migrations/202609240001_three_ml_testers.sql"),read("supabase/migrations/202609250001_customer_accounts.sql")]);
  assert.match(tester,/order_items_tester_pack_pair_check/);assert.match(tester,/validate_tester_pack_group/);assert.match(tester,/count\(distinct variant_id\)/);assert.match(tester,/select variant\.id,1175,null,variant\.price_paise/);
  assert.match(tester,/enabled=false,[\s\S]*status='draft'/);assert.match(tester,/select variant\.id,0,0,2/);assert.doesNotMatch(tester,/size_ml\s+in\s*\(6,\s*12\)/i);
  assert.match(accounts,/tracking_number/);assert.match(accounts,/uuid_array_is_distinct/);assert.match(accounts,/revoke update on public\.profiles/);
});
