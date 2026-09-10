import Razorpay from "razorpay";
import {NextResponse} from "next/server";
import {z} from "zod";
import {RAZORPAY_ENABLED} from "../../../../../lib/commerce";
import {requireAdmin} from "../../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../../lib/supabase/admin";

const schema=z.object({orderId:z.uuid(),amountPaise:z.number().int().positive().optional(),idempotencyKey:z.string().trim().min(12).max(100)}).strict();

export async function POST(request:Request){
  const {user,role}=await requireAdmin();
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  if(!RAZORPAY_ENABLED)return NextResponse.json({message:"Razorpay is not enabled."},{status:503});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({message:"Check the refund request."},{status:400});
  const keyId=process.env.RAZORPAY_KEY_ID,keySecret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!keySecret)return NextResponse.json({message:"Payment service is not configured."},{status:503});
  const admin=createSupabaseAdminClient();
  if(!admin)return NextResponse.json({message:"Order storage is not configured."},{status:503});
  const {data:order}=await admin.from("orders").select("id,status,total_paise,shipping_paise,refunded_paise,razorpay_payment_id").eq("id",parsed.data.orderId).maybeSingle();
  if(!order?.razorpay_payment_id||!["paid","refund_failed"].includes(order.status))return NextResponse.json({message:"Only a verified paid order can be refunded."},{status:409});
  const remaining=Math.max(0,Number(order.total_paise)-Number(order.shipping_paise??0)-Number(order.refunded_paise??0));
  const amount=parsed.data.amountPaise??remaining;
  if(amount<1||amount>remaining)return NextResponse.json({message:"Refund exceeds the paid merchandise amount."},{status:400});
  const {data:record,error}=await admin.from("razorpay_refunds").insert({order_id:order.id,payment_id:order.razorpay_payment_id,amount_paise:amount,idempotency_key:parsed.data.idempotencyKey,status:"pending",approved_by:user.id}).select("id").single();
  if(error||!record)return NextResponse.json({message:error?.code==="23505"?"This refund request was already submitted.":"Refund request could not be recorded."},{status:409});
  try{
    const refund=await new Razorpay({key_id:keyId,key_secret:keySecret}).payments.refund(order.razorpay_payment_id,{amount,notes:{order_id:order.id,refund_record_id:record.id}});
    await admin.from("razorpay_refunds").update({provider_refund_id:refund.id}).eq("id",record.id);
    await admin.from("orders").update({status:"refund_pending",razorpay_refund_id:refund.id,updated_at:new Date().toISOString()}).eq("id",order.id);
    await admin.from("audit_logs").insert({actor_id:user.id,action:"razorpay.refund_initiated",entity_type:"order",entity_id:order.id,metadata:{refund_id:record.id,amount_paise:amount}});
    return NextResponse.json({message:"Refund initiated.",refundId:record.id});
  }catch{
    await admin.from("razorpay_refunds").update({status:"failed",processed_at:new Date().toISOString()}).eq("id",record.id);
    return NextResponse.json({message:"Razorpay did not accept the refund request."},{status:502});
  }
}
