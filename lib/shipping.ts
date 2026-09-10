export const FREE_SHIPPING_THRESHOLD_PAISE=150000;

export type ShippingMethod="free_local_delivery"|"free_standard_shipping"|"standard_shipping_pending";
export type ShippingDecision={
  eligibleSubtotalPaise:number;
  shippingPaise:number|null;
  freeShipping:boolean;
  deliveryMethod:ShippingMethod;
  requiresManualConfirmation:boolean;
  message:string;
};

export function normalizeDeliveryPin(value:unknown){
  const pin=String(value??"").trim();
  return /^\d{6}$/.test(pin)?pin:null;
}

export function calculatePercentageDiscountPaise(eligibleSubtotalPaise:number,percentage:number){
  if(!Number.isSafeInteger(eligibleSubtotalPaise)||eligibleSubtotalPaise<0||!Number.isInteger(percentage)||percentage<0||percentage>100)throw new Error("Discount inputs must use exact non-negative integers.");
  return Math.floor(eligibleSubtotalPaise*percentage/100);
}

export function calculateShipping(
  eligibleSubtotalPaise:number,
  deliveryPin?:unknown,
  config:{autoLocalDeliveryEnabled?:boolean;approvedPins?:Iterable<string>}={},
):ShippingDecision{
  if(!Number.isSafeInteger(eligibleSubtotalPaise)||eligibleSubtotalPaise<0)throw new Error("Eligible subtotal must use non-negative INR minor units.");
  const pin=normalizeDeliveryPin(deliveryPin);
  const approved=new Set([...(config.approvedPins??[])].filter(value=>/^\d{6}$/.test(value)));
  if(config.autoLocalDeliveryEnabled&&pin&&approved.has(pin))return {eligibleSubtotalPaise,shippingPaise:0,freeShipping:true,deliveryMethod:"free_local_delivery",requiresManualConfirmation:false,message:"Free local delivery"};
  if(eligibleSubtotalPaise>=FREE_SHIPPING_THRESHOLD_PAISE)return {eligibleSubtotalPaise,shippingPaise:0,freeShipping:true,deliveryMethod:"free_standard_shipping",requiresManualConfirmation:false,message:"Free standard shipping"};
  return {eligibleSubtotalPaise,shippingPaise:null,freeShipping:false,deliveryMethod:"standard_shipping_pending",requiresManualConfirmation:true,message:"Shipping charge will be calculated and disclosed before payment or manual order confirmation."};
}
