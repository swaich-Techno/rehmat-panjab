import "server-only";
import {createSupabaseServerClient} from "./supabase/server";

export async function isControlledPaymentAdmin(request:Request){
  if(request.headers.get("x-rehmat-controlled-test")!=="live-payment-readiness")return false;
  const supabase=await createSupabaseServerClient();if(!supabase)return false;
  const {data:{user}}=await supabase.auth.getUser();if(!user)return false;
  const {data}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  return data?.role==="super_admin";
}
