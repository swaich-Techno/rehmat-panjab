import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const productSchema = z.object({
  id: z.uuid().optional(), productNumber: z.string().trim().min(1).max(3), name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "coming_soon", "active", "sold_out", "archived"]), subtitle: z.string().trim().max(180).optional().default(""), description: z.string().trim().max(4000).optional().default(""),
});

export async function POST(request: Request) {
  const { supabase, user, role } = await requireAdmin();
  if (role !== "super_admin") return NextResponse.json({ message: "Super-admin access required." }, { status: 403 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Check the product fields and try again." }, { status: 400 });
  const payload = { product_number: parsed.data.productNumber, name: parsed.data.name, slug: parsed.data.slug, status: parsed.data.status, subtitle: parsed.data.subtitle, description: parsed.data.description };
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
  const { error } = await supabase.from("products").update({ product_number: parsed.data.productNumber, name: parsed.data.name, slug: parsed.data.slug, status: parsed.data.status, subtitle: parsed.data.subtitle, description: parsed.data.description, updated_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ message: "This product could not be updated." }, { status: 500 });
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "product.updated", entity_type: "product", entity_id: parsed.data.id, metadata: { slug: parsed.data.slug } });
  return NextResponse.json({ message: "Product updated." });
}
