import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/supabase/auth";

const schema=z.object({productId:z.string().uuid(),role:z.enum(["product","card","hero","mood","social"]),path:z.string().trim().max(500).optional().default(""),alt:z.string().trim().min(3).max(240),sortOrder:z.coerce.number().int().min(0).max(999),generated:z.boolean(),confirmMove:z.boolean()});
const safeName=(value:string)=>value.toLowerCase().replace(/[^a-z0-9.-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)||"image";

export async function POST(request:Request){
  const {supabase,user,role:adminRole}=await requireAdmin();if(adminRole!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});
  const form=await request.formData(),file=form.get("file");const parsed=schema.safeParse({productId:form.get("productId"),role:form.get("role"),path:form.get("path"),alt:form.get("alt"),sortOrder:form.get("sortOrder"),generated:form.has("generated"),confirmMove:form.get("confirmMove")==="true"});if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message??"Check the media fields."},{status:400});
  const client=supabase as unknown as SupabaseClient;let path=parsed.data.path;
  if(file instanceof File&&file.size){if(file.size>8_000_000||!/^image\/(png|jpeg|webp|avif)$/.test(file.type))return NextResponse.json({message:"Use a PNG, JPEG, WebP or AVIF image under 8 MB."},{status:400});path=`admin/${parsed.data.productId}/${Date.now()}-${safeName(file.name)}`;const {error}=await client.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});if(error)return NextResponse.json({message:"Upload failed."},{status:500});}
  if(!path)return NextResponse.json({message:"Choose a file or enter an existing asset path."},{status:400});
  const {data:moved}=await client.from("product_media").select("id,product_id").eq("storage_path",path).eq("status","active").neq("product_id",parsed.data.productId);if(moved?.length&&!parsed.data.confirmMove)return NextResponse.json({message:"Confirm moving this image from its current product."},{status:409});
  const now=new Date().toISOString();if(moved?.length)await client.from("product_media").update({status:"archived",archived_at:now,updated_at:now}).in("id",moved.map(item=>item.id));
  await client.from("product_media").update({status:"archived",archived_at:now,updated_at:now}).eq("product_id",parsed.data.productId).eq("role",parsed.data.role).eq("status","active");
  const {error}=await client.from("product_media").insert({product_id:parsed.data.productId,role:parsed.data.role,storage_path:path,alt_text:parsed.data.alt,is_generated:parsed.data.generated,status:"active",sort_order:parsed.data.sortOrder});if(error)return NextResponse.json({message:"Assignment could not be saved."},{status:500});
  const {data:media}=await client.from("product_media").select("id,role,storage_path,alt_text,is_generated,status,sort_order").eq("product_id",parsed.data.productId).eq("status","active").order("sort_order");
  await client.from("audit_logs").insert({actor_id:user.id,action:"product_media.assigned",entity_type:"product",entity_id:parsed.data.productId,metadata:{role:parsed.data.role,path,generated:parsed.data.generated}});
  return NextResponse.json({message:"Media assignment saved. Previous role media was archived.",media});
}
