import type {SupabaseClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../../lib/supabase/auth";
import {ConfirmationForm} from "./confirmation-form";
export const dynamic="force-dynamic";

type SampleVariantRelation={id:string;sku:string;products:{name:string}|Array<{name:string}>|null;inventory:{quantity:number;reserved:number}|Array<{quantity:number;reserved:number}>|null};
type SampleVariantRow={variant_id:string;product_variants:SampleVariantRelation|SampleVariantRelation[]|null};
const related=<T,>(value:T|T[]|null)=>Array.isArray(value)?value[0]:value;

export default async function Page(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const db=supabase as unknown as SupabaseClient;
  const [{data:manual},{data:orders},{data:eligibleRows},{count:sampleClaims}]=await Promise.all([
    db.from("whatsapp_order_confirmations").select("id,reference,total_paise,status,created_at").order("created_at",{ascending:false}).limit(50),
    db.from("orders").select("id,total_paise,status,delivery_method,delivery_snapshot,created_at").order("created_at",{ascending:false}).limit(50),
    db.from("sample_campaign_variants").select("variant_id,product_variants!inner(id,sku,products!inner(name),inventory(quantity,reserved))").eq("campaign_id","diwali-sample-2026"),
    db.from("sample_campaign_claims").select("id",{count:"exact",head:true}).eq("campaign_id","diwali-sample-2026").eq("status","confirmed"),
  ]);
  const sampleVariants=((eligibleRows??[]) as unknown as SampleVariantRow[]).flatMap((row)=>{const variant=related(row.product_variants);const product=variant&&related(variant.products);const inventory=variant&&related(variant.inventory);return variant&&inventory&&inventory.quantity-inventory.reserved>0?[{id:row.variant_id,label:`${product?.name??"3 ml tester"} · ${variant.sku}`}]:[];});
  return <main id="main-content" className="admin-page">
    <p className="eyebrow">House administration</p><h1>Orders.</h1>
    <p><strong>{Math.max(0,99-(sampleClaims??0))}</strong> of 99 verified Diwali sample claims remain.</p>
    <ConfirmationForm sampleVariants={sampleVariants}/>
    <section><h2>Checkout orders</h2><div className="admin-table">{(orders??[]).map(item=><details key={item.id}><summary><strong>{item.id}</strong><span>₹{(Number(item.total_paise??0)/100).toLocaleString("en-IN")}</span><span>{item.status}</span></summary><pre>{JSON.stringify(item.delivery_snapshot??{},null,2)}</pre><p>Delivery: {item.delivery_method??"Pending confirmation"}</p></details>)}</div></section>
    <section><h2>Manual WhatsApp confirmations</h2><div className="admin-table">{(manual??[]).map(item=><div key={item.id}><strong>{item.reference}</strong><span>₹{(item.total_paise/100).toLocaleString("en-IN")}</span><span>{item.status}</span></div>)}</div></section>
  </main>;
}
