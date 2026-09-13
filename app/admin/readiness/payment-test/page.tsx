import type {SupabaseClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../../../lib/supabase/auth";
import {ControlledPaymentTest} from "./controlled-payment-test";

export const dynamic="force-dynamic";
export default async function Page(){
  const {supabase,role}=await requireAdmin();if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const db=supabase as unknown as SupabaseClient;
  const [{data:products},{data:policy}]=await Promise.all([
    db.from("products").select("id,name,slug,product_variants(id,size_ml,price_paise,enabled,inventory(quantity,reserved))").in("slug",["musk-rizali","vanilla-musk"]).eq("status","active"),
    db.from("store_policy_settings").select("policy_version").eq("id",true).maybeSingle(),
  ]);
  const item=(slug:string,quantity:number)=>{const product=(products??[]).find(value=>value.slug===slug);const variants=product?.product_variants as Array<{id:string;size_ml:number;price_paise:number|null;enabled:boolean;inventory:{quantity:number;reserved:number}|Array<{quantity:number;reserved:number}>|null}>|undefined;const variant=variants?.find(value=>Number(value.size_ml)===6&&value.enabled);const stock=Array.isArray(variant?.inventory)?variant?.inventory[0]:variant?.inventory;return product&&variant&&variant.price_paise!==null?{productName:product.name,variantId:variant.id,sizeMl:6,unitPricePaise:variant.price_paise,quantity,availableQuantity:Math.max(0,(stock?.quantity??0)-(stock?.reserved??0))}:null;};
  const basket=[item("musk-rizali",2),item("vanilla-musk",1)].filter(Boolean) as Array<{productName:string;variantId:string;sizeMl:number;unitPricePaise:number;quantity:number;availableQuantity:number}>;
  return <main id="main-content" className="admin-page"><p className="eyebrow">Super-admin only</p><h1>Controlled live payment.</h1><p>Public commerce remains disabled. This tool is exclusively for the owner-approved end-to-end readiness payment.</p>{basket.length===2?<ControlledPaymentTest items={basket} policyVersion={String(policy?.policy_version??"controlled-live-test-2026-09")}/>:<p>The approved test basket is unavailable. Do not continue.</p>}</main>;
}
