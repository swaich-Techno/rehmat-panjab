import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "../../../../../lib/supabase/auth";
import {diagnoseFragranceAi,fragranceAiConfig,providerReady} from "../../../../../lib/fragrance-ai";
import {classifyGuideIntent,createGuideReply,redactPersonalData} from "../../../../../lib/rehmat-guide";
import {getStorefrontProducts} from "../../../../../lib/storefront";

const schema=z.object({message:z.string().trim().min(1).max(360)}).strict();
export async function POST(request:Request){const {role}=await requireAdmin();if(role!=="super_admin")return NextResponse.json({message:"Super-admin access required."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Provide one short diagnostic question."},{status:400});const redacted=redactPersonalData(parsed.data.message),products=await getStorefrontProducts(),fallback=createGuideReply(redacted,products),provider=await diagnoseFragranceAi(),config=fragranceAiConfig();return NextResponse.json({activeProvider:config.provider,configuredModel:config.model,providerReachable:provider.reachable,generativeModeEnabled:config.enabled,deterministicFallbackUsed:!providerReady(),intentClassification:classifyGuideIntent(redacted),groundedProductCandidates:fallback.products.length,generalKnowledgeRetrievalUsed:fallback.source==="knowledge",redactedErrorCategory:provider.errorCategory});}
