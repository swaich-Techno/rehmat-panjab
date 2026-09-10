import "server-only";
import {redactPersonalData,type GuideReply} from "./rehmat-guide";

type Provider="groq"|"gemini"|"openai-compatible"|"ollama";
type ProviderResponse={candidates?:Array<{content?:{parts?:Array<{text?:string}>}}> ;message?:{content?:string};choices?:Array<{message?:{content?:string}}>};
const daily=new Map<string,number>(),sessions=new Map<string,number>();
function integer(name:string,fallback:number,min:number,max:number){const value=Number(process.env[name]??fallback);return Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback;}
export function fragranceAiConfig(){const enabled=process.env.FRAGRANCE_AI_ENABLED==="true";return {enabled,provider:(process.env.FRAGRANCE_AI_PROVIDER??"openai-compatible") as Provider,baseUrl:process.env.FRAGRANCE_AI_BASE_URL??"",model:process.env.FRAGRANCE_AI_MODEL??"",apiKey:process.env.FRAGRANCE_AI_API_KEY??"",timeoutMs:integer("FRAGRANCE_AI_TIMEOUT_MS",8000,1000,20000),maxTokens:integer("FRAGRANCE_AI_MAX_TOKENS",240,64,1000),dailyLimit:integer("FRAGRANCE_AI_DAILY_LIMIT",100,1,10000)};}
export function providerReady(){const c=fragranceAiConfig();return c.enabled&&Boolean(c.baseUrl&&c.model&&(c.provider==="ollama"||c.apiKey));}
function takeAllowance(sessionId:string,limit:number){const day=new Date().toISOString().slice(0,10),used=daily.get(day)??0,sessionUsed=sessions.get(sessionId)??0;if(used>=limit||sessionUsed>=12)return false;daily.set(day,used+1);sessions.set(sessionId,sessionUsed+1);return true;}
function extract(value:ProviderResponse,provider:Provider){if(provider==="gemini")return value.candidates?.[0]?.content?.parts?.[0]?.text;if(provider==="ollama")return value.message?.content;return value.choices?.[0]?.message?.content;}

export async function rewriteGuideReply(question:unknown,fallback:GuideReply,sessionId:string){
  const config=fragranceAiConfig();if(!providerReady()||!takeAllowance(sessionId,config.dailyLimit))return fallback;
  const redacted=redactPersonalData(question),candidates=fallback.products.map(product=>({slug:product.slug,name:product.name,notes:product.notes,variants:product.variants}));
  const prompt=`Rewrite the grounded answer concisely and warmly. Do not add facts, products, notes, prices, availability, longevity, ingredients, medical claims or ordering promises. Return JSON only: {"message":"..."}. Question: ${JSON.stringify(redacted)} Grounded answer: ${JSON.stringify(fallback.message)} Verified candidates: ${JSON.stringify(candidates)}`;
  try{
    let url=config.baseUrl;const headers:Record<string,string>={"content-type":"application/json"};let body:unknown;
    if(config.provider==="gemini"){url=`${url.replace(/\/$/,"")}/models/${encodeURIComponent(config.model)}:generateContent`;headers["x-goog-api-key"]=config.apiKey;body={contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.2,maxOutputTokens:config.maxTokens,responseMimeType:"application/json"}};}
    else if(config.provider==="ollama"){url=`${url.replace(/\/$/,"")}/api/chat`;body={model:config.model,stream:false,options:{temperature:.2,num_predict:config.maxTokens},messages:[{role:"user",content:prompt}]};}
    else{headers.authorization=`Bearer ${config.apiKey}`;body={model:config.model,temperature:.2,max_tokens:config.maxTokens,response_format:{type:"json_object"},messages:[{role:"user",content:prompt}]};}
    const response=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),signal:AbortSignal.timeout(config.timeoutMs)});if(!response.ok)return fallback;
    const raw=extract(await response.json() as ProviderResponse,config.provider);if(typeof raw!=="string")return fallback;const parsed=JSON.parse(raw);if(typeof parsed.message!=="string")return fallback;const message=redactPersonalData(parsed.message);if(!message||message.length>800)return fallback;return {...fallback,message};
  }catch{return fallback;}
}
