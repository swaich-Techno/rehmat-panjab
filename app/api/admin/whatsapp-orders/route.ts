import type {SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../lib/supabase/admin";

const schema=z.object({reference:z.string().trim().min(3).max(80),customerIdentifier:z.string().trim().max(120).optional(),userId:z.string().uuid().optional(),couponCode:z.string().trim().max(40).optional(),subtotalPaise:z.number().int().min(0),discountPaise:z.number().int().min(0),paymentConfirmed:z.boolean(),delivered:z.boolean()}).strict();

export async function POST(request:Request){
  const {supabase,user,role}=await requireAdmin();const db=supabase as unknown as SupabaseClient;
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||parsed.data.discountPaise>parsed.data.subtotalPaise||parsed.data.delivered&&!parsed.data.paymentConfirmed)return NextResponse.json({message:"Check the confirmation totals and payment state."},{status:400});
  const v=parsed.data;let couponId:null|string=null;
  if(v.couponCode){const {data:coupon}=await db.from("coupons").select("id").ilike("code",v.couponCode.trim().toUpperCase()).maybeSingle();if(!coupon)return NextResponse.json({message:"Coupon not found."},{status:400});couponId=coupon.id;}
  const now=new Date().toISOString();
  const {data:order,error}=await db.from("whatsapp_order_confirmations").insert({reference:v.reference,coupon_id:couponId,customer_identifier:v.customerIdentifier||null,user_id:v.userId||null,subtotal_paise:v.subtotalPaise,discount_paise:v.discountPaise,total_paise:v.subtotalPaise-v.discountPaise,status:"confirmed",payment_confirmed_at:v.paymentConfirmed?now:null,delivered_at:v.delivered?now:null,confirmed_by:user.id}).select("id").single();
  if(error||!order)return NextResponse.json({message:error?.code==="23505"?"This reference was already confirmed.":"Confirmation could not be saved."},{status:409});
  if(v.userId&&v.paymentConfirmed&&v.delivered)await createSupabaseAdminClient()?.rpc("award_reward_stamp_for_whatsapp",{p_confirmation_id:order.id,p_actor_id:user.id});
  if(couponId)await db.from("coupon_redemptions").insert({coupon_id:couponId,manual_order_reference:v.reference,customer_identifier:v.customerIdentifier||null,eligible_subtotal_paise:v.subtotalPaise,discount_paise:v.discountPaise,confirmation_status:"confirmed",payment_status:v.paymentConfirmed?"paid":"unpaid",idempotency_reference:`whatsapp:${v.reference}`});
  await db.from("audit_logs").insert({actor_id:user.id,action:"whatsapp_order.confirmed",entity_type:"whatsapp_order",entity_id:order.id,metadata:{reference:v.reference,payment_confirmed:v.paymentConfirmed,delivered:v.delivered,reward_eligible:Boolean(v.userId&&v.paymentConfirmed&&v.delivered)}});
  return NextResponse.json({message:"WhatsApp order confirmed."});
}
