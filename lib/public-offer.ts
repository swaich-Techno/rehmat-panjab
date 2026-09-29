import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "./supabase/admin";

export type PublicOffer = { code:string; description:string; expiresAt:string|null; minimumSubtotalPaise:number; firstOrderOnly:boolean; freeShipping:boolean };

export async function getCurrentPublicOffer(now = new Date()):Promise<PublicOffer|null>{
  const raw=createSupabaseAdminClient();
  if(!raw)return null;
  const {data,error}=await (raw as unknown as SupabaseClient).from("coupons").select("id,code,public_description,minimum_subtotal_paise,starts_at,expires_at,first_order_only,free_shipping,total_usage_limit").eq("active",true).is("revoked_at",null).is("archived_at",null).limit(20);
  if(error)return null;
  const stamp=now.getTime();
  const candidates=(data??[]).filter(item=>(!item.starts_at||new Date(item.starts_at).getTime()<=stamp)&&(!item.expires_at||new Date(item.expires_at).getTime()>stamp)).sort((a,b)=>String(a.expires_at??"9999").localeCompare(String(b.expires_at??"9999")));
  let valid:typeof candidates[number]|undefined;
  for(const candidate of candidates){
    if(candidate.total_usage_limit===null){valid=candidate;break;}
    const {count}=await (raw as unknown as SupabaseClient).from("coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",candidate.id).eq("confirmation_status","confirmed");
    if((count??0)<Number(candidate.total_usage_limit)){valid=candidate;break;}
  }
  if(!valid)return null;
  return {code:String(valid.code),description:String(valid.public_description||"Validated at checkout"),expiresAt:valid.expires_at?String(valid.expires_at):null,minimumSubtotalPaise:Number(valid.minimum_subtotal_paise??0),firstOrderOnly:Boolean(valid.first_order_only),freeShipping:Boolean(valid.free_shipping)};
}
