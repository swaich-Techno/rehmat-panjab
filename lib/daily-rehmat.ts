import { firstPrice, hasAvailableStock, type StorefrontProduct } from "./catalog";
import { activeFestivalRecommendation, indiaDateKey } from "./festival-calendar";
import { hasCompleteIngredientVisuals, ingredientVisualsFor } from "./fragrance-note-reveal";

export type DailyScene = { id:string; label:string; accent:string; glow:string; depth:string };
export const weekdayProfiles = [
  { terms:["soft","musk","calm","reflection","comfort"], reason:"A composed, close-wearing choice for an unhurried Sunday.", scene:{id:"sunday-stillness",label:"Still water and soft musk",accent:"#d4c6a2",glow:"#8fa894",depth:"#071711"} },
  { terms:["clean","fresh","work","citrus","refined"], reason:"A clean beginning for Monday routines and workwear.", scene:{id:"monday-light",label:"Clean light and citrus air",accent:"#d7c87d",glow:"#789b7c",depth:"#071813"} },
  { terms:["confident","spice","woody","modern","amber"], reason:"A confident Tuesday accent with enough character to stay memorable.", scene:{id:"tuesday-spice",label:"Saffron sparks and warm woods",accent:"#d7843f",glow:"#8e3e2c",depth:"#180d09"} },
  { terms:["balanced","soft","floral","everyday","smooth"], reason:"A balanced Wednesday choice for work, errands and evening plans.", scene:{id:"wednesday-bloom",label:"Balanced petals in orbit",accent:"#d9a4a5",glow:"#805b70",depth:"#160f17"} },
  { terms:["warm","amber","vanilla","elegant","dinner"], reason:"A warm Thursday edit that moves easily from daytime to dinner.", scene:{id:"thursday-amber",label:"Amber ribbons after dusk",accent:"#dda85a",glow:"#9a5b2f",depth:"#1b120a"} },
  { terms:["rich","oud","evening","rose","luxurious"], reason:"A richer Friday choice for plans, gatherings and evening wear.", scene:{id:"friday-velvet",label:"Rose velvet and oud shadow",accent:"#c77c78",glow:"#782d38",depth:"#17080d"} },
  { terms:["expressive","fruity","bold","gifting","celebration"], reason:"A more expressive Saturday fragrance for leisure, gifting or celebration.", scene:{id:"saturday-radiance",label:"Fruit, gold and celebration",accent:"#e0b355",glow:"#a94932",depth:"#160d09"} },
] satisfies Array<{terms:string[];reason:string;scene:DailyScene}>;
const hash = (value:string) => [...value].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,2166136261);
const searchable=(product:StorefrontProduct)=>[product.name,product.subtitle,product.scentFamily,product.atmosphere,...product.character,...product.suitableFor,...(product.notes?[...product.notes.top,...product.notes.heart,...product.notes.base]:[])].filter(Boolean).join(" ").toLocaleLowerCase("en-IN");

export function todaysRehmat(products: StorefrontProduct[], date = new Date()) {
  const dateKey=indiaDateKey(date), activePriced=products.filter(product=>product.status==="active"&&firstPrice(product)!==null),available=activePriced.filter(product=>hasAvailableStock(product)),orderableOrFallback=available.length?available:activePriced;
  const animated=orderableOrFallback.filter(product=>hasCompleteIngredientVisuals(product.notes,ingredientVisualsFor(product.slug,product.notes))),candidates=animated.length?animated:orderableOrFallback;
  const festival=activeFestivalRecommendation(dateKey);
  const preferred=festival?[festival.primarySlug,...festival.alternativeSlugs]:[];
  const weekdayIndex=new Date(`${dateKey}T12:00:00+05:30`).getUTCDay(),profile=weekdayProfiles[weekdayIndex];
  const ranked=candidates.map(product=>({product,score:profile.terms.reduce((score,term)=>score+(searchable(product).includes(term)?3:0),0),tie:hash(`${dateKey}:${product.slug}`)})).sort((a,b)=>b.score-a.score||a.tie-b.tie).map(item=>item.product);
  const ordered=festival?[...preferred.map(slug=>candidates.find(product=>product.slug===slug)).filter((product):product is StorefrontProduct=>Boolean(product)),...ranked.filter(product=>!preferred.includes(product.slug))]:ranked;
  const selection=[...new Map(ordered.map(product=>[product.slug,product])).values()].slice(0,3);
  const weekday=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(date);
  const scene=festival?{id:"festival-radiance",label:`${festival.name} festive glow`,accent:"#e0b355",glow:"#9d3d32",depth:"#140b08"}:profile.scene;
  return { dateKey, weekday, festival, scene, products:selection, headline:festival?.headline??`${weekday}'s Rehmat`, description:festival?.description??profile.reason };
}
