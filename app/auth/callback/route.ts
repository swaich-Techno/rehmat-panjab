import {NextResponse} from "next/server";
import {createSupabaseServerClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code"),requested=url.searchParams.get("next");
  const next=requested?.startsWith("/")&&!requested.startsWith("//")?requested:"/account";
  const client=await createSupabaseServerClient();
  if(code&&client){const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin));}
  return NextResponse.redirect(new URL(`/account/sign-in?error=link&returnTo=${encodeURIComponent(next)}`,url.origin));
}
