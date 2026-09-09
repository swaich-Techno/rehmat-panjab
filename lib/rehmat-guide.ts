import type { StorefrontProduct } from "./catalog";

export type GuideProduct = Pick<StorefrontProduct,"slug"|"name"|"inspirationLine"|"image"|"imageAlt"|"notes"|"suitability"|"suitabilityNote"|"character"|"atmosphere"> & {
  reason: string;
  variants: Array<{ sizeMl: number; pricePaise: number; availableQuantity: number }>;
};

export type GuideReply = { message: string; products: GuideProduct[]; layering: boolean; source: "deterministic" };

const numbers: Record<string,number> = { one:1,two:2,three:3,four:4,five:5 };
const vocabulary: Record<string,string[]> = {
  soft:["soft","gentle","quiet","work","office","light"], rich:["rich","deep","bold","evening","night","wedding","statement"],
  sweet:["sweet","vanilla","candy","comfort"], musky:["musk","musky","clean"], floral:["floral","rose","feminine","wife","woman"],
  woody:["wood","woody","oud","earth","natural"], fruity:["fruit","fruity","berry","berries","cherry","plum","lychee","pear","strawberry","passionfruit"],
};

export function sanitizeGuideInput(value: unknown) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,360);
}

function searchable(product: StorefrontProduct) {
  return [product.name,product.inspirationLine,product.atmosphere,product.summary,product.description,product.scentFamily,...product.character,...product.suitableFor,...(product.notes ? [...product.notes.top,...product.notes.heart,...product.notes.base] : [])].filter(Boolean).join(" ").toLowerCase();
}

function available(product: StorefrontProduct, size?: number, budget?: number) {
  return product.variants.filter(v=>v.enabled&&v.availableQuantity>0&&v.pricePaise!==null&&(!size||v.sizeMl===size)&&(!budget||(v.pricePaise??Infinity)<=budget*100));
}

export function createGuideReply(input: unknown, catalogue: StorefrontProduct[], options?: { excluded?: string[]; allowed?: string[]; max?: number }): GuideReply {
  const query=sanitizeGuideInput(input).toLowerCase();
  const excluded=new Set(["saffron-amber-oud",...(options?.excluded??[])]);
  let pool=catalogue.filter(p=>p.status==="active"&&!excluded.has(p.slug)&&(options?.allowed?.length?options.allowed.includes(p.slug):true));
  const budget=Number(query.match(/(?:under|below|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})/i)?.[1]??0)||undefined;
  const size=Number(query.match(/\b(6|12)\s*ml\b/i)?.[1]??0)||undefined;
  const feminine=/\b(wife|woman|women|feminine|her)\b/.test(query); const masculine=/\b(husband|man|men|masculine|him)\b/.test(query);
  if(feminine) pool=pool.filter(p=>p.suitability!=="men"); if(masculine) pool=pool.filter(p=>p.suitability!=="women");
  pool=pool.filter(p=>available(p,size,budget).length>0);
  const named=pool.filter(p=>query.includes(p.name.toLowerCase())||p.searchAliases.some(a=>query.includes(a.toLowerCase())));
  const wantsLayer=/\blayer|combination|combine\b/.test(query); const wantsCompare=/\bcompare|difference|versus|\bvs\b/.test(query);
  const countHint=query.match(/\b([1-5])\b/)?.[1]??Object.entries(numbers).find(([word])=>query.includes(word))?.[1]??(wantsCompare?2:wantsLayer?3:options?.max??3);
  const requestedCount=Math.max(1,Math.min(5,Number(countHint)));
  const scored=pool.map(product=>{const text=searchable(product); let score=named.includes(product)?50:0; for(const words of Object.values(vocabulary)) for(const word of words) if(query.includes(word)&&text.includes(word)) score+=3; if(/work|day|office/.test(query)&&/work|daily|day|soft|clean/.test(text))score+=2; if(/wedding|evening|night/.test(query)&&/wedding|evening|rich|deep|statement/.test(text))score+=2; return {product,score};}).sort((a,b)=>b.score-a.score||a.product.number.localeCompare(b.product.number));
  const selected=(named.length>=2&&wantsCompare?named:scored.map(x=>x.product)).slice(0,Math.min(requestedCount,options?.max??5));
  const products=selected.map(product=>{
    const variants=available(product,size,budget).map(v=>({sizeMl:v.sizeMl,pricePaise:v.pricePaise!,availableQuantity:v.availableQuantity}));
    const matched=product.character.find(tag=>query.includes(tag.toLowerCase()))??product.character[0]??"considered";
    return {...product,reason:`A ${matched.toLowerCase()} match grounded in its approved profile: ${product.atmosphere}`,variants};
  });
  if(!query) return {message:"Tell me the mood, occasion, intensity or budget you have in mind.",products:[],layering:false,source:"deterministic"};
  if(!products.length) return {message:"I couldn’t find an available match for those details. Try a different budget, size or mood.",products:[],layering:wantsLayer,source:"deterministic"};
  if(/last|longer|longevity|hours/.test(query)) return {message:"Performance varies by skin, climate and application. There is no approved hours-of-longevity claim, so I won’t invent one. Here are the closest profile matches.",products,layering:false,source:"deterministic"};
  if(wantsLayer) return {message:`Here is a ${products.length}-oil combination using currently available fragrances. The profiles complement one another; no ratio or application order is claimed because none is approved.`,products,layering:true,source:"deterministic"};
  if(wantsCompare) return {message:"Here is a grounded comparison using the approved profiles and live availability.",products,layering:false,source:"deterministic"};
  return {message:products.length===1?"This is the strongest current match.":"These are the strongest current matches.",products,layering:false,source:"deterministic"};
}
