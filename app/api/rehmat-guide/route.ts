import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getExperienceSettings } from "../../../lib/experience-settings";
import { createGuideReply, sanitizeGuideInput, type GuideReply } from "../../../lib/rehmat-guide";
import { getStorefrontProducts } from "../../../lib/storefront";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

const schema=z.object({message:z.string().trim().min(1).max(360)}).strict();
const localAttempts=new Map<string,{count:number;reset:number}>();

async function allowed(request:Request,limit:number){
  const fingerprint=createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]??"unknown").digest("hex");
  const raw=await createSupabaseServerClient();
  if(raw){const {data,error}=await (raw as unknown as SupabaseClient).rpc("register_experience_attempt",{p_fingerprint:fingerprint,p_feature:"guide",p_limit:limit,p_window_seconds:600});if(!error)return Boolean(data);}
  const now=Date.now(),current=localAttempts.get(fingerprint); if(current&&current.reset>now&&current.count>=Math.min(limit,8))return false;
  localAttempts.set(fingerprint,current&&current.reset>now?{...current,count:current.count+1}:{count:1,reset:now+600_000}); return true;
}

async function providerReply(message:string,fallback:GuideReply){
  const provider=process.env.FRAGRANCE_AI_PROVIDER,base=process.env.FRAGRANCE_AI_BASE_URL,model=process.env.FRAGRANCE_AI_MODEL,key=process.env.FRAGRANCE_AI_API_KEY;
  if(!provider||provider==="deterministic"||!base||!model||!key)return fallback;
  try{
    const response=await fetch(base,{method:"POST",signal:AbortSignal.timeout(8000),headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({model,input:message,groundedFallback:fallback})});
    if(!response.ok)return fallback; const value=await response.json();
    if(typeof value?.message!=="string"||!Array.isArray(value?.products))return fallback;
    const allowed=new Set(fallback.products.map(p=>p.slug));
    if(value.products.some((p:{slug?:string})=>!p.slug||!allowed.has(p.slug)))return fallback;
    return {...fallback,message:sanitizeGuideInput(value.message)};
  }catch{return fallback;}
}

export async function GET(){
  const settings=await getExperienceSettings();
  return NextResponse.json({enabled:settings.guideEnabled,greeting:settings.guideGreeting,prompts:settings.guidePrompts,whatsapp:{enabled:settings.whatsappEnabled,number:settings.whatsappNumber,notice:settings.whatsappNotice},source:settings.guideProvider==="deterministic"?"deterministic":"provider-with-deterministic-fallback"});
}

export async function POST(request:Request){
  const settings=await getExperienceSettings();
  if(!settings.guideEnabled)return NextResponse.json({message:"The Rehmat Guide is resting right now."},{status:503});
  if(!(await allowed(request,settings.guideRateLimit)))return NextResponse.json({message:"Too many requests. Please return in a few minutes."},{status:429});
  const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({message:"Please keep your fragrance question brief."},{status:400});
  const catalogue=await getStorefrontProducts();
  const fallback=createGuideReply(parsed.data.message,catalogue,{excluded:[...settings.productExclusions,...settings.guideExcludedProducts],allowed:settings.guideAllowedProducts,max:settings.guideMaxRecommendations});
  return NextResponse.json(await providerReply(parsed.data.message,fallback));
}
