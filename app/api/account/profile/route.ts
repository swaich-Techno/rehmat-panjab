import {NextResponse} from "next/server";
import {z} from "zod";
import {createSupabaseServerClient} from "../../../../lib/supabase/server";

const schema=z.object({displayName:z.string().trim().min(1).max(80)}).strict();
export async function PATCH(request:Request){const client=await createSupabaseServerClient();if(!client)return NextResponse.json({message:"Account service is unavailable."},{status:503});const {data}=await client.auth.getUser();if(!data.user)return NextResponse.json({message:"Sign in to update your profile."},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Enter a display name between 1 and 80 characters."},{status:400});const {error}=await client.from("profiles").update({display_name:parsed.data.displayName}).eq("id",data.user.id);return error?NextResponse.json({message:"Your profile could not be updated."},{status:500}):NextResponse.json({message:"Profile updated."});}
