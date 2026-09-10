import type {SupabaseClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../../lib/supabase/auth";
import {DeliveryZoneForm} from "./delivery-zone-form";

export const dynamic="force-dynamic";

export default async function Page(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const db=supabase as unknown as SupabaseClient;
  const [{data:settings},{data:pins}]=await Promise.all([db.from("local_delivery_settings").select("auto_eligibility_enabled,verified_at").eq("id",true).maybeSingle(),db.from("local_delivery_pincodes").select("pin_code").eq("active",true).order("pin_code")]);
  return <main id="main-content" className="admin-page"><p className="eyebrow">Private super-admin settings</p><h1>Local delivery.</h1><p>Manage exact approved PIN codes for eligible addresses in and around Khanna and Samrala. Manual WhatsApp confirmation remains available.</p><DeliveryZoneForm pins={(pins??[]).map(row=>String(row.pin_code))} autoEnabled={Boolean(settings?.auto_eligibility_enabled)} verifiedAt={settings?.verified_at?String(settings.verified_at):null}/></main>;
}
