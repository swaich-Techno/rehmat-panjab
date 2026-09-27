import { firstPrice, hasAvailableStock, type StorefrontProduct } from "./catalog";
import { activeFestivalRecommendation, indiaDateKey } from "./festival-calendar";
import { hasCompleteIngredientVisuals, ingredientVisualsFor } from "./fragrance-note-reveal";

const weekdayProfiles = [
  { terms:["soft","musk","calm","reflection","comfort"], reason:"A composed, close-wearing choice for an unhurried Sunday." },
  { terms:["clean","fresh","work","citrus","refined"], reason:"A clean beginning for Monday routines and workwear." },
  { terms:["confident","spice","woody","modern","amber"], reason:"A confident Tuesday accent with enough character to stay memorable." },
  { terms:["balanced","soft","floral","everyday","smooth"], reason:"A balanced Wednesday choice for work, errands and evening plans." },
  { terms:["warm","amber","vanilla","elegant","dinner"], reason:"A warm Thursday edit that moves easily from daytime to dinner." },
  { terms:["rich","oud","evening","rose","luxurious"], reason:"A richer Friday choice for plans, gatherings and evening wear." },
  { terms:["expressive","fruity","bold","gifting","celebration"], reason:"A more expressive Saturday fragrance for leisure, gifting or celebration." },
];
const hash = (value:string) => [...value].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,2166136261);
const searchable=(product:StorefrontProduct)=>[product.name,product.subtitle,product.scentFamily,product.atmosphere,...product.character,...product.suitableFor,...(product.notes?[...product.notes.top,...product.notes.heart,...product.notes.base]:[])].filter(Boolean).join(" ").toLocaleLowerCase("en-IN");

export function todaysRehmat(products: StorefrontProduct[], date = new Date()) {
  const dateKey=indiaDateKey(date), available=products.filter(product=>product.status==="active"&&hasAvailableStock(product)&&firstPrice(product)!==null);
  const animated=available.filter(product=>hasCompleteIngredientVisuals(product.notes,ingredientVisualsFor(product.slug,product.notes))),candidates=animated.length?animated:available;
  const festival=activeFestivalRecommendation(dateKey);
  const preferred=festival?[festival.primarySlug,...festival.alternativeSlugs]:[];
  const weekdayIndex=new Date(`${dateKey}T12:00:00+05:30`).getUTCDay(),profile=weekdayProfiles[weekdayIndex];
  const ranked=candidates.map(product=>({product,score:profile.terms.reduce((score,term)=>score+(searchable(product).includes(term)?3:0),0),tie:hash(`${dateKey}:${product.slug}`)})).sort((a,b)=>b.score-a.score||a.tie-b.tie).map(item=>item.product);
  const ordered=festival?[...preferred.map(slug=>candidates.find(product=>product.slug===slug)).filter((product):product is StorefrontProduct=>Boolean(product)),...ranked.filter(product=>!preferred.includes(product.slug))]:ranked;
  const selection=[...new Map(ordered.map(product=>[product.slug,product])).values()].slice(0,3);
  const weekday=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(date);
  return { dateKey, weekday, festival, products:selection, headline:festival?.headline??`${weekday}'s Rehmat`, description:festival?.description??profile.reason };
}
