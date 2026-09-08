import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const schema=z.object({kind:z.enum(["discount","coupon"]),id:z.string().uuid().optional(),code:z.string().trim().max(40).optional(),internalName:z.string().trim().min(2).max(120),publicLabel:z.string().trim().max(180).optional(),discountType:z.enum(["percentage","fixed"]),value:z.number().int().positive(),maxDiscountPaise:z.number().int().positive().nullable(),minimumQuantity:z.number().int().positive(),minimumSubtotalPaise:z.number().int().min(0),startsAt:z.string().nullable(),endsAt:z.string().nullable(),active:z.boolean(),priority:z.number().int().optional(),combinable:z.boolean(),totalUsageLimit:z.number().int().positive().nullable().optional(),perCustomerLimit:z.number().int().positive().nullable().optional(),firstOrderOnly:z.boolean().optional(),freeShipping:z.boolean().optional(),adminNotes:z.string().max(2000).optional(),productIds:z.array(z.string().uuid()),variantIds:z.array(z.string().uuid())}).strict();

export async function POST(request:Request){
  const {supabase,user,role}=await requireAdmin(); const db=supabase as unknown as SupabaseClient;
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||parsed.data.discountType==="percentage"&&parsed.data.value>100)return NextResponse.json({message:"Check the promotion values."},{status:400});
  const v=parsed.data; const table=v.kind==="coupon"?"coupons":"automatic_discounts";
  const payload=v.kind==="coupon"
    ?{code:v.code?.trim().toUpperCase(),internal_name:v.internalName,public_description:v.publicLabel||null,discount_type:v.discountType,value:v.value,max_discount_paise:v.maxDiscountPaise,minimum_quantity:v.minimumQuantity,minimum_subtotal_paise:v.minimumSubtotalPaise,starts_at:v.startsAt,expires_at:v.endsAt,active:v.active,combinable:v.combinable,total_usage_limit:v.totalUsageLimit,per_customer_limit:v.perCustomerLimit,first_order_only:v.firstOrderOnly,free_shipping:v.freeShipping,admin_notes:v.adminNotes||null,updated_at:new Date().toISOString()}
    :{internal_name:v.internalName,public_label:v.publicLabel||null,discount_type:v.discountType,value:v.value,max_discount_paise:v.maxDiscountPaise,minimum_quantity:v.minimumQuantity,minimum_subtotal_paise:v.minimumSubtotalPaise,starts_at:v.startsAt,ends_at:v.endsAt,active:v.active,priority:v.priority??0,combinable:v.combinable,admin_notes:v.adminNotes||null,updated_at:new Date().toISOString()};
  if(v.kind==="coupon"&&!payload.code)return NextResponse.json({message:"Coupon code is required."},{status:400});
  const query=v.id?db.from(table).update(payload as never).eq("id",v.id):db.from(table).insert(payload as never); const {data,error}=await query.select("id").single();
  if(error||!data)return NextResponse.json({message:error?.code==="23505"?"That coupon code already exists.":"The promotion could not be saved."},{status:409});
  const id=data.id; const productTable=v.kind==="coupon"?"coupon_products":"discount_products"; const variantTable=v.kind==="coupon"?"coupon_variants":"discount_variants"; const foreignKey=v.kind==="coupon"?"coupon_id":"discount_id";
  await Promise.all([db.from(productTable).delete().eq(foreignKey,id),db.from(variantTable).delete().eq(foreignKey,id)]);
  if(v.productIds.length)await db.from(productTable).insert(v.productIds.map(product_id=>({[foreignKey]:id,product_id})));
  if(v.variantIds.length)await db.from(variantTable).insert(v.variantIds.map(variant_id=>({[foreignKey]:id,variant_id})));
  await db.from("audit_logs").insert({actor_id:user.id,action:`${v.kind}.${v.id?"updated":"created"}`,entity_type:v.kind,entity_id:id,metadata:{}});
  return NextResponse.json({message:"Promotion saved.",id});
}

export async function DELETE(request:Request){
  const {supabase,user,role}=await requireAdmin(); const db=supabase as unknown as SupabaseClient;
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const input=z.object({kind:z.enum(["discount","coupon"]),id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));
  if(!input.success)return NextResponse.json({message:"Invalid promotion."},{status:400});
  const table=input.data.kind==="coupon"?"coupons":"automatic_discounts"; const {error}=await db.from(table).update({active:false,archived_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",input.data.id);
  if(error)return NextResponse.json({message:"Promotion could not be archived."},{status:500});
  await db.from("audit_logs").insert({actor_id:user.id,action:`${input.data.kind}.archived`,entity_type:input.data.kind,entity_id:input.data.id,metadata:{}});
  return NextResponse.json({message:"Promotion archived."});
}
