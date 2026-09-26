import { firstPrice, hasAvailableStock, type StorefrontProduct } from "./catalog";
import { activeFestivalRecommendation, indiaDateKey } from "./festival-calendar";

const weekdayReasons = [
  "A composed, close-wearing choice for an unhurried Sunday.","A clean beginning for Monday routines and workwear.",
  "A confident midweek accent with enough character to stay memorable.","A balanced Wednesday choice for work, errands and evening plans.",
  "A warm Thursday edit that moves easily from daytime to dinner.","A richer Friday choice for plans, gatherings and evening wear.",
  "A more expressive Saturday fragrance for leisure, gifting or celebration.",
];
const hash = (value:string) => [...value].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,2166136261);

export function todaysRehmat(products: StorefrontProduct[], date = new Date()) {
  const dateKey=indiaDateKey(date), available=products.filter(product=>product.status==="active"&&hasAvailableStock(product)&&firstPrice(product)!==null);
  const festival=activeFestivalRecommendation(dateKey);
  const preferred=festival?[festival.primarySlug,...festival.alternativeSlugs]:[];
  const ordered=[...preferred.map(slug=>available.find(product=>product.slug===slug)).filter((product):product is StorefrontProduct=>Boolean(product)),...available.filter(product=>!preferred.includes(product.slug))];
  const unique=[...new Map(ordered.map(product=>[product.slug,product])).values()];
  const rotation=unique.length?hash(dateKey)%unique.length:0;
  const selection=festival?unique.slice(0,3):[...unique.slice(rotation),...unique.slice(0,rotation)].slice(0,3);
  const weekday=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(date);
  return { dateKey, weekday, festival, products:selection, headline:festival?.headline??`${weekday}'s Rehmat`, description:festival?.description??weekdayReasons[new Date(`${dateKey}T12:00:00+05:30`).getUTCDay()] };
}
