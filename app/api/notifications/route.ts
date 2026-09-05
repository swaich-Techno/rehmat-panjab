import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const schema = z.object({ email: z.email(), consent: z.literal(true), category: z.enum(["product_launch", "restock", "next_drop", "reward", "order_update"]), productSlug: z.string().regex(/^[a-z0-9-]+$/).optional() });
const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Check your email and consent, then try again." }, { status: 400 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const key = `${forwarded}:${parsed.data.email.toLowerCase()}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.reset > now && current.count >= 4) return NextResponse.json({ message: "Too many tries. Return in a little while." }, { status: 429 });
  attempts.set(key, !current || current.reset <= now ? { count: 1, reset: now + 15 * 60_000 } : { ...current, count: current.count + 1 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: "The private list is opening soon." }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  const { error } = await supabase.from("notification_subscriptions").insert({
    email: parsed.data.email.toLowerCase(),
    user_id: authData.user?.id ?? null,
    channel: "email",
    category: parsed.data.category,
    product_slug: parsed.data.productSlug ?? "",
    consented_at: new Date().toISOString(),
    unsubscribed_at: null,
  });
  if (error && error.code !== "23505") return NextResponse.json({ message: "We couldn’t save that yet. Try once more." }, { status: 500 });
  return NextResponse.json({ message: "You’re on the private list." });
}
