import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

type Relation<T> = T | T[] | null;
type Row = {
  id:string; product_id:string; sku:string; price_paise:number|null; status:string; enabled:boolean;
  products:Relation<{id:string;slug:string;name:string;status:string;tester_product_intake:Relation<{content_approved:boolean;image_approved:boolean}>}>;
  inventory:Relation<{quantity:number;reserved:number}>;
  bottles:Relation<{status:string}>;
  tester_variant_costs:Relation<{margin_approved:boolean;packaging_approved:boolean}>;
};

const one=<T,>(value:Relation<T>)=>Array.isArray(value)?value[0]??null:value;

export async function GET(){
  const admin=createSupabaseAdminClient();
  if(!admin)return NextResponse.json({items:[],message:"Tester catalogue is not configured."},{headers:{"cache-control":"no-store"}});
  const {data,error}=await admin.from("product_variants").select("id,product_id,sku,price_paise,status,enabled,products!inner(id,slug,name,status,tester_product_intake(content_approved,image_approved)),inventory(quantity,reserved),bottles(status),tester_variant_costs(margin_approved,packaging_approved)").eq("size_ml",3).eq("tester_pack_eligible",true).eq("status","active").eq("enabled",true);
  if(error)return NextResponse.json({items:[],message:"Tester packs are awaiting approval."},{headers:{"cache-control":"no-store"}});
  const items=((data??[]) as unknown as Row[]).flatMap(row=>{
    const product=one(row.products),inventory=one(row.inventory),bottle=one(row.bottles),costs=one(row.tester_variant_costs);
    const available=Math.max(0,(inventory?.quantity??0)-(inventory?.reserved??0));
    const intake=product&&one(product.tester_product_intake);
    if(!product||product.status!=="active"||!intake?.content_approved||!intake.image_approved||bottle?.status!=="active"||!costs?.margin_approved||!costs?.packaging_approved||row.price_paise===null||available<1)return [];
    return [{variantId:row.id,productId:row.product_id,productSlug:product.slug,productName:product.name,sku:row.sku,pricePaise:row.price_paise,availableQuantity:available}];
  });
  return NextResponse.json({items},{headers:{"cache-control":"no-store"}});
}
