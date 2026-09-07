import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const schema = z.union([
  z.object({ submissionsEnabled: z.boolean() }).strict(),
  z.object({ id: z.uuid(), status: z.enum(["pending","approved","rejected","archived"]).optional(), adminResponse: z.string().trim().max(1200).optional(), verifiedPurchase: z.boolean().optional() }).strict(),
]);
const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export async function PATCH(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Check the moderation action." }, { status: 400 });
  const client = supabase as unknown as SupabaseClient;
  if ("submissionsEnabled" in parsed.data) {
    await client.from("review_settings").update({ submissions_enabled: parsed.data.submissionsEnabled, updated_at: new Date().toISOString() }).eq("id", true);
    return NextResponse.json({ message: "Review submission setting updated." });
  }
  const action = parsed.data; const { data: review } = await client.from("product_reviews").select("id,product_id,user_id,original_content").eq("id", action.id).maybeSingle();
  if (!review) return NextResponse.json({ message: "Review not found." }, { status: 404 });
  if (action.verifiedPurchase) {
    if (!review.user_id) return NextResponse.json({ message: "This guest review cannot be verified without a safely matched customer account." }, { status: 409 });
    const { data: orders } = await client.from("orders").select("id").eq("user_id", review.user_id).eq("status", "paid");
    const { data: variants } = await client.from("product_variants").select("id").eq("product_id", review.product_id);
    const { count } = await client.from("order_items").select("id", { count: "exact", head: true }).in("order_id", (orders ?? []).map((row) => row.id)).in("variant_id", (variants ?? []).map((row) => row.id));
    if (!count) return NextResponse.json({ message: "No matching paid order was found." }, { status: 409 });
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString(), moderated_by: user.id, moderated_at: new Date().toISOString() };
  if (action.status) update.status = action.status;
  if (action.adminResponse !== undefined) update.admin_response = clean(action.adminResponse) || null;
  if (action.verifiedPurchase !== undefined) update.verified_purchase = action.verifiedPurchase;
  const { error } = await client.from("product_reviews").update(update).eq("id", action.id);
  if (error) return NextResponse.json({ message: "The review could not be updated." }, { status: 500 });
  await client.from("audit_logs").insert({ actor_id: user.id, action: "review.moderated", entity_type: "product_review", entity_id: action.id, metadata: update });
  return NextResponse.json({ message: "Review moderation saved." });
}
