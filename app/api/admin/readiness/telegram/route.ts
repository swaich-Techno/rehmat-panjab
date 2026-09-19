import {NextResponse} from "next/server";
import {requireAdmin} from "../../../../../lib/supabase/auth";
import {sendTelegramReadinessMessage} from "../../../../../lib/telegram";

export async function POST(){
  const {role}=await requireAdmin();
  if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const result=await sendTelegramReadinessMessage();
  if(!result.sent)return NextResponse.json({status:result.reason},{status:result.reason==="not_configured"?503:502});
  return NextResponse.json({status:"telegram_message_sent"});
}
