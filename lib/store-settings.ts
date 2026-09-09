import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";
import {defaultStoreSettings,settingsFields,type SettingsGroup,type StoreSettings} from "./store-settings-schema";
export {missingStoreFields,policiesComplete,supportedTrustItems} from "./store-settings-schema";

function normalize(data: Record<string,unknown> | null): StoreSettings {
  const result=structuredClone(defaultStoreSettings);
  for(const group of Object.keys(settingsFields) as SettingsGroup[]){
    const value=data?.[group];
    if(value&&typeof value==="object"&&!Array.isArray(value)) result[group]={...result[group],...Object.fromEntries(Object.entries(value).map(([key,item])=>[key,typeof item==="string"?item.trim():""]))};
  }
  return result;
}

export async function getStoreSettings(source="public_store_policy_settings"):Promise<StoreSettings>{
  try{const raw=await createSupabaseServerClient();if(!raw)return defaultStoreSettings;const {data}=await (raw as unknown as SupabaseClient).from(source).select("merchant,shipping,cancellation,returns,privacy,terms").eq("id",true).maybeSingle();return normalize(data as Record<string,unknown>|null);}catch{return defaultStoreSettings;}
}

export type PublishedPolicyRecord={settings:StoreSettings;version:string;effectiveDate:string};
export async function getPublishedPolicyRecord():Promise<PublishedPolicyRecord|null>{
  try{
    const raw=await createSupabaseServerClient();if(!raw)return null;
    const {data}=await (raw as unknown as SupabaseClient).from("public_store_policy_settings").select("merchant,shipping,cancellation,returns,privacy,terms,policy_version,policy_effective_date").eq("id",true).maybeSingle();
    if(!data||typeof data.policy_version!=="string"||typeof data.policy_effective_date!=="string")return null;
    return {settings:normalize(data as Record<string,unknown>),version:data.policy_version,effectiveDate:data.policy_effective_date};
  }catch{return null;}
}
