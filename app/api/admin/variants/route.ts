import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const optionalPrice = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().finite().min(0).max(100000).nullable());
const variantSchema = z.object({
  id: z.uuid().optional(),
  productId: z.uuid(),
  sizeMl: z.coerce.number().positive().max(1000),
  sku: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/),
  priceRupees: optionalPrice,
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000),
  enabled: z.boolean(),
}).refine((value) => !value.enabled || value.priceRupees !== null, { message: "An enabled variant needs a price.", path: ["priceRupees"] });

export async function POST(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const parsed = variantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the variant fields." }, { status: 400 });
  const value = parsed.data;
  const pricePaise = value.priceRupees === null ? null : Math.round(value.priceRupees * 100);
  const payload = { product_id: value.productId, size_ml: value.sizeMl, sku: value.sku.toUpperCase(), price_paise: pricePaise, enabled: value.enabled, updated_at: new Date().toISOString() };
  let variantId = value.id;
  let reserved = 0;

  if (variantId) {
    const { data: currentInventory } = await supabase.from("inventory").select("reserved").eq("variant_id", variantId).maybeSingle();
    reserved = currentInventory?.reserved ?? 0;
    if (value.quantity < reserved) return NextResponse.json({ message: `Quantity cannot be lower than ${reserved} reserved units.` }, { status: 409 });
  }

  if (variantId) {
    const { error } = await supabase.from("product_variants").update(payload).eq("id", variantId).eq("product_id", value.productId);
    if (error) return NextResponse.json({ message: "This variant could not be updated. Check that its size and SKU are unique." }, { status: 409 });
  } else {
    const { data, error } = await supabase.from("product_variants").insert(payload).select("id").single();
    if (error || !data) return NextResponse.json({ message: "This variant could not be created. Check that its size and SKU are unique." }, { status: 409 });
    variantId = data.id;
  }

  const { error: inventoryError } = await supabase.from("inventory").upsert({ variant_id: variantId, quantity: value.quantity, reserved, low_stock_threshold: value.lowStockThreshold, updated_at: new Date().toISOString() });
  if (inventoryError) return NextResponse.json({ message: "The variant saved, but its inventory could not be updated." }, { status: 500 });
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: value.id ? "variant.updated" : "variant.created", entity_type: "product_variant", entity_id: variantId, metadata: { product_id: value.productId, sku: payload.sku } });
  return NextResponse.json({ message: value.id ? "Variant updated." : "Variant created.", id: variantId });
}
