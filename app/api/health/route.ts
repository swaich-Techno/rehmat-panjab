import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ status: "degraded", database: "not_configured" }, { status: 503 });
  const { error } = await supabase.from("products").select("id").limit(1);
  return NextResponse.json(error ? { status: "degraded", database: "unavailable" } : { status: "ok", database: "connected" }, { status: error ? 503 : 200 });
}
