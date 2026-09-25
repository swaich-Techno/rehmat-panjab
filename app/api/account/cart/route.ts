import {NextResponse} from "next/server";
import {z} from "zod";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createSupabaseServerClient} from "../../../../lib/supabase/server";
import {repriceCartItems,type StoredCartItem} from "../../../../lib/account-cart";

const selected=z.object({variantId:z.string().uuid(),productId:z.string(),productSlug:z.string(),productName:z.string(),sku:z.string()}).passthrough();
const line=z.object({variantId:z.string().min(1),quantity:z.number().int().min(1).max(10),kind:z.enum(["product","tester-pack"]).optional(),testerPack:z.object({packSize:z.union([z.literal(2),z.literal(3),z.literal(5)]),selected:z.array(selected).min(2).max(5)}).optional()}).passthrough();
const payload=z.object({lines:z.array(line).max(30)}).strict();

async function viewer(){const client=await createSupabaseServerClient();if(!client)return null;const {data}=await client.auth.getUser();return data.user?{client:client as unknown as SupabaseClient,user:data.user}:null;}
const stored=(row:{line_key:string;kind:"product"|"tester-pack";variant_id:string|null;quantity:number;tester_pack_size:number|null;tester_variant_ids:string[]}):StoredCartItem=>({lineKey:row.line_key,kind:row.kind,variantId:row.variant_id,quantity:row.quantity,testerPackSize:row.tester_pack_size,testerVariantIds:row.tester_variant_ids??[]});

export async function GET(){
  const auth=await viewer();if(!auth)return NextResponse.json({message:"Sign in to load your saved cart."},{status:401});
  const {data:cart}=await auth.client.from("customer_carts").select("id").eq("user_id",auth.user.id).maybeSingle();
  if(!cart)return NextResponse.json({lines:[]});
  const {data,error}=await auth.client.from("customer_cart_items").select("line_key,kind,variant_id,quantity,tester_pack_size,tester_variant_ids").eq("cart_id",cart.id);
  if(error)return NextResponse.json({message:"Your saved cart could not be loaded."},{status:500});
  return NextResponse.json({lines:await repriceCartItems((data??[]).map(stored))});
}

export async function POST(request:Request){
  const auth=await viewer();if(!auth)return NextResponse.json({message:"Sign in to save your cart."},{status:401});
  const parsed=payload.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"The cart could not be validated."},{status:400});
  const requested:StoredCartItem[]=parsed.data.lines.map(item=>item.kind==="tester-pack"&&item.testerPack?{lineKey:item.variantId,kind:"tester-pack",variantId:null,quantity:item.quantity,testerPackSize:item.testerPack.packSize,testerVariantIds:item.testerPack.selected.map(entry=>entry.variantId)}:{lineKey:item.variantId,kind:"product",variantId:item.variantId,quantity:item.quantity,testerPackSize:null,testerVariantIds:[]});
  const lines=await repriceCartItems(requested);
  const {data:cart,error:cartError}=await auth.client.from("customer_carts").upsert({user_id:auth.user.id,updated_at:new Date().toISOString()},{onConflict:"user_id"}).select("id").single();
  if(cartError||!cart)return NextResponse.json({message:"Your cart could not be saved."},{status:500});
  const {error:deleteError}=await auth.client.from("customer_cart_items").delete().eq("cart_id",cart.id);if(deleteError)return NextResponse.json({message:"Your cart could not be updated."},{status:500});
  if(lines.length){const rows=lines.map(item=>({cart_id:cart.id,line_key:item.variantId,kind:item.testerPack?"tester-pack":"product",variant_id:item.testerPack?null:item.variantId,quantity:item.quantity,tester_pack_size:item.testerPack?.packSize??null,tester_variant_ids:item.testerPack?.selected.map(entry=>entry.variantId)??[],updated_at:new Date().toISOString()}));const {error}=await auth.client.from("customer_cart_items").insert(rows);if(error)return NextResponse.json({message:"Your cart could not be updated."},{status:500});}
  return NextResponse.json({lines});
}
