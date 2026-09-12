import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getExperienceSettings } from "../../../lib/experience-settings";
import { createGuideReply,type GuideKnowledge } from "../../../lib/rehmat-guide";
import {providerReady,rewriteGuideReply} from "../../../lib/fragrance-ai";
import { getStorefrontProducts } from "../../../lib/storefront";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const schema=z.object({message:z.string().trim().min(1).max(360),productId:z.string().uuid().optional(),sessionId:z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/).optional(),excludedProductSlugs:z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(5).optional(),context:z.array(z.string().trim().min(1).max(360)).max(6).optional()}).strict();
const localAttempts=new Map<string,{count:number;reset:number}>();

async function allowed(request:Request,limit:number){
  const fingerprint=createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]??"unknown").digest("hex");
  const raw=await createSupabaseServerClient();
  if(raw){const {data,error}=await (raw as unknown as SupabaseClient).rpc("register_experience_attempt",{p_fingerprint:fingerprint,p_feature:"guide",p_limit:limit,p_window_seconds:600});if(!error)return Boolean(data);}
  const now=Date.now(),current=localAttempts.get(fingerprint); if(current&&current.reset>now&&current.count>=Math.min(limit,8))return false;
  localAttempts.set(fingerprint,current&&current.reset>now?{...current,count:current.count+1}:{count:1,reset:now+600_000}); return true;
}

export async function GET(){
  const settings=await getExperienceSettings();
  return NextResponse.json({enabled:settings.guideEnabled,greeting:settings.guideGreeting,prompts:settings.guidePrompts,whatsapp:{enabled:settings.whatsappEnabled,number:settings.whatsappNumber,notice:settings.whatsappNotice},source:!settings.guideEmergencyDisable&&providerReady()?"provider-with-deterministic-fallback":"deterministic"});
}

export async function POST(request:Request){
  const settings=await getExperienceSettings();
  if(!settings.guideEnabled)return NextResponse.json({message:"The Rehmat Guide is resting right now."},{status:503});
  if(!(await allowed(request,settings.guideRateLimit)))return NextResponse.json({message:"Too many requests. Please return in a few minutes."},{status:429});
  const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({message:"Please keep your fragrance question brief."},{status:400});
  const catalogue=await getStorefrontProducts();const raw=await createSupabaseServerClient();let knowledge:GuideKnowledge[]=[];if(raw&&settings.guideGeneralKnowledge){const {data}=await (raw as unknown as SupabaseClient).from("fragrance_knowledge").select("topic,aliases,explanation,source_title,source_url,source_license").eq("approval_status","approved").eq("active",true);knowledge=(data??[]).map(item=>({topic:String(item.topic),aliases:Array.isArray(item.aliases)?item.aliases:[],explanation:String(item.explanation),sourceTitle:String(item.source_title),sourceUrl:String(item.source_url),sourceLicense:String(item.source_license)}));}
  const contextProduct=parsed.data.productId?catalogue.find(product=>product.databaseId===parsed.data.productId):null;
  const fallback=createGuideReply(parsed.data.message,catalogue,{excluded:[...settings.productExclusions,...settings.guideExcludedProducts,...(parsed.data.excludedProductSlugs??[])],allowed:contextProduct?[contextProduct.slug]:settings.guideAllowedProducts,max:settings.guideMaxRecommendations,knowledge});
  const mayRewrite=["general_education","fragrance_family","product_discovery","product_comparison","occasion_mood"].includes(fallback.intent);
  return NextResponse.json(mayRewrite&&!settings.guideEmergencyDisable?await rewriteGuideReply(parsed.data.message,fallback,parsed.data.sessionId??"anonymous",parsed.data.context??[],knowledge):fallback);
}
