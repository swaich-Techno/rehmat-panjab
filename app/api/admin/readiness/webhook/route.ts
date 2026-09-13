import {createHmac,randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {requireAdmin} from "../../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../../lib/supabase/admin";

export async function POST(request:Request){
  const {role}=await requireAdmin();if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)return NextResponse.json({status:"missing_webhook_secret"},{status:503});
  const eventId=`rehmat_readiness_${randomUUID()}`,body=JSON.stringify({event:"payment.failed",payload:{payment:{entity:{id:"pay_readiness_signed_test"}}}}),signature=createHmac("sha256",secret).update(body).digest("hex"),url=new URL("/api/razorpay/webhook",request.url);
  const send=()=>fetch(url,{method:"POST",headers:{"content-type":"application/json","x-razorpay-event-id":eventId,"x-razorpay-signature":signature},body,cache:"no-store",signal:AbortSignal.timeout(8000)});
  try{const first=await send(),retry=await send(),firstBody=await first.json(),retryBody=await retry.json(),verified=first.ok&&firstBody.received===true&&retry.ok&&retryBody.duplicate===true,checkedAt=new Date().toISOString();const admin=createSupabaseAdminClient();if(admin){const {data}=await admin.from("provider_readiness").select("checklist").eq("provider","razorpay").maybeSingle();await admin.from("provider_readiness").update({checklist:{...((data?.checklist as Record<string,unknown>)??{}),razorpay_webhook_verified:verified,razorpay_webhook_verified_at:checkedAt},updated_at:checkedAt}).eq("provider","razorpay");}return NextResponse.json({status:verified?"signed_webhook_and_idempotency_verified":"webhook_test_failed",firstStatus:first.status,retryStatus:retry.status});}catch{return NextResponse.json({status:"webhook_test_failed"},{status:502});}
}
