import {NextResponse} from "next/server";
import {verifyRazorpayWebhookSignature} from "../../../../lib/razorpay";
import {createSupabaseAdminClient} from "../../../../lib/supabase/admin";

type Entity={id?:string;order_id?:string;payment_id?:string;amount?:number;currency?:string;status?:string;captured?:boolean};
type EventBody={event?:string;payload?:{payment?:{entity?:Entity};order?:{entity?:Entity};refund?:{entity?:Entity}}};
const supported=new Set(["payment.captured","payment.failed","order.paid","refund.processed","refund.failed"]);

export async function POST(request:Request){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature=request.headers.get("x-razorpay-signature")??"";
  const eventId=request.headers.get("x-razorpay-event-id")??"";
  const body=await request.text();
  if(!secret||!signature||!eventId||!verifyRazorpayWebhookSignature(body,signature,secret))return NextResponse.json({message:"Invalid webhook signature."},{status:400});
  let event:EventBody;
  try{event=JSON.parse(body) as EventBody;}catch{return NextResponse.json({message:"Invalid webhook payload."},{status:400});}
  if(!event.event)return NextResponse.json({message:"Webhook event type is missing."},{status:400});
  const admin=createSupabaseAdminClient();
  if(!admin)return NextResponse.json({message:"Order storage is not configured."},{status:503});
  const payment=event.payload?.payment?.entity;
  const refund=event.payload?.refund?.entity;
  const orderId=payment?.order_id??event.payload?.order?.entity?.id??null;
  const {error:claimError}=await admin.from("razorpay_webhook_events").insert({event_id:eventId,event_type:event.event,razorpay_order_id:orderId,razorpay_payment_id:payment?.id??refund?.payment_id??null,status:"processing"});
  if(claimError?.code==="23505")return NextResponse.json({received:true,duplicate:true});
  if(claimError)return NextResponse.json({message:"Webhook event could not be recorded."},{status:503});
  try{
    if(!supported.has(event.event)){await admin.from("razorpay_webhook_events").update({status:"ignored",processed_at:new Date().toISOString()}).eq("event_id",eventId);return NextResponse.json({received:true});}
    if(event.event==="payment.captured"){
      if(!payment?.id||!payment.order_id||payment.status!=="captured"||payment.captured!==true)throw new Error("incomplete_captured_payment");
      const {data:order}=await admin.from("orders").select("id,total_paise,currency,coupon_id,subtotal_paise,discount_paise,user_id").eq("razorpay_order_id",payment.order_id).maybeSingle();
      if(!order||Number(order.total_paise)!==Number(payment.amount)||order.currency!==payment.currency)throw new Error("payment_mismatch");
      const {error}=await admin.rpc("complete_razorpay_order",{p_razorpay_order_id:payment.order_id,p_razorpay_payment_id:payment.id});
      if(error)throw error;
      if(order.coupon_id&&order.discount_paise)await admin.from("coupon_redemptions").upsert({coupon_id:order.coupon_id,order_id:order.id,customer_identifier:order.user_id,eligible_subtotal_paise:order.subtotal_paise??0,discount_paise:order.discount_paise,confirmation_status:"confirmed",payment_status:"paid",idempotency_reference:`razorpay:${payment.id}`},{onConflict:"idempotency_reference"});
    }else if(event.event==="payment.failed"&&payment?.order_id){
      await admin.from("orders").update({status:"payment_failed",updated_at:new Date().toISOString()}).eq("razorpay_order_id",payment.order_id).in("status",["pending","payment_pending"]);
    }else if((event.event==="refund.processed"||event.event==="refund.failed")&&refund?.id&&refund.payment_id){
      const failed=event.event==="refund.failed";
      const {data:order}=await admin.from("orders").select("id,total_paise,shipping_paise,refunded_paise").eq("razorpay_payment_id",refund.payment_id).maybeSingle();
      if(!order)throw new Error("refund_order_not_found");
      await admin.from("razorpay_refunds").update({status:failed?"failed":"processed",provider_refund_id:refund.id,processed_at:new Date().toISOString()}).eq("order_id",order.id).eq("provider_refund_id",refund.id);
      const refunded=Number(order.refunded_paise??0)+(failed?0:Number(refund.amount??0));
      const refundable=Math.max(0,Number(order.total_paise)-Number(order.shipping_paise??0));
      await admin.from("orders").update({status:failed?"refund_failed":refunded>=refundable?"refunded":"paid",refunded_paise:refunded,razorpay_refund_id:refund.id,updated_at:new Date().toISOString()}).eq("id",order.id);
    }
    await admin.from("razorpay_webhook_events").update({status:"completed",processed_at:new Date().toISOString()}).eq("event_id",eventId);
    return NextResponse.json({received:true});
  }catch{
    await admin.from("razorpay_webhook_events").update({status:"failed",processed_at:new Date().toISOString()}).eq("event_id",eventId);
    return NextResponse.json({message:"Webhook event could not be applied."},{status:409});
  }
}
