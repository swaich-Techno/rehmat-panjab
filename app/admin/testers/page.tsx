import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/supabase/auth";
import { TesterCostManager, type TesterCostRow } from "./tester-cost-manager";

export const dynamic="force-dynamic";

export default async function TesterAdminPage(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const db=supabase as unknown as SupabaseClient;
  const {data}=await db.from("product_variants").select("id,sku,price_paise,status,enabled,bottle_id,products!inner(id,name,status,image_path,description,suitability_note,tester_product_intake(*)),bottles(status,photo_path),inventory(quantity,reserved,low_stock_threshold),tester_variant_costs(*)").eq("size_ml",3).eq("tester_pack_eligible",true).order("sku");
  return <main id="main-content" className="admin-page"><p className="eyebrow">Private super-admin costs</p><h1>3 ml testers.</h1><p>Costs and margins below are private. A tester cannot be activated until every cost, real packaging approval, stock and margin review are complete.</p><TesterCostManager initial={(data??[]) as unknown as TesterCostRow[]}/></main>;
}
