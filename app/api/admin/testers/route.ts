import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/supabase/auth";
import { calculateTesterCosts } from "../../../../lib/tester-packs";

const nullableMoney = z.number().finite().min(0).max(1000000).nullable();
const assetPath = z.string().trim().max(500).refine((value) => !/^https?:\/\//i.test(value), "Use a stored image path, not an external URL.");
const schema = z.object({
  variantId: z.uuid(),
  totalOilPurchaseCostRupees: nullableMoney,
  totalPurchasedMl: z.number().finite().positive().max(1000000).nullable(),
  bottleCostRupees: nullableMoney,
  individualBoxCostRupees: nullableMoney,
  labelCostRupees: nullableMoney,
  fillingSealingCostRupees: nullableMoney,
  labourCostRupees: nullableMoney,
  packInsertCostRupees: nullableMoney,
  minimumMarginPercent: z.number().finite().min(0).max(100).nullable(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  openingNotes: z.array(z.string().trim().min(1).max(80)).max(20),
  heartNotes: z.array(z.string().trim().min(1).max(80)).max(20),
  baseNotes: z.array(z.string().trim().min(1).max(80)).max(20),
  description: z.string().trim().max(4000),
  audience: z.string().trim().max(180),
  imagePath: assetPath,
  contentApproved: z.boolean(),
  imageApproved: z.boolean(),
  marginApproved: z.boolean(),
  packagingApproved: z.boolean(),
  activate: z.boolean(),
  adminNotes: z.string().max(3000),
}).strict();

const paise = (value: number | null) => value === null ? null : Math.round(value * 100);

export async function POST(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const db = supabase as unknown as SupabaseClient;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the tester fields." }, { status: 400 });
  const value = parsed.data;
  const { data: variant } = await db.from("product_variants")
    .select("id,product_id,price_paise,bottle_id,tester_pack_eligible,inventory(reserved),bottles(status),products(status,image_path)")
    .eq("id", value.variantId).maybeSingle();
  if (!variant || !variant.tester_pack_eligible || variant.price_paise === null) return NextResponse.json({ message: "Tester variant not found." }, { status: 404 });

  const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
  const bottle = Array.isArray(variant.bottles) ? variant.bottles[0] : variant.bottles;
  const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
  if (value.quantity < (inventory?.reserved ?? 0)) return NextResponse.json({ message: `Quantity cannot be lower than ${inventory?.reserved ?? 0} reserved units.` }, { status: 409 });

  const contentReady = value.description.length > 0 && value.audience.length > 0 && value.openingNotes.length > 0 && value.heartNotes.length > 0 && value.baseNotes.length > 0;
  const imageReady = value.imagePath.length > 0 && !value.imagePath.includes("product-image-pending");
  if (value.contentApproved && !contentReady) return NextResponse.json({ message: "Content approval requires description, audience and all three note stages." }, { status: 409 });
  if (value.imageApproved && !imageReady) return NextResponse.json({ message: "Image approval requires an owner-approved image path, not the draft placeholder." }, { status: 409 });

  const costInput = {
    totalOilPurchaseCostPaise: paise(value.totalOilPurchaseCostRupees),
    totalPurchasedMl: value.totalPurchasedMl,
    bottleCostPaise: paise(value.bottleCostRupees),
    individualBoxCostPaise: paise(value.individualBoxCostRupees),
    labelCostPaise: paise(value.labelCostRupees),
    fillingSealingCostPaise: paise(value.fillingSealingCostRupees),
    labourCostPaise: paise(value.labourCostRupees),
    packInsertCostPaise: paise(value.packInsertCostRupees),
    sellingPricePaise: variant.price_paise,
    marginApproved: value.marginApproved,
  };
  const costSummary = calculateTesterCosts(costInput);
  const marginReady = costSummary.missing.length === 0 && value.minimumMarginPercent !== null && costSummary.grossMarginPercent !== null && costSummary.grossMarginPercent >= value.minimumMarginPercent;
  if (value.marginApproved && !marginReady) return NextResponse.json({ message: "Margin approval requires every COGS field and a calculated margin at or above the minimum target." }, { status: 409 });
  if (value.activate && (!value.contentApproved || !value.imageApproved || !value.marginApproved || !value.packagingApproved || value.quantity < 1 || bottle?.status !== "active")) {
    return NextResponse.json({ message: "Activation requires approved content, imagery, complete COGS and margin, counted stock, approved packaging and an active 3 ml bottle record." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const costPayload = {
    variant_id: value.variantId,
    total_oil_purchase_cost_paise: costInput.totalOilPurchaseCostPaise,
    total_purchased_ml: value.totalPurchasedMl,
    bottle_cost_paise: costInput.bottleCostPaise,
    individual_box_cost_paise: costInput.individualBoxCostPaise,
    label_cost_paise: costInput.labelCostPaise,
    filling_sealing_cost_paise: costInput.fillingSealingCostPaise,
    labour_cost_paise: costInput.labourCostPaise,
    pack_insert_cost_paise: costInput.packInsertCostPaise,
    selling_price_paise: variant.price_paise,
    minimum_margin_percent: value.minimumMarginPercent,
    margin_approved: value.marginApproved,
    packaging_approved: value.packagingApproved,
    margin_reviewed_by: value.marginApproved ? user.id : null,
    margin_reviewed_at: value.marginApproved ? now : null,
    admin_notes: value.adminNotes,
    updated_at: now,
  };
  const intakePayload = {
    product_id: variant.product_id,
    opening_notes: value.openingNotes,
    heart_notes: value.heartNotes,
    base_notes: value.baseNotes,
    description: value.description || null,
    audience: value.audience || null,
    image_path: value.imagePath || null,
    content_approved: value.contentApproved,
    image_approved: value.imageApproved,
    approved_by: value.contentApproved && value.imageApproved ? user.id : null,
    approved_at: value.contentApproved && value.imageApproved ? now : null,
    updated_at: now,
  };
  const productPayload = {
    description: value.description,
    notes: { top: value.openingNotes, heart: value.heartNotes, base: value.baseNotes },
    notes_verified: value.contentApproved,
    suitability_note: value.audience || null,
    image_path: value.imagePath || product?.image_path,
    image_alt_text: value.imageApproved ? "Owner-approved Rehmat Panjab fragrance presentation" : "Product image pending owner approval",
    status: value.activate ? "active" : product?.status,
    updated_at: now,
  };
  const results = await Promise.all([
    db.from("tester_variant_costs").upsert(costPayload),
    db.from("tester_product_intake").upsert(intakePayload),
    db.from("inventory").upsert({ variant_id: value.variantId, quantity: value.quantity, reserved: inventory?.reserved ?? 0, low_stock_threshold: value.lowStockThreshold, updated_at: now }),
    db.from("product_variants").update({ status: value.activate ? "active" : "draft", enabled: value.activate, updated_at: now }).eq("id", value.variantId),
    db.from("products").update(productPayload).eq("id", variant.product_id),
  ]);
  if (results.some(({ error }) => error)) return NextResponse.json({ message: "Tester review could not be saved." }, { status: 500 });
  await db.from("audit_logs").insert({ actor_id: user.id, action: "tester.readiness_reviewed", entity_type: "product_variant", entity_id: value.variantId, metadata: { activated: value.activate, content_approved: value.contentApproved, image_approved: value.imageApproved, margin_approved: value.marginApproved, packaging_approved: value.packagingApproved } });
  return NextResponse.json({ message: value.activate ? "Tester activated after all launch gates passed." : "Tester saved as draft." });
}
