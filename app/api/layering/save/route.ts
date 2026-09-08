import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const scentId = z.enum(["musk","vanilla","white-oud","oud-rose","junoon","red-musk","nazakat","zara-candy","deer-musk","afsoon"]);
const schema = z.object({ combinationName: z.string().trim().min(2).max(100), productIds: z.array(scentId).min(1).max(5), why: z.string().max(700), applicationOrder: z.array(z.object({ productId: scentId, guidance: z.string().max(240) })).max(5), balance: z.string().max(320), placement: z.string().max(320), expectedCharacter: z.string().max(180), strength: z.enum(["Soft","Balanced","Rich"]), occasion: z.string().max(160), timing: z.string().max(160), lighterAlternative: z.string().max(260), richerAlternative: z.string().max(260), source: z.enum(["ai","fallback"]) }).strict();

export async function POST(request: Request) {
  const raw = await createSupabaseServerClient(); if (!raw) return NextResponse.json({ message: "Sign in to save." }, { status: 401 });
  const { data: auth } = await raw.auth.getUser(); if (!auth.user) return NextResponse.json({ message: "Sign in to save." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ message: "Invalid recommendation." }, { status: 400 });
  const client = raw as unknown as SupabaseClient;
  const { error } = await client.from("saved_layering_recommendations").insert({ user_id: auth.user.id, name: parsed.data.combinationName, product_slugs: parsed.data.productIds, recommendation: parsed.data });
  if (error) return NextResponse.json({ message: "The recommendation could not be saved." }, { status: 500 });
  return NextResponse.json({ message: "Saved to My Rehmat." });
}
