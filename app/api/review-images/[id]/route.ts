import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const server = await createSupabaseServerClient(); const supabase = server as unknown as SupabaseClient | null;
  if (!supabase) return new NextResponse(null, { status: 404 });
  const { data: review } = await supabase.from("public_product_reviews").select("image_path").eq("id", id).maybeSingle();
  if (!review?.image_path) return new NextResponse(null, { status: 404 });
  const { data, error } = await supabase.storage.from("review-images").download(review.image_path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  return new NextResponse(await data.arrayBuffer(), { headers: { "content-type": data.type || "image/jpeg", "cache-control": "public, max-age=3600" } });
}
