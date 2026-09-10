import type {SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../lib/supabase/auth";

const schema=z.object({pins:z.array(z.string().regex(/^\d{6}$/)).max(250),autoEnabled:z.boolean(),completeListConfirmed:z.boolean()}).strict();

export async function POST(request:Request){
  const {supabase,user,role}=await requireAdmin();
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({message:"Use only valid six-digit PIN codes."},{status:400});
  const pins=[...new Set(parsed.data.pins)];
  if(parsed.data.autoEnabled&&(!parsed.data.completeListConfirmed||!pins.length))return NextResponse.json({message:"Automatic eligibility requires a non-empty, verified complete PIN-code list."},{status:409});
  const db=supabase as unknown as SupabaseClient;
  const now=new Date().toISOString();
  const {error:settingsError}=await db.from("local_delivery_settings").update({auto_eligibility_enabled:parsed.data.autoEnabled,manual_confirmation_enabled:true,verified_at:parsed.data.autoEnabled?now:null,verified_by:parsed.data.autoEnabled?user.id:null,updated_at:now}).eq("id",true);
  if(settingsError)return NextResponse.json({message:"Delivery settings could not be saved."},{status:500});
  await db.from("local_delivery_pincodes").update({active:false,updated_at:now}).neq("pin_code","");
  if(pins.length){const {error}=await db.from("local_delivery_pincodes").upsert(pins.map(pin_code=>({pin_code,active:true,updated_at:now,updated_by:user.id})),{onConflict:"pin_code"});if(error)return NextResponse.json({message:"PIN codes could not be saved."},{status:500});}
  await db.from("audit_logs").insert({actor_id:user.id,action:"local_delivery.updated",entity_type:"local_delivery_settings",entity_id:"singleton",metadata:{autoEnabled:parsed.data.autoEnabled,pinCount:pins.length}});
  return NextResponse.json({message:parsed.data.autoEnabled?"Verified local delivery zone activated.":"PIN codes saved; automatic eligibility remains disabled."});
}
