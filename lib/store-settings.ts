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
