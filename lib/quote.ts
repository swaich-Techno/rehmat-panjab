import { createSupabaseAdminClient } from "./supabase/admin";

export type QuoteLine = { variantId: string; quantity: number };
export type OrderQuote = { subtotalPaise:number; discountPaise:number; totalPaise:number; couponCode:string|null; couponId:string|null; promotionalLabel:string|null };

function discountAmount(type:string,value:number,eligible:number,max:number|null){
  const raw=type==="percentage"?Math.floor(eligible*Math.min(100,value)/100):value;
  return Math.max(0,Math.min(eligible,max===null?raw:Math.min(raw,max)));
}

export async function calculateOrderQuote(lines:QuoteLine[],couponInput?:string,customerIdentifier?:string):Promise<OrderQuote>{
  const admin=createSupabaseAdminClient();
  if(!admin) throw new Error("Order quoting is not configured.");
  const quantities=new Map<string,number>();
  for(const line of lines){ if(!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10) throw new Error("Choose a valid quantity."); quantities.set(line.variantId,(quantities.get(line.variantId)??0)+line.quantity); }
  if(!quantities.size||[...quantities.values()].some((q)=>q>10)) throw new Error("Choose between one and ten bottles per format.");
  const ids=[...quantities.keys()];
  const {data:variants,error}=await admin.from("product_variants").select("id,product_id,price_paise,enabled,products!inner(status)").in("id",ids);
  if(error||!variants||variants.length!==ids.length) throw new Error("The selected formats could not be quoted.");
  const lineData=variants.map((variant)=>{
    const product=Array.isArray(variant.products)?variant.products[0]:variant.products;
    if(!variant.enabled||variant.price_paise===null||product?.status!=="active") throw new Error("A selected format is unavailable.");
    const quantity=quantities.get(variant.id)??0;
    return {variantId:variant.id,productId:variant.product_id,quantity,subtotal:variant.price_paise*quantity};
  });
  const subtotalPaise=lineData.reduce((sum,line)=>sum+line.subtotal,0); const now=new Date().toISOString();
  let discountPaise=0; let promotionalLabel:string|null=null; let autoCombinable=true;
  const {data:discounts}=await admin.from("automatic_discounts").select("*").eq("active",true).is("archived_at",null).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`).order("priority",{ascending:false});
  for(const item of discounts??[]){
    const [{data:ps},{data:vs}]=await Promise.all([admin.from("discount_products").select("product_id").eq("discount_id",item.id),admin.from("discount_variants").select("variant_id").eq("discount_id",item.id)]);
    const pset=new Set((ps??[]).map(x=>x.product_id)); const vset=new Set((vs??[]).map(x=>x.variant_id));
    const eligible=lineData.filter(line=>(!pset.size||pset.has(line.productId))&&(!vset.size||vset.has(line.variantId)));
    const eligibleSubtotal=eligible.reduce((s,l)=>s+l.subtotal,0); const qty=eligible.reduce((s,l)=>s+l.quantity,0);
    if(qty<item.minimum_quantity||eligibleSubtotal<item.minimum_subtotal_paise) continue;
    discountPaise=discountAmount(item.discount_type,item.value,eligibleSubtotal,item.max_discount_paise); promotionalLabel=item.public_label; autoCombinable=item.combinable; break;
  }
  const couponCode=couponInput?.trim().toUpperCase()||null;
  let couponId:string|null=null;
  if(couponCode){
    const {data:coupon}=await admin.from("coupons").select("*").ilike("code",couponCode).maybeSingle();
    if(!coupon||!coupon.active||coupon.revoked_at||coupon.archived_at||(coupon.starts_at&&coupon.starts_at>now)||(coupon.expires_at&&coupon.expires_at<=now)) throw new Error("This coupon is not currently valid.");
    couponId=coupon.id;
    const {count}=await admin.from("coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",coupon.id).eq("confirmation_status","confirmed");
    if(coupon.total_usage_limit!==null&&(count??0)>=coupon.total_usage_limit) throw new Error("This coupon has reached its usage limit.");
    if(coupon.first_order_only&&!customerIdentifier) throw new Error("Customer details are required for this first-order coupon.");
    if(coupon.per_customer_limit&&customerIdentifier){ const {count:used}=await admin.from("coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",coupon.id).eq("customer_identifier",customerIdentifier).eq("confirmation_status","confirmed"); if((used??0)>=coupon.per_customer_limit) throw new Error("This coupon has reached its customer usage limit."); }
    const [{data:ps},{data:vs}]=await Promise.all([admin.from("coupon_products").select("product_id").eq("coupon_id",coupon.id),admin.from("coupon_variants").select("variant_id").eq("coupon_id",coupon.id)]);
    const pset=new Set((ps??[]).map(x=>x.product_id)); const vset=new Set((vs??[]).map(x=>x.variant_id));
    const eligible=lineData.filter(line=>(!pset.size||pset.has(line.productId))&&(!vset.size||vset.has(line.variantId)));
    const eligibleSubtotal=eligible.reduce((s,l)=>s+l.subtotal,0); const qty=eligible.reduce((s,l)=>s+l.quantity,0);
    if(qty<coupon.minimum_quantity||eligibleSubtotal<coupon.minimum_subtotal_paise) throw new Error("This order does not meet the coupon requirements.");
    const couponDiscount=discountAmount(coupon.discount_type,coupon.value,eligibleSubtotal,coupon.max_discount_paise);
    if(discountPaise&&!autoCombinable&&!coupon.combinable){ if(couponDiscount>discountPaise){discountPaise=couponDiscount;promotionalLabel=coupon.public_description;} }
    else {discountPaise=Math.min(subtotalPaise,discountPaise+couponDiscount); promotionalLabel=coupon.public_description||promotionalLabel;}
  }
  return {subtotalPaise,discountPaise,totalPaise:Math.max(0,subtotalPaise-discountPaise),couponCode,couponId,promotionalLabel};
}
