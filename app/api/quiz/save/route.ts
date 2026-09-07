import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const scentId = z.enum(["musk","vanilla","saffron","white-oud","oud-rose"]);
const schema = z.object({ answers:z.record(z.string(),z.array(z.string().max(40)).max(4)).refine((value)=>Object.keys(value).length<=12), portrait:z.string().trim().min(2).max(60).regex(/^[A-Za-z][A-Za-z -]+$/), primaryId:scentId, secondaryId:scentId, feelings:z.array(z.string().max(40)).max(4) }).strict();
const slug=(id:z.infer<typeof scentId>)=>id==="musk"?"musk-rizali":id==="vanilla"?"vanilla-musk":id==="saffron"?"saffron-amber-oud":id;

export async function POST(request: Request) {
  const raw=await createSupabaseServerClient(); if(!raw) return NextResponse.json({message:"Sign in to save this portrait."},{status:401});
  const {data:auth}=await raw.auth.getUser(); if(!auth.user) return NextResponse.json({message:"Sign in to save this portrait."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({message:"This portrait could not be validated."},{status:400});
  const client=raw as unknown as SupabaseClient; const fingerprint=createHash("sha256").update(auth.user.id).digest("hex");
  const {data:allowed}=await client.rpc("register_experience_attempt",{p_fingerprint:fingerprint,p_feature:"quiz-save",p_limit:10,p_window_seconds:600});
  if(allowed===false) return NextResponse.json({message:"Please wait before saving again."},{status:429});
  const slugs=[slug(parsed.data.primaryId),slug(parsed.data.secondaryId)]; const {data:catalogue}=await client.from("products").select("id,slug").in("slug",slugs);
  const primary=catalogue?.find((item)=>item.slug===slugs[0]); const secondary=catalogue?.find((item)=>item.slug===slugs[1]); if(!primary||!secondary) return NextResponse.json({message:"The matched fragrances are unavailable."},{status:409});
  const {data:session,error:sessionError}=await client.from("quiz_sessions").insert({user_id:auth.user.id,consented_to_save:true,answers:parsed.data.answers,completed_at:new Date().toISOString()}).select("id").single();
  if(sessionError||!session) return NextResponse.json({message:"This portrait could not be saved."},{status:500});
  const {error}=await client.from("quiz_results").insert({session_id:session.id,user_id:auth.user.id,primary_product_id:primary.id,secondary_product_id:secondary.id,profile:{name:parsed.data.portrait,feelings:parsed.data.feelings}});
  if(error) return NextResponse.json({message:"This portrait could not be saved."},{status:500}); return NextResponse.json({message:"Saved privately to My Rehmat."});
}
