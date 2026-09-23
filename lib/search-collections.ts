import type {StorefrontProduct} from "./catalog";

export type SearchCollection={slug:string;name:string;title:string;description:string;intro:string;keywords:string[]};

export const searchCollections:SearchCollection[]=[
  {slug:"attar-perfume-oils",name:"Attar & Perfume Oils",title:"Attar & Perfume Oils Online in India",description:"Explore Rehmat Panjab concentrated attar and perfume oils in available 6 ml and 12 ml sizes, with delivery across India.",intro:"Discover concentrated perfume oils for close-to-skin wear, gifting and personal fragrance rituals.",keywords:[]},
  {slug:"oud-perfume-oils",name:"Oud Perfume Oils",title:"Oud Perfume Oils & Oud Attar",description:"Explore woody oud perfume oils and oud attar styles from Rehmat Panjab, with verified notes, sizes and current INR prices.",intro:"Deep woods, rose, amber and spice shape these oud-led perfume oils.",keywords:["oud","wood"]},
  {slug:"musk-perfume-oils",name:"Musk Perfume Oils",title:"Musk Perfume Oils",description:"Explore soft, clean, warm and richly textured musk perfume oils from Rehmat Panjab, available for India delivery.",intro:"Musk can feel clean, velvety, warm or quietly sensual depending on its supporting notes.",keywords:["musk"]},
  {slug:"floral-perfume-oils",name:"Floral Perfume Oils",title:"Floral Perfume Oils",description:"Explore floral perfume oils featuring rose, jasmine and other flower-led profiles, with verified notes and available sizes.",intro:"Floral perfume oils range from luminous petals to deeper rose-and-wood compositions.",keywords:["floral","rose","jasmine","flower","petal"]},
  {slug:"fruity-perfume-oils",name:"Fruity Perfume Oils",title:"Fruity Perfume Oils",description:"Explore fruity perfume oils with berry, cherry, pear, lychee, citrus and tropical note profiles from Rehmat Panjab.",intro:"Bright fruit notes can open into musk, florals, woods, amber or gourmand warmth.",keywords:["fruit","berry","berries","cherry","pear","lychee","raspberry","strawberry","bergamot","passionfruit","plum"]},
  {slug:"unisex-perfume-oils",name:"Unisex Perfume Oils",title:"Unisex Attar & Perfume Oils",description:"Explore unisex concentrated perfume oils selected by notes, mood and occasion rather than rigid fragrance rules.",intro:"Choose by the notes and atmosphere you enjoy; fragrance preference is personal.",keywords:[]},
  {slug:"perfume-oil-gifts",name:"Perfume-Oil Gifts",title:"Perfume-Oil Gifts in India",description:"Explore concentrated perfume-oil gifts in available sizes from Rehmat Panjab, with current prices and India delivery guidance.",intro:"Compact perfume oils make considered gifts when chosen around the recipient’s preferred notes and mood.",keywords:[]},
];

export function productsForSearchCollection(collection:SearchCollection,products:StorefrontProduct[]){
  const active=products.filter(product=>product.status==="active");
  if(collection.slug==="attar-perfume-oils")return active;
  if(collection.slug==="unisex-perfume-oils")return active.filter(product=>product.suitability==="unisex");
  if(collection.slug==="perfume-oil-gifts")return active.filter(product=>product.suitableFor.some(value=>/gift/i.test(value))||product.variants.some(variant=>variant.enabled&&variant.pricePaise!==null));
  return active.filter(product=>{
    const noteText=product.notes?[...product.notes.top,...product.notes.heart,...product.notes.base].join(" "):"";
    const text=[product.name,product.subtitle,product.scentFamily??"",...product.character,noteText].join(" ").toLowerCase();
    return collection.keywords.some(keyword=>text.includes(keyword));
  });
}

export function searchCollectionsForProduct(product:StorefrontProduct){
  return searchCollections.filter(collection=>productsForSearchCollection(collection,[product]).length>0);
}
