import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateTesterPackPrice } from "../../../../lib/tester-packs";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

const schema=z.object({packSize:z.union([z.literal(2),z.literal(3),z.literal(5)]),variantIds:z.array(z.uuid()).min(2).max(5)}).strict();
type Relation<T> = T | T[] | null;
type Row={id:string;product_id:string;price_paise:number|null;enabled:boolean;status:string;tester_pack_eligible:boolean;products:Relation<{status:string;tester_product_intake:Relation<{content_approved:boolean;image_approved:boolean}>}>;inventory:Relation<{quantity:number;reserved:number}>;bottles:Relation<{status:string}>;tester_variant_costs:Relation<{margin_approved:boolean;packaging_approved:boolean}>};
const one=<T,>(value:Relation<T>)=>Array.isArray(value)?value[0]??null:value;

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||parsed.data.variantIds.length!==parsed.data.packSize||new Set(parsed.data.variantIds).size!==parsed.data.packSize)return NextResponse.json({message:`Choose exactly ${parsed.success?parsed.data.packSize:"the required number of"} different fragrances.`},{status:400});
  const admin=createSupabaseAdminClient();
  if(!admin)return NextResponse.json({message:"Tester quoting is not configured."},{status:503});
  const {data,error}=await admin.from("product_variants").select("id,product_id,price_paise,enabled,status,tester_pack_eligible,products!inner(status,tester_product_intake(content_approved,image_approved)),inventory(quantity,reserved),bottles(status),tester_variant_costs(margin_approved,packaging_approved)").in("id",parsed.data.variantIds);
  if(error||!data||data.length!==parsed.data.packSize)return NextResponse.json({message:"The selected testers could not be verified."},{status:409});
  const rows=data as unknown as Row[];
  if(new Set(rows.map(row=>row.product_id)).size!==parsed.data.packSize)return NextResponse.json({message:"Choose different fragrances; duplicates are not allowed."},{status:400});
  for(const row of rows){const product=one(row.products),intake=product&&one(product.tester_product_intake),inventory=one(row.inventory),bottle=one(row.bottles),costs=one(row.tester_variant_costs);if(!row.enabled||row.status!=="active"||!row.tester_pack_eligible||row.price_paise===null||product?.status!=="active"||!intake?.content_approved||!intake.image_approved||bottle?.status!=="active"||!costs?.margin_approved||!costs?.packaging_approved)return NextResponse.json({message:"A selected tester is awaiting approval."},{status:409});if(!inventory||inventory.quantity-inventory.reserved<1)return NextResponse.json({message:"A selected tester is out of stock."},{status:409});}
  const quote=calculateTesterPackPrice(rows.map(row=>row.price_paise!),parsed.data.packSize);
  return NextResponse.json({...quote,currency:"INR",variantIds:parsed.data.variantIds},{headers:{"cache-control":"no-store"}});
}
