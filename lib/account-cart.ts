import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoney, type CartLine } from "./cart";
import { calculateTesterPackPrice, isTesterPackSize } from "./tester-packs";
import { createSupabaseAdminClient } from "./supabase/admin";
import { getSupabaseConfig } from "./supabase/config";

export type StoredCartItem = {
  lineKey: string;
  kind: "product" | "tester-pack";
  variantId: string | null;
  quantity: number;
  testerPackSize: number | null;
  testerVariantIds: string[];
};

type VariantRow = {
  id:string; product_id:string; size_ml:number|string; sku:string; price_paise:number|null; enabled:boolean;
  status?:string; tester_pack_eligible?:boolean;
  products:{name:string;slug:string;status:string;image_path:string|null}|Array<{name:string;slug:string;status:string;image_path:string|null}>;
  inventory:{quantity:number;reserved:number}|Array<{quantity:number;reserved:number}>|null;
  tester_variant_costs?:{margin_approved:boolean;packaging_approved:boolean}|Array<{margin_approved:boolean;packaging_approved:boolean}>|null;
};

const one=<T,>(value:T|T[]|null|undefined)=>Array.isArray(value)?value[0]??null:value??null;
const publicImage=(path:string|null)=>{
  if(!path)return "/images/products/product-image-pending.svg";
  if(path.startsWith("/")||path.startsWith("http://")||path.startsWith("https://"))return path;
  const config=getSupabaseConfig();
  return config?`${config.url}/storage/v1/object/public/product-images/${path}`:"/images/products/product-image-pending.svg";
};

export async function repriceCartItems(items:StoredCartItem[]):Promise<CartLine[]>{
  if(!items.length)return [];
  const admin=createSupabaseAdminClient() as SupabaseClient|null;
  if(!admin)return [];
  const ids=[...new Set(items.flatMap(item=>item.kind==="tester-pack"?item.testerVariantIds:item.variantId?[item.variantId]:[]))];
  if(!ids.length)return [];
  const {data,error}=await admin.from("product_variants").select("id,product_id,size_ml,sku,price_paise,enabled,status,tester_pack_eligible,products!inner(name,slug,status,image_path),inventory(quantity,reserved),tester_variant_costs(margin_approved,packaging_approved)").in("id",ids);
  if(error||!data)return [];
  const byId=new Map((data as unknown as VariantRow[]).map(row=>[row.id,row]));
  const result:CartLine[]=[];
  for(const item of items){
    const quantity=Math.max(1,Math.min(10,Math.floor(item.quantity)));
    if(item.kind==="product"&&item.variantId){
      const variant=byId.get(item.variantId),product=variant&&one(variant.products),inventory=variant&&one(variant.inventory);
      const available=inventory?Math.max(0,inventory.quantity-inventory.reserved):0;
      if(!variant||!product||!variant.enabled||variant.price_paise===null||product.status!=="active"||available<1)continue;
      result.push({variantId:variant.id,productSlug:product.slug,productName:product.name,sizeMl:Number(variant.size_ml),sku:variant.sku,unitPricePaise:variant.price_paise,currency:"INR",image:publicImage(product.image_path),quantity:Math.min(quantity,available),maxQuantity:available,kind:"product"});
      continue;
    }
    if(item.kind!=="tester-pack"||item.testerPackSize===null||!isTesterPackSize(item.testerPackSize)||item.testerVariantIds.length!==item.testerPackSize||new Set(item.testerVariantIds).size!==item.testerPackSize)continue;
    const rows=item.testerVariantIds.map(id=>byId.get(id));
    if(rows.some(row=>!row))continue;
    const valid=rows as VariantRow[];
    const available=valid.map(row=>{const stock=one(row.inventory);return stock?Math.max(0,stock.quantity-stock.reserved):0;});
    if(valid.some((row,index)=>{const product=one(row.products),cost=one(row.tester_variant_costs);return !row.enabled||row.status!=="active"||!row.tester_pack_eligible||row.price_paise===null||product?.status!=="active"||!cost?.margin_approved||!cost?.packaging_approved||available[index]<1;}))continue;
    const priced=calculateTesterPackPrice(valid.map(row=>row.price_paise!),item.testerPackSize);
    const selected=valid.map(row=>{const product=one(row.products)!;return {variantId:row.id,productId:row.product_id,productSlug:product.slug,productName:product.name,sku:row.sku};});
    const signature=valid.map(row=>row.id).sort().join(":");
    result.push({kind:"tester-pack",variantId:`tester-pack:${item.testerPackSize}:${signature}`,productSlug:"testers",productName:`Pick Any ${item.testerPackSize} — 3 ml Tester Pack`,sizeMl:3,sku:`RP-TP-${item.testerPackSize}`,unitPricePaise:priced.totalPaise,currency:"INR",image:"/images/testers/3ml-bottle-draft-reference.jpeg",quantity:Math.min(quantity,...available),maxQuantity:Math.min(...available),testerPack:{packSize:item.testerPackSize,discountPercent:priced.discountPercent,selected}});
  }
  return result;
}

export function cartSyncMessage(lines:CartLine[]){return lines.length?`${lines.length} current ${lines.length===1?"selection":"selections"} saved.`:"Your saved cart is empty.";}
export function cartLineSummary(line:CartLine){return `${line.productName} · ${formatMoney(line.unitPricePaise)}`;}
