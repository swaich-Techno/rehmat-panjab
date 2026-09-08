import { NextResponse } from "next/server";
import { z } from "zod";
import { COMMERCE_ENABLED } from "../../../lib/commerce";
import { verifyRazorpayOrderToken, verifyRazorpayPaymentSignature } from "../../../lib/razorpay";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

const requestSchema = z.object({
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
  order_token: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

export async function POST(request: Request) {
  if (!COMMERCE_ENABLED) return NextResponse.json({ message: "Checkout is not open yet." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Payment details are incomplete." }, { status: 400 });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ success: false, message: "Payment service is not configured." }, { status: 503 });

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, order_token: orderToken } = parsed.data;
  const validOrder = verifyRazorpayOrderToken(orderId, orderToken, secret);
  const validSignature = verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret);
  if (!validOrder || !validSignature) {
    return NextResponse.json({ success: false, message: "Payment verification failed." }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return NextResponse.json({ success: false, message: "Order storage is not configured." }, { status: 503 });
  const { data: remaining, error } = await supabaseAdmin.rpc("complete_razorpay_order", {
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
  });
  if (error) return NextResponse.json({ success: false, message: "Payment is valid, but the order could not be completed. Please contact support." }, { status: 409 });

  const {data:paid}=await supabaseAdmin.from("orders").select("id,coupon_id,subtotal_paise,discount_paise,user_id").eq("razorpay_order_id",orderId).single();
  if(paid?.coupon_id&&paid.discount_paise){await supabaseAdmin.from("coupon_redemptions").upsert({coupon_id:paid.coupon_id,order_id:paid.id,customer_identifier:paid.user_id,eligible_subtotal_paise:paid.subtotal_paise??0,discount_paise:paid.discount_paise,confirmation_status:"confirmed",payment_status:"paid",idempotency_reference:`razorpay:${paymentId}`},{onConflict:"idempotency_reference"});}

  return NextResponse.json({ success: true, payment_id: paymentId, remaining_quantity: remaining });
}
