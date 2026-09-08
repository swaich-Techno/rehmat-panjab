import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const assetPath = z.string().trim().max(500).refine((value) => !/^https?:\/\//i.test(value), "Use a product-images storage path, not an external URL.").optional().default("");
const productSchema = z.object({
  id: z.uuid().optional(), productNumber: z.string().trim().min(1).max(3), name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "coming_soon", "active", "sold_out", "archived"]), subtitle: z.string().trim().max(180).optional().default(""), cardLine: z.string().trim().max(180).optional().default(""), microDescription: z.string().trim().max(240).optional().default(""), shortDescription: z.string().trim().max(500).optional().default(""), description: z.string().trim().max(4000).optional().default(""), scentFamily: z.string().trim().max(120).optional().default(""), character: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]), suitableFor: z.array(z.string().trim().min(1).max(80)).max(16).optional().default([]), suitability: z.enum(["unisex", "men", "women"]).default("unisex"), suitabilityNote: z.string().trim().max(180).optional().default(""), positioning: z.string().trim().max(180).optional().default(""), reviewsEnabled: z.boolean().optional().default(true), featured: z.boolean().optional().default(false), imagePath: assetPath, campaignImagePath: assetPath, imageAltText: z.string().trim().max(240).optional().default(""), imageDisplayOrder: z.coerce.number().int().min(0).max(999).optional().default(0), seoTitle: z.string().trim().max(120).optional().default(""), seoDescription: z.string().trim().max(320).optional().default(""), ogImagePath: assetPath,
});

function toPayload(value: z.infer<typeof productSchema>) {
  return { product_number: value.productNumber, name: value.name, slug: value.slug, status: value.status, subtitle: value.subtitle, card_line: value.cardLine || null, micro_description: value.microDescription || null, short_description: value.shortDescription, description: value.description, scent_family: value.scentFamily || null, scent_profile: { character: value.character }, occasions: value.suitableFor, suitability: value.suitability, suitability_note: value.suitabilityNote || null, positioning: value.positioning || null, reviews_enabled: value.reviewsEnabled, featured: value.featured, image_path: value.imagePath || null, campaign_image_path: value.campaignImagePath || null, image_alt_text: value.imageAltText || null, image_display_order: value.imageDisplayOrder, seo_title: value.seoTitle || null, seo_description: value.seoDescription || null, og_image_path: value.ogImagePath || null };
}

export async function POST(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Check the product fields and try again." }, { status: 400 });
  if (parsed.data.status === "active") return NextResponse.json({ message: "Create the product first, then add a priced, stocked variant before activating it." }, { status: 409 });
  const payload = toPayload(parsed.data);
  const { data, error } = await supabase.from("products").insert(payload).select("id").single();
  if (error) return NextResponse.json({ message: "This product could not be saved." }, { status: 500 });
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "product.created", entity_type: "product", entity_id: data.id, metadata: { slug: parsed.data.slug } });
  return NextResponse.json({ message: "Draft saved.", id: data.id });
}

export async function PATCH(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ message: "Check the product fields and try again." }, { status: 400 });
  if (parsed.data.status === "active") {
    const { data: variants } = await supabase.from("product_variants").select("id,price_paise,enabled,inventory(quantity,reserved)").eq("product_id", parsed.data.id).eq("enabled", true);
    const ready = (variants ?? []).some((variant) => { const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory; return variant.price_paise !== null && (inventory?.quantity ?? 0) > (inventory?.reserved ?? 0); });
    if (!ready) return NextResponse.json({ message: "An active product needs at least one enabled, priced variant with available stock." }, { status: 409 });
  }
  const { error } = await supabase.from("products").update({ ...toPayload(parsed.data), updated_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ message: "This product could not be updated." }, { status: 500 });
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "product.updated", entity_type: "product", entity_id: parsed.data.id, metadata: { slug: parsed.data.slug } });
  return NextResponse.json({ message: "Product updated." });
}
