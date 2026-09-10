import type {SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../lib/supabase/auth";
import {policiesComplete,settingsFields,type SettingsGroup,type StoreSettings} from "../../../../lib/store-settings-schema";

const groupSchema=z.record(z.string(),z.string().trim().max(5000));
const schema=z.object({groups:z.object({merchant:groupSchema,shipping:groupSchema,cancellation:groupSchema,returns:groupSchema,privacy:groupSchema,terms:groupSchema}),publish:z.boolean(),publishConfirmation:z.boolean(),policyVersion:z.string().trim().regex(/^\d{4}-\d{2}-\d{2}\.\d+$/),effectiveDate:z.iso.date(),adminNotes:z.string().trim().max(5000)}).strict();

export async function POST(request:Request){
  const {supabase,user,role}=await requireAdmin();if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Check the policy fields and version."},{status:400});
  const clean={} as StoreSettings;for(const group of Object.keys(settingsFields) as SettingsGroup[])clean[group]=Object.fromEntries(settingsFields[group].map(field=>[field,parsed.data.groups[group][field]||""]));
  if(parsed.data.publish&&(!policiesComplete(clean)||!parsed.data.publishConfirmation))return NextResponse.json({message:"Publishing requires complete fields and explicit preview confirmation."},{status:409});
  const db=supabase as unknown as SupabaseClient;
  const {data:existingVersion}=await db.from("store_policy_versions").select("id,status").eq("version",parsed.data.policyVersion).maybeSingle();
  if(existingVersion?.status==="published")return NextResponse.json({message:"A published policy version is immutable. Save changes under a new version."},{status:409});
  const {data:current,error:readError}=await db.from("store_policy_settings").select("support_email_verified_at,support_phone_confirmed_at,shipping_calculation_verified_at,courier_configuration_verified_at").eq("id",true).single();
  if(readError)return NextResponse.json({message:"Publication checks could not be read."},{status:500});
  const checks=[current?.support_email_verified_at,current?.support_phone_confirmed_at,current?.shipping_calculation_verified_at];
  if(parsed.data.publish&&checks.some(value=>!value))return NextResponse.json({message:"Publishing is blocked until mailbox, phone and shipping checks are verified."},{status:409});
  const now=new Date().toISOString();
  const payload={...clean,policy_version:parsed.data.policyVersion,policy_effective_date:parsed.data.effectiveDate,publish_status:parsed.data.publish?"published":"draft",owner_approved_at:parsed.data.publish?now:null,publish_confirmed_at:parsed.data.publish?now:null,admin_notes:parsed.data.adminNotes,updated_by:user.id,updated_at:now};
  const {error}=await db.from("store_policy_settings").update(payload).eq("id",true);if(error)return NextResponse.json({message:"Policy settings could not be saved."},{status:500});
  const versionPayload={effective_date:parsed.data.effectiveDate,settings_snapshot:clean,status:parsed.data.publish?"published":"draft",published_by:parsed.data.publish?user.id:null,published_at:parsed.data.publish?now:null};
  if(existingVersion)await db.from("store_policy_versions").update(versionPayload).eq("id",existingVersion.id);else await db.from("store_policy_versions").insert({version:parsed.data.policyVersion,created_by:user.id,...versionPayload});
  await db.from("audit_logs").insert({actor_id:user.id,action:"policy_settings.updated",entity_type:"store_policy_settings",entity_id:"singleton",metadata:{published:parsed.data.publish,version:parsed.data.policyVersion}});
  return NextResponse.json({message:parsed.data.publish?"Policy version published.":"Draft policy version saved."});
}
