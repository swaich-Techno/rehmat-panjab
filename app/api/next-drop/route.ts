import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const schema = z.object({ answers: z.array(z.string().min(1).max(80)).length(3) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose all three directions first." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: "The drop room is not accepting votes yet." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sign in to save your vote." }, { status: 401 });
  const { error } = await supabase.from("next_drop_votes").upsert({ campaign_id: "next-rehmat-2026", user_id: authData.user.id, answers: parsed.data.answers, updated_at: new Date().toISOString() }, { onConflict: "campaign_id,user_id" });
  if (error) return NextResponse.json({ message: "We couldn’t save that yet." }, { status: 500 });
  return NextResponse.json({ message: "Your vote is in the room." });
}
