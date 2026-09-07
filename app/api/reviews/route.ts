import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const reviewSchema = z.object({ productId: z.uuid(), displayName: z.string().trim().min(2).max(80), email: z.email().max(254), rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().min(2).max(120), body: z.string().trim().min(20).max(2000), consent: z.literal("yes"), website: z.string().max(0), startedAt: z.coerce.number().int().positive() });
const allowedImages = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ message: "Review details are incomplete." }, { status: 400 });
  const parsed = reviewSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success || Date.now() - (parsed.success ? parsed.data.startedAt : Date.now()) < 3000) return NextResponse.json({ message: "Please check the review fields and try again." }, { status: 400 });
  const server = await createSupabaseServerClient(); const supabase = server as unknown as SupabaseClient | null;
  if (!supabase) return NextResponse.json({ message: "Reviews are not configured yet." }, { status: 503 });
  const value = parsed.data;
  const fingerprint = createHash("sha256").update(`${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"}|${value.email.toLowerCase()}`).digest("hex");
  const image = form.get("image"); let imagePath: string | null = null;
  if (image instanceof File && image.size > 0) {
    const extension = allowedImages.get(image.type);
    if (!extension || image.size > 4 * 1024 * 1024) return NextResponse.json({ message: "Use a JPEG, PNG or WebP image no larger than 4 MB." }, { status: 400 });
    imagePath = `${value.productId}/${randomUUID()}.${extension}`;
  }
  const content = { display_name: clean(value.displayName), title: clean(value.title), body: clean(value.body) };
  const { error } = await supabase.rpc("submit_product_review", { p_product_id: value.productId, p_display_name: content.display_name, p_email: value.email.toLowerCase(), p_rating: value.rating, p_title: content.title, p_body: content.body, p_image_path: imagePath, p_fingerprint: fingerprint });
  if (error) return NextResponse.json({ message: error.message.includes("rate_limited") ? "Too many review attempts. Please try again later." : error.message.includes("reviews_closed") ? "Reviews are not open for this fragrance." : "The review could not be submitted." }, { status: error.message.includes("rate_limited") ? 429 : 409 });
  if (image instanceof File && image.size > 0 && imagePath) {
    const { error: uploadError } = await supabase.storage.from("review-images").upload(imagePath, image, { contentType: image.type, upsert: false });
    if (uploadError) return NextResponse.json({ message: "The review was received, but its image could not be uploaded." }, { status: 202 });
  }
  return NextResponse.json({ message: "Review submitted for moderation." }, { status: 201 });
}
