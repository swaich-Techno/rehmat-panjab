import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { COMMERCE_ENABLED } from "../../../lib/commerce";
import { createRazorpayOrderToken } from "../../../lib/razorpay";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { calculateOrderQuote } from "../../../lib/quote";

const requestSchema = z.object({
  lines: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
  }).strict()).min(1).max(20),
  couponCode: z.string().trim().max(40).optional(),
}).strict();

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return 500;
  return Number(error.statusCode) === 401 ? 401 : 500;
}

export async function POST(request: Request) {
  if (!COMMERCE_ENABLED) return NextResponse.json({ message: "Checkout is not open yet." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Your cart could not be validated." }, { status: 400 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ message: "Payment service is not configured." }, { status: 503 });

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabase || !supabaseAdmin) return NextResponse.json({ message: "The catalogue is temporarily unavailable." }, { status: 503 });

  const quantities = new Map<string, number>();
  for (const line of parsed.data.lines) quantities.set(line.variantId, (quantities.get(line.variantId) ?? 0) + line.quantity);
  if ([...quantities.values()].some((quantity) => quantity > 10)) {
    return NextResponse.json({ message: "A maximum of 10 units is allowed per item." }, { status: 400 });
  }

  const variantIds = [...quantities.keys()];
  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id, price_paise, enabled")
    .in("id", variantIds);
  if (variantError) return NextResponse.json({ message: "Your cart could not be checked." }, { status: 500 });

  const productIds = [...new Set((variants ?? []).map((variant) => variant.product_id))];
  const [{ data: products, error: productError }, { data: inventory, error: inventoryError }] = await Promise.all([
    supabase.from("products").select("id, status").in("id", productIds),
    supabase.from("inventory").select("variant_id, quantity, reserved").in("variant_id", variantIds),
  ]);
  if (productError || inventoryError) return NextResponse.json({ message: "Your cart could not be checked." }, { status: 500 });

  const variantById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
  const statusByProduct = new Map((products ?? []).map((product) => [product.id, product.status]));
  const inventoryByVariant = new Map((inventory ?? []).map((row) => [row.variant_id, row]));
  let amount = 0;

  for (const [variantId, quantity] of quantities) {
    const variant = variantById.get(variantId);
    const stock = inventoryByVariant.get(variantId);
    if (!variant || !variant.enabled || statusByProduct.get(variant.product_id) !== "active" || variant.price_paise === null) {
      return NextResponse.json({ message: "An item in your cart is no longer available." }, { status: 409 });
    }
    if (!Number.isInteger(variant.price_paise) || variant.price_paise < 0 || !stock || stock.quantity - stock.reserved < quantity) {
      return NextResponse.json({ message: "An item does not have enough available stock." }, { status: 409 });
    }
    amount += variant.price_paise * quantity;
  }

  const quote=await calculateOrderQuote([...quantities].map(([variantId,quantity])=>({variantId,quantity})),parsed.data.couponCode).catch(()=>null);
  if(!quote) return NextResponse.json({message:"The final total could not be calculated."},{status:409});
  const subtotal=amount; amount=quote.totalPaise;
  if (!Number.isSafeInteger(amount) || amount < 100) {
    return NextResponse.json({ message: "The payment total must be at least ₹1." }, { status: 400 });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const receipt = `rp_${Date.now().toString(36)}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt });
    const { data: authData } = await supabase.auth.getUser();
    const { data: savedOrder, error: orderError } = await supabaseAdmin.from("orders").insert({
      user_id: authData.user?.id ?? null,
      status: "pending",
      currency: "INR",
      subtotal_paise: subtotal,
      shipping_paise: 0,
      discount_paise: quote.discountPaise,
      total_paise: amount,
      razorpay_order_id: order.id,
      coupon_id: quote.couponId,
      coupon_code: quote.couponCode,
    }).select("id").single();
    if (orderError || !savedOrder) return NextResponse.json({ message: "The payment order could not be saved." }, { status: 500 });

    const orderItems = [...quantities].map(([variantId, quantity]) => ({
      order_id: savedOrder.id,
      variant_id: variantId,
      quantity,
      unit_price_paise: variantById.get(variantId)!.price_paise!,
    }));
    const { error: itemError } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemError) {
      await supabaseAdmin.from("orders").delete().eq("id", savedOrder.id);
      return NextResponse.json({ message: "The payment order could not be saved." }, { status: 500 });
    }
    return NextResponse.json({
      order_id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      order_token: createRazorpayOrderToken(order.id, keySecret),
    });
  } catch (error) {
    const status = errorStatus(error);
    return NextResponse.json(
      { message: status === 401 ? "Payment credentials were rejected." : "The payment order could not be created." },
      { status },
    );
  }
}
