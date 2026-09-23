import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("public checkout remains behind both commerce and server Razorpay flags",async()=>{
  const [commerce,create,verify,env]=await Promise.all([read("lib/commerce.ts"),read("app/api/create-order/route.ts"),read("app/api/verify-payment/route.ts"),read(".env.example")]);
  assert.match(commerce,/RAZORPAY_CHECKOUT_ENABLED = COMMERCE_ENABLED && RAZORPAY_ENABLED/);
  assert.match(create,/RAZORPAY_CHECKOUT_ENABLED/);
  assert.match(verify,/RAZORPAY_CHECKOUT_ENABLED/);
  assert.match(env,/NEXT_PUBLIC_COMMERCE_ENABLED=false/);
  assert.match(env,/RAZORPAY_ENABLED=false/);
});

test("server verifies capture, amount and currency before completing an order",async()=>{
  const verify=await read("app/api/verify-payment/route.ts");
  assert.match(verify,/payments\.fetch\(paymentId\)/);
  assert.match(verify,/payment\.status!=="captured"/);
  assert.match(verify,/Number\(payment\.amount\)!==Number\(internalOrder\.total_paise\)/);
  assert.match(verify,/payment\.currency!==internalOrder\.currency/);
  assert.match(verify,/complete_razorpay_order/);
});

test("webhooks verify raw-body signatures and process financial effects idempotently",async()=>{
  const [route,migration]=await Promise.all([read("app/api/razorpay/webhook/route.ts"),read("supabase/migrations/202609100004_razorpay_readiness.sql")]);
  assert.match(route,/const body=await request\.text\(\)/);
  assert.match(route,/x-razorpay-signature/);
  assert.match(route,/x-razorpay-event-id/);
  for(const event of ["payment.captured","payment.failed","order.paid","refund.processed","refund.failed"])assert.match(route,new RegExp(event.replace(".","\\.")));
  assert.match(route,/claimError\?\.code==="23505"/);
  assert.match(migration,/event_id text primary key/);
});

test("refunds require super-admin approval and a unique idempotency key",async()=>{
  const [route,migration]=await Promise.all([read("app/api/admin/razorpay/refund/route.ts"),read("supabase/migrations/202609100004_razorpay_readiness.sql")]);
  assert.match(route,/role!=="super_admin"/);
  assert.match(route,/RAZORPAY_ENABLED/);
  assert.match(route,/Refund exceeds the paid merchandise amount/);
  assert.match(migration,/idempotency_key text not null unique/);
});

test("live credential diagnostic is protected, non-financial and never returns secrets",async()=>{
  const route=await read("app/api/admin/readiness/razorpay/route.ts");
  assert.match(route,/role!=="super_admin"/);
  assert.match(route,/\/v1\/orders\?count=1/);
  assert.match(route,/rzp_live_/);
  assert.doesNotMatch(route,/NextResponse\.json\([^)]*(keyId|keySecret|publicKey)/);
  assert.doesNotMatch(route,/payments\.create|orders\.create|refunds\.create/);
});

test("signed webhook diagnostic is protected and proves retry idempotency",async()=>{
  const route=await read("app/api/admin/readiness/webhook/route.ts");
  assert.match(route,/role!=="super_admin"/);assert.match(route,/RAZORPAY_WEBHOOK_SECRET/);
  assert.match(route,/createHmac\("sha256",secret\)/);assert.match(route,/retryBody\.duplicate===true/);
  assert.doesNotMatch(route,/NextResponse\.json\((?:secret|\{secret)/);
});

test("captured-payment Telegram alerts are server-only, optional and webhook-idempotent",async()=>{
  const [telegram,webhook,readiness,diagnostic,env]=await Promise.all([read("lib/telegram.ts"),read("app/api/razorpay/webhook/route.ts"),read("app/api/admin/readiness/telegram/route.ts"),read("app/admin/readiness/razorpay-diagnostic.tsx"),read(".env.example")]);
  assert.match(telegram,/import "server-only"/);
  assert.match(telegram,/TELEGRAM_BOT_TOKEN/);assert.match(telegram,/TELEGRAM_ORDER_CHAT_ID/);
  assert.match(telegram,/api\.telegram\.org\/bot\$\{token\}\/sendMessage/);
  assert.doesNotMatch(telegram,/NEXT_PUBLIC_TELEGRAM/);
  assert.match(webhook,/sendTelegramOrderAlert/);assert.match(webhook,/claimError\?\.code==="23505"/);
  assert.match(readiness,/role!=="super_admin"/);assert.match(readiness,/telegram_message_sent/);
  assert.match(diagnostic,/Send Telegram test alert/);
  assert.match(env,/TELEGRAM_BOT_TOKEN=/);assert.match(env,/TELEGRAM_ORDER_CHAT_ID=/);
});

test("merchant, payment and below-threshold shipping wording is aligned",async()=>{
  const policy=await read("lib/policy-templates.ts");
  assert.match(policy,/Rehmat Panjab is operated by Harkirat Singh/);
  assert.match(policy,/below ₹1,000/);
  assert.match(policy,/Razorpay receives payment and transaction information/);
  assert.doesNotMatch(policy,/Free local delivery|return-to-origin courier costs may be deducted/i);
});

test("controlled live test stays super-admin-only while public commerce remains disabled",async()=>{
  const [guard,createOrder,verify,page,client,env]=await Promise.all([read("lib/controlled-payment.ts"),read("app/api/create-order/route.ts"),read("app/api/verify-payment/route.ts"),read("app/admin/readiness/payment-test/page.tsx"),read("app/admin/readiness/payment-test/controlled-payment-test.tsx"),read(".env.example")]);
  assert.match(guard,/x-rehmat-controlled-test/);assert.match(guard,/super_admin/);
  assert.match(createOrder,/Matching Live Mode credentials are required/);assert.match(createOrder,/controlled_test_order_prepared/);
  assert.match(verify,/controlled_test_payment_verified/);assert.match(page,/musk-rizali/);assert.match(page,/vanilla-musk/);
  assert.match(client,/I APPROVE/);assert.match(client,/No coupon/);assert.match(env,/NEXT_PUBLIC_COMMERCE_ENABLED=false/);assert.match(env,/RAZORPAY_ENABLED=false/);
});
