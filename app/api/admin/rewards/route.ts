import type {SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../lib/supabase/admin";

const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("settings"),hamperSku:z.string().max(80).nullable(),description:z.string().max(1000).nullable(),imagePath:z.string().max(300).nullable(),inventory:z.number().int().nonnegative().nullable(),validityDays:z.number().int().positive().nullable(),shippingRule:z.string().max(500).nullable(),redemptionEnabled:z.boolean()}),
  z.object({action:z.literal("entitlement"),id:z.string().uuid(),status:z.enum(["claimed","fulfilled","expired","reversed"])}),
  z.object({action:z.literal("review"),id:z.string().uuid(),status:z.enum(["approved","rejected"])})
]);

export async function PATCH(request:Request){
  const {supabase,user,role}=await requireAdmin();
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Check the reward update."},{status:400});
  const db=supabase as unknown as SupabaseClient,admin=createSupabaseAdminClient(),v=parsed.data;let error;
  if(v.action==="settings"){
    if(v.redemptionEnabled&&(!v.hamperSku||!v.description||!v.imagePath||!v.inventory||!v.validityDays||!v.shippingRule))return NextResponse.json({message:"Configure hamper, stock, validity and shipping before enabling redemption."},{status:409});
    ({error}=await db.from("reward_settings").update({hamper_sku:v.hamperSku,hamper_description:v.description,hamper_image_path:v.imagePath,hamper_inventory:v.inventory,validity_days:v.validityDays,shipping_rule:v.shippingRule,redemption_enabled:v.redemptionEnabled,updated_by:user.id,updated_at:new Date().toISOString()}).eq("id",true));
  }else if(v.action==="entitlement"){
    if(v.status==="claimed"){const {data:settings}=await db.from("reward_settings").select("redemption_enabled").eq("id",true).single();if(!settings?.redemption_enabled)return NextResponse.json({message:"Configure and enable hamper redemption first."},{status:409});}
    ({error}=await db.from("reward_entitlements").update({status:v.status,[v.status==="fulfilled"?"fulfilled_at":v.status==="claimed"?"claimed_at":"reversed_at"]:new Date().toISOString(),fulfilled_by:v.status==="fulfilled"?user.id:null}).eq("id",v.id));
  }else{
    if(v.status==="approved"){const {data:review}=await db.from("reward_adjustment_reviews").select("order_id").eq("id",v.id).single();if(review&&!admin)return NextResponse.json({message:"Server reward controls are unavailable."},{status:503});if(review)await admin!.rpc("reverse_reward_stamp_for_order",{p_order_id:review.order_id,p_reason:"Admin-approved partial refund adjustment",p_actor_id:user.id});}
    ({error}=await db.from("reward_adjustment_reviews").update({status:v.status,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",v.id));
  }
  if(error)return NextResponse.json({message:"Reward update could not be saved."},{status:500});
  await db.from("audit_logs").insert({actor_id:user.id,action:`rewards.${v.action}_updated`,entity_type:v.action,entity_id:"id" in v?v.id:"singleton",metadata:v});
  return NextResponse.json({message:"Reward update saved."});
}
