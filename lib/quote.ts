import { createSupabaseAdminClient } from "./supabase/admin";
import { calculateShipping, type ShippingDecision } from "./shipping";
import { calculateTesterPackPrice, isTesterPackSize, type TesterPackSize } from "./tester-packs";
import { buyTwoGiftSaving, chooseBestPromotion, festivalSaving } from "./promotions.mjs";

export type QuoteLine = { variantId: string; quantity: number };
export type TesterPackQuoteLine = { packSize: TesterPackSize; variantIds: string[]; quantity: number };
export type QuoteReward = { variantId:string; productId:string; sku:string; quantity:number; listPricePaise:number };
export type AppliedPromotion = { kind:string; label:string; savingPaise:number; percent?:number };
export type OrderQuote = {
  subtotalPaise:number; discountPaise:number; totalPaise:number; grandTotalPaise:number|null;
  couponCode:string|null; couponId:string|null; promotionalLabel:string|null; appliedPromotion:AppliedPromotion|null;
  reward:QuoteReward|null; shipping:ShippingDecision;
};

export function discountAmount(type:string,value:number,eligible:number,max:number|null){
  const raw=type==="percentage"?Math.floor(eligible*Math.min(100,value)/100):value;
  return Math.max(0,Math.min(eligible,max===null?raw:Math.min(raw,max)));
}

type PromotionInput={rewardVariantId?:string;now?:Date};
type Candidate=AppliedPromotion&{priority:number;couponId?:string;couponCode?:string;reward?:QuoteReward};
const one=<T>(value:T|T[]|null|undefined)=>Array.isArray(value)?value[0]:value;

export async function calculateOrderQuote(lines:QuoteLine[],couponInput?:string,customerIdentifier?:string,deliveryPin?:string,testerPacks:TesterPackQuoteLine[]=[],promotionInput:PromotionInput={}):Promise<OrderQuote>{
  const admin=createSupabaseAdminClient();
  if(!admin) throw new Error("Order quoting is not configured.");
  const quantities=new Map<string,number>();
  for(const line of lines){if(!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10)throw new Error("Choose a valid quantity.");quantities.set(line.variantId,(quantities.get(line.variantId)??0)+line.quantity);}
  for(const pack of testerPacks){
    if(!isTesterPackSize(pack.packSize)||pack.variantIds.length!==pack.packSize||new Set(pack.variantIds).size!==pack.packSize)throw new Error(`Choose exactly ${pack.packSize} different fragrances.`);
    if(!Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>10)throw new Error("Choose a valid tester-pack quantity.");
    for(const variantId of pack.variantIds)quantities.set(variantId,(quantities.get(variantId)??0)+pack.quantity);
  }
  if(!quantities.size||[...quantities.values()].some(quantity=>quantity>10))throw new Error("Choose between one and ten bottles per format.");
  const ids=[...quantities.keys()];
  const {data:variants,error}=await admin.from("product_variants").select("id,product_id,size_ml,sku,price_paise,enabled,status,tester_pack_eligible,products!inner(status,tester_product_intake(content_approved,image_approved)),inventory(quantity,reserved),tester_variant_costs(margin_approved,packaging_approved)").in("id",ids);
  if(error||!variants||variants.length!==ids.length)throw new Error("The selected formats could not be quoted.");
  const variantsById=new Map(variants.map(variant=>[variant.id,variant]));
  for(const pack of testerPacks){
    for(const variantId of pack.variantIds){
      const variant=variantsById.get(variantId);const product=variant&&one(variant.products);const intake=product&&one(product.tester_product_intake);const stock=variant&&one(variant.inventory);const costs=variant&&one(variant.tester_variant_costs);
      if(!variant||Number(variant.size_ml)!==3||!variant.enabled||variant.status!=="active"||!variant.tester_pack_eligible||variant.price_paise===null||product?.status!=="active"||!intake?.content_approved||!intake.image_approved||!costs?.margin_approved||!costs?.packaging_approved)throw new Error("A selected tester is not approved for sale.");
      if(!stock||stock.quantity-stock.reserved<(quantities.get(variantId)??0))throw new Error("A selected tester does not have enough stock.");
    }
  }
  const lineData=variants.map(variant=>{
    const product=one(variant.products);const stock=one(variant.inventory);const quantity=quantities.get(variant.id)??0;
    if(!variant.enabled||variant.status!=="active"||variant.price_paise===null||product?.status!=="active")throw new Error("A selected format is unavailable.");
    if(!stock||stock.quantity-stock.reserved<quantity)throw new Error("An item does not have enough available stock.");
    return {variantId:variant.id,productId:variant.product_id,sizeMl:Number(variant.size_ml),sku:variant.sku,quantity,subtotal:variant.price_paise*quantity};
  });
  const paidSubtotalPaise=lineData.reduce((sum,line)=>sum+line.subtotal,0);const current=promotionInput.now??new Date();const now=current.toISOString();
  const candidates:Candidate[]=[];
  const testerSaving=testerPacks.reduce((saving,pack)=>{const unit=calculateTesterPackPrice(pack.variantIds.map(id=>variantsById.get(id)!.price_paise!),pack.packSize);return saving+unit.discountPaise*pack.quantity;},0);
  if(testerSaving)candidates.push({kind:"tester-pack",label:"Build-your-own tester-pack saving",savingPaise:testerSaving,priority:10});

  const {data:discounts}=await admin.from("automatic_discounts").select("*").eq("active",true).is("archived_at",null).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`).order("priority",{ascending:false});
  for(const item of discounts??[]){
    const [{data:ps},{data:vs}]=await Promise.all([admin.from("discount_products").select("product_id").eq("discount_id",item.id),admin.from("discount_variants").select("variant_id").eq("discount_id",item.id)]);
    const pset=new Set((ps??[]).map(row=>row.product_id));const vset=new Set((vs??[]).map(row=>row.variant_id));
    const eligible=lineData.filter(line=>(!pset.size||pset.has(line.productId))&&(!vset.size||vset.has(line.variantId)));const eligibleSubtotal=eligible.reduce((sum,line)=>sum+line.subtotal,0);const quantity=eligible.reduce((sum,line)=>sum+line.quantity,0);
    if(quantity<item.minimum_quantity||eligibleSubtotal<item.minimum_subtotal_paise)continue;
    const savingPaise=discountAmount(item.discount_type,item.value,eligibleSubtotal,item.max_discount_paise);
    if(savingPaise)candidates.push({kind:"automatic",label:item.public_label||item.internal_name,savingPaise,priority:15+Number(item.priority??0)});
  }

  const {data:campaign}=await admin.from("promotion_campaigns").select("public_label,starts_at,ends_at,tiers,max_discount_paise,active").eq("id","navratri-dussehra-2026").maybeSingle();
  const festival=festivalSaving(paidSubtotalPaise,current,campaign?{publicLabel:campaign.public_label,startsAt:campaign.starts_at,endsAt:campaign.ends_at,tiers:campaign.tiers,maxDiscountPaise:campaign.max_discount_paise,active:campaign.active}:{active:false});
  if(festival)candidates.push(festival);

  let reward:QuoteReward|null=null;
  if(promotionInput.rewardVariantId){
    const {data:rewardVariant}=await admin.from("product_variants").select("id,product_id,size_ml,sku,price_paise,enabled,status,products!inner(status),inventory(quantity,reserved)").eq("id",promotionInput.rewardVariantId).maybeSingle();
    const rewardProduct=rewardVariant&&one(rewardVariant.products);const rewardStock=rewardVariant&&one(rewardVariant.inventory);const paidSixMlQuantity=lineData.filter(line=>line.sizeMl===6).reduce((sum,line)=>sum+line.quantity,0);
    const gift=rewardVariant&&rewardProduct?.status==="active"&&rewardVariant.enabled&&rewardVariant.status==="active"&&Number(rewardVariant.size_ml)===3&&rewardVariant.price_paise!==null&&rewardStock
      ?buyTwoGiftSaving({paidSixMlQuantity,rewardPricePaise:rewardVariant.price_paise,rewardAvailableQuantity:rewardStock.quantity-rewardStock.reserved,rewardVariantId:rewardVariant.id}):null;
    if(gift&&rewardVariant){reward={variantId:rewardVariant.id,productId:rewardVariant.product_id,sku:rewardVariant.sku,quantity:gift.rewardQuantity,listPricePaise:rewardVariant.price_paise!};candidates.push({...gift,reward});}
  }

  let couponCode=couponInput?.trim().toUpperCase()||null;let couponId:string|null=null;
  if(couponCode){
    const {data:coupon}=await admin.from("coupons").select("*").ilike("code",couponCode).maybeSingle();
    if(!coupon||!coupon.active||coupon.revoked_at||coupon.archived_at||(coupon.starts_at&&coupon.starts_at>now)||(coupon.expires_at&&coupon.expires_at<=now))throw new Error("This coupon is not currently valid.");
    const {count}=await admin.from("coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",coupon.id).eq("confirmation_status","confirmed");
    if(coupon.total_usage_limit!==null&&(count??0)>=coupon.total_usage_limit)throw new Error("This coupon has reached its usage limit.");
    if(coupon.first_order_only&&!customerIdentifier)throw new Error("Customer details are required for this first-order coupon.");
    if(coupon.per_customer_limit&&customerIdentifier){const {count:used}=await admin.from("coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",coupon.id).eq("customer_identifier",customerIdentifier).eq("confirmation_status","confirmed");if((used??0)>=coupon.per_customer_limit)throw new Error("This coupon has reached its customer usage limit.");}
    const [{data:ps},{data:vs}]=await Promise.all([admin.from("coupon_products").select("product_id").eq("coupon_id",coupon.id),admin.from("coupon_variants").select("variant_id").eq("coupon_id",coupon.id)]);
    const pset=new Set((ps??[]).map(row=>row.product_id));const vset=new Set((vs??[]).map(row=>row.variant_id));const eligible=lineData.filter(line=>(!pset.size||pset.has(line.productId))&&(!vset.size||vset.has(line.variantId)));
    const eligibleSubtotal=eligible.reduce((sum,line)=>sum+line.subtotal,0);const quantity=eligible.reduce((sum,line)=>sum+line.quantity,0);
    if(quantity<coupon.minimum_quantity||eligibleSubtotal<coupon.minimum_subtotal_paise)throw new Error("This order does not meet the coupon requirements.");
    couponId=coupon.id;const savingPaise=discountAmount(coupon.discount_type,coupon.value,eligibleSubtotal,coupon.max_discount_paise);
    candidates.push({kind:"coupon",label:coupon.public_description||coupon.code,savingPaise,priority:25,couponId:coupon.id,couponCode});
  }

  const selected=chooseBestPromotion(candidates) as Candidate|null;
  if(selected?.kind!=="coupon"){couponCode=null;couponId=null;}else{couponCode=selected.couponCode??couponCode;couponId=selected.couponId??couponId;}
  if(selected?.kind!=="buy-two-gift")reward=null;
  const rewardListPaise=reward?reward.listPricePaise*reward.quantity:0;const subtotalPaise=paidSubtotalPaise+rewardListPaise;const discountPaise=selected?.savingPaise??0;const totalPaise=Math.max(0,subtotalPaise-discountPaise);
  const {data:delivery}=await admin.from("local_delivery_settings").select("auto_eligibility_enabled,verified_at").eq("id",true).maybeSingle();
  const {data:pins}=delivery?.auto_eligibility_enabled&&delivery.verified_at?await admin.from("local_delivery_pincodes").select("pin_code").eq("active",true):{data:[] as Array<{pin_code:string}>};
  const shipping=calculateShipping(totalPaise,deliveryPin,{autoLocalDeliveryEnabled:Boolean(delivery?.auto_eligibility_enabled&&delivery.verified_at),approvedPins:(pins??[]).map(row=>row.pin_code)});
  const appliedPromotion=selected?{kind:selected.kind,label:selected.label,savingPaise:selected.savingPaise,...(selected.percent?{percent:selected.percent}:{})}:null;
  return {subtotalPaise,discountPaise,totalPaise,grandTotalPaise:shipping.shippingPaise===null?null:totalPaise+shipping.shippingPaise,couponCode,couponId,promotionalLabel:selected?.label??null,appliedPromotion,reward,shipping};
}
