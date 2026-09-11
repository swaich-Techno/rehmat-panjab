import {NextResponse} from "next/server";
import {requireAdmin} from "../../../../../lib/supabase/auth";
import {createSupabaseAdminClient} from "../../../../../lib/supabase/admin";

type Result={status:"missing_credentials"|"test_credentials"|"key_mismatch"|"authentication_failure"|"live_authentication_successful"|"network_or_provider_failure";checkedAt:string;liveKey:boolean;publicKeyMatches:boolean|null};

export async function POST(){
  const {role}=await requireAdmin();if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const keyId=process.env.RAZORPAY_KEY_ID??"",keySecret=process.env.RAZORPAY_KEY_SECRET??"",publicKey=process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID??"",checkedAt=new Date().toISOString();let result:Result;
  if(!keyId||!keySecret||!publicKey)result={status:"missing_credentials",checkedAt,liveKey:false,publicKeyMatches:null};
  else if(!keyId.startsWith("rzp_live_"))result={status:"test_credentials",checkedAt,liveKey:false,publicKeyMatches:keyId===publicKey};
  else if(keyId!==publicKey)result={status:"key_mismatch",checkedAt,liveKey:true,publicKeyMatches:false};
  else try{const authorization=Buffer.from(`${keyId}:${keySecret}`).toString("base64");const response=await fetch("https://api.razorpay.com/v1/orders?count=1",{headers:{authorization:`Basic ${authorization}`},cache:"no-store",signal:AbortSignal.timeout(8000)});result={status:response.ok?"live_authentication_successful":response.status===401||response.status===403?"authentication_failure":"network_or_provider_failure",checkedAt,liveKey:true,publicKeyMatches:true};}catch{result={status:"network_or_provider_failure",checkedAt,liveKey:true,publicKeyMatches:true};}
  const admin=createSupabaseAdminClient();if(admin){const {data}=await admin.from("provider_readiness").select("checklist").eq("provider","razorpay").maybeSingle();await admin.from("provider_readiness").update({checklist:{...((data?.checklist as Record<string,unknown>)??{}),razorpay_live_auth_status:result.status,razorpay_live_auth_checked_at:checkedAt,razorpay_live_credentials:result.status==="live_authentication_successful"},updated_at:checkedAt}).eq("provider","razorpay");}
  return NextResponse.json(result);
}
