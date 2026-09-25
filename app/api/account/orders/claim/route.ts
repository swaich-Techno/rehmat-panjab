import {NextResponse} from "next/server";
import {z} from "zod";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createSupabaseServerClient} from "../../../../../lib/supabase/server";

const schema=z.object({orderId:z.string().uuid()}).strict();
export async function POST(request:Request){const client=await createSupabaseServerClient();if(!client)return NextResponse.json({message:"Account service is unavailable."},{status:503});const {data}=await client.auth.getUser();if(!data.user)return NextResponse.json({message:"Sign in before claiming an order."},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Enter a valid order ID."},{status:400});const db=client as unknown as SupabaseClient;const {data:claimed,error}=await db.rpc("claim_guest_order",{p_order_id:parsed.data.orderId});if(error)return NextResponse.json({message:"The order could not be checked."},{status:500});return claimed?NextResponse.json({message:"Order added to your account."}):NextResponse.json({message:"The order email does not match this verified account, or it is already claimed."},{status:409});}
