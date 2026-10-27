import type {SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../lib/supabase/admin";
import {SAMPLE_CAMPAIGN_ID,SAMPLE_PRICE_PAISE} from "../../../../lib/promotions.mjs";

const schema=z.object({
  reference:z.string().trim().min(3).max(80),
  customerIdentifier:z.string().trim().max(120).optional(),
  userId:z.string().uuid().optional(),
  couponCode:z.string().trim().max(40).optional(),
  subtotalPaise:z.number().int().min(0),
  discountPaise:z.number().int().min(0),
  paymentConfirmed:z.boolean(),
  delivered:z.boolean(),
  sampleCampaignId:z.literal(SAMPLE_CAMPAIGN_ID).optional(),
  sampleVariantId:z.string().uuid().optional(),
}).strict().superRefine((value,context)=>{
  if(Boolean(value.sampleCampaignId)!==Boolean(value.sampleVariantId))context.addIssue({code:"custom",message:"Choose both a sample campaign and an eligible 3 ml tester."});
  if(value.sampleCampaignId&&(!value.customerIdentifier||!value.paymentConfirmed))context.addIssue({code:"custom",message:"A paid sample claim requires verified customer details."});
  if(value.sampleCampaignId&&value.couponCode)context.addIssue({code:"custom",message:"The ₹99 sample cannot be combined with a coupon."});
});

export async function POST(request:Request){
  const {supabase,user,role}=await requireAdmin();const db=supabase as unknown as SupabaseClient;
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||parsed.data.discountPaise>parsed.data.subtotalPaise||parsed.data.delivered&&!parsed.data.paymentConfirmed)return NextResponse.json({message:"Check the confirmation totals and payment state."},{status:400});
  const v=parsed.data;const isSample=Boolean(v.sampleCampaignId);let couponId:null|string=null;
  if(v.couponCode){const {data:coupon}=await db.from("coupons").select("id").ilike("code",v.couponCode.trim().toUpperCase()).maybeSingle();if(!coupon)return NextResponse.json({message:"Coupon not found."},{status:400});couponId=coupon.id;}
  const subtotalPaise=isSample?SAMPLE_PRICE_PAISE:v.subtotalPaise;
  const discountPaise=isSample?0:v.discountPaise;
  const now=new Date().toISOString();
  const {data:order,error}=await db.from("whatsapp_order_confirmations").insert({reference:v.reference,coupon_id:couponId,customer_identifier:v.customerIdentifier||null,user_id:v.userId||null,subtotal_paise:subtotalPaise,discount_paise:discountPaise,total_paise:subtotalPaise-discountPaise,status:"confirmed",payment_confirmed_at:v.paymentConfirmed?now:null,delivered_at:v.delivered?now:null,confirmed_by:user.id}).select("id").single();
  if(error||!order)return NextResponse.json({message:error?.code==="23505"?"This reference was already confirmed.":"Confirmation could not be saved."},{status:409});
  let sampleRemaining:number|null=null;
  if(isSample){
    const admin=createSupabaseAdminClient();
    if(!admin){await db.from("whatsapp_order_confirmations").delete().eq("id",order.id);return NextResponse.json({message:"Sample confirmation is not configured."},{status:503});}
    const {data,error:claimError}=await admin.rpc("confirm_sample_campaign_claim",{p_campaign_id:v.sampleCampaignId,p_whatsapp_confirmation_id:order.id,p_customer_identifier:v.customerIdentifier!,p_variant_id:v.sampleVariantId!,p_actor_id:user.id});
    if(claimError){
      await admin.from("whatsapp_order_confirmations").delete().eq("id",order.id);
      const detail=claimError.message.toLowerCase();
      const message=detail.includes("duplicate")?"This customer already has a confirmed ₹99 sample claim.":detail.includes("exhausted")?"All 99 sample claims have been confirmed.":detail.includes("outside_window")?"The ₹99 sample campaign is not currently live.":detail.includes("out_of_stock")?"That 3 ml tester is out of stock.":"The sample claim could not be confirmed.";
      return NextResponse.json({message},{status:409});
    }
    sampleRemaining=Number(data);
  }
  if(v.userId&&v.paymentConfirmed&&v.delivered)await createSupabaseAdminClient()?.rpc("award_reward_stamp_for_whatsapp",{p_confirmation_id:order.id,p_actor_id:user.id});
  if(couponId)await db.from("coupon_redemptions").insert({coupon_id:couponId,manual_order_reference:v.reference,customer_identifier:v.customerIdentifier||null,eligible_subtotal_paise:v.subtotalPaise,discount_paise:v.discountPaise,confirmation_status:"confirmed",payment_status:v.paymentConfirmed?"paid":"unpaid",idempotency_reference:`whatsapp:${v.reference}`});
  await db.from("audit_logs").insert({actor_id:user.id,action:"whatsapp_order.confirmed",entity_type:"whatsapp_order",entity_id:order.id,metadata:{reference:v.reference,payment_confirmed:v.paymentConfirmed,delivered:v.delivered,reward_eligible:Boolean(v.userId&&v.paymentConfirmed&&v.delivered),sample_claim:isSample,sample_remaining:sampleRemaining}});
  return NextResponse.json({message:isSample?`₹99 sample confirmed. ${sampleRemaining} of 99 claims remain.`:"WhatsApp order confirmed.",sampleRemaining});
}
