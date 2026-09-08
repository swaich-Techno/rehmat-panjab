export type ScentId = "musk" | "vanilla" | "white-oud" | "oud-rose" | "junoon" | "red-musk" | "nazakat" | "zara-candy" | "deer-musk" | "afsoon" | "saffron";
export type Suitability = "unisex" | "men" | "women";
export type ScentJourney = { opening: string; heart: string; drydown: string };

export type Product = {
  id: ScentId;
  number: string;
  name: string;
  slug: string;
  subtitle: string;
  atmosphere: string;
  microDescription?: string;
  summary?: string;
  description: string;
  inspirationLine?: string;
  searchAliases?: string[];
  character: string[];
  suitableFor: string[];
  suitability: Suitability;
  suitabilityNote?: string;
  positioning?: string;
  notes?: { top: string[]; heart: string[]; base: string[] };
  journey?: ScentJourney;
  color: string;
  image: string;
  imageAlt?: string;
  imagePending?: boolean;
  status: "active";
  enabledSizes: number[];
  prices: Record<number, number>;
};

const commonUses = ["Everyday wear", "Evening gatherings", "Special occasions", "Gifting"];

export const products: Product[] = [
  { id:"musk",number:"01",name:"Musk Rizali",slug:"musk-rizali",subtitle:"Bergamot / saffron / white musk",atmosphere:"Pure tradition. Modern soul.",description:"Top notes: bergamot, saffron and white musk.",character:["Pure","Traditional","Modern","Musky"],suitableFor:commonUses,suitability:"unisex",color:"#b7c6b1",image:"/images/products/musk-rizali.webp",status:"active",enabledSizes:[6,12],prices:{6:49900,12:79900} },
  { id:"vanilla",number:"02",name:"Vanilla Musk",slug:"vanilla-musk",subtitle:"Vanilla bean / almond / white musk",atmosphere:"Warm vanilla. Soft musk. Pure comfort.",description:"Top notes: vanilla bean, almond and white musk.",character:["Warm","Soft","Comforting","Musky"],suitableFor:commonUses,suitability:"unisex",color:"#d8b47a",image:"/images/products/vanilla-musk.webp",status:"active",enabledSizes:[6,12],prices:{6:59900,12:84900} },
  { id:"white-oud",number:"03",name:"White Oud",slug:"white-oud",subtitle:"White pepper / bergamot / soft woods",atmosphere:"Oud, refined to its cleanest expression.",description:"Top notes: white pepper, bergamot and soft woods.",character:["Clean","Woody","Refined","Timeless"],suitableFor:commonUses,suitability:"unisex",color:"#d8d4bd",image:"/images/products/white-oud.webp",status:"active",enabledSizes:[6,12],prices:{6:59900,12:89900} },
  { id:"oud-rose",number:"04",name:"Oud Rose",slug:"oud-rose",subtitle:"Rose petals / pink pepper / raspberry",atmosphere:"Where velvet rose meets the darkness of oud.",description:"Top notes: rose petals, pink pepper and raspberry.",character:["Floral","Woody","Velvet","Expressive"],suitableFor:commonUses,suitability:"unisex",color:"#9f5258",image:"/images/products/oud-rose.webp",status:"active",enabledSizes:[6,12],prices:{6:69900,12:109900} },
  { id:"junoon",number:"05",name:"JUNOON",slug:"junoon",subtitle:"Passionfruit / Turkish rose / saffron",atmosphere:"Tropical temptation wrapped in precious oud.",description:"Top notes: passionfruit, Turkish rose and saffron.",inspirationLine:"Inspired by Oud Maracujá",searchAliases:["Oud Maracuja","Oud Maracujá"],character:["Tropical","Oud","Rose","Saffron"],suitableFor:commonUses,suitability:"unisex",color:"#762c2f",image:"/images/products/junoon.webp",status:"active",enabledSizes:[6,12],prices:{6:69900,12:109900} },
  { id:"red-musk",number:"06",name:"Red Musk",slug:"red-musk",subtitle:"Red berries / saffron / white musk",atmosphere:"A deeper, warmer side of musk.",description:"Top notes: red berries, saffron and white musk.",character:["Deep","Warm","Musky","Modern"],suitableFor:commonUses,suitability:"unisex",color:"#8c1f25",image:"/images/products/red-musk.webp",status:"active",enabledSizes:[6,12],prices:{6:59900,12:89900} },
  { id:"nazakat",number:"07",name:"NAZAKAT",slug:"nazakat",subtitle:"Lychee / rhubarb / bergamot",atmosphere:"Radiant fruit. Luxurious rose. Effortless femininity.",description:"Top notes: lychee, rhubarb and bergamot.",inspirationLine:"Inspired by Delina",searchAliases:["Delina"],character:["Radiant","Fruity","Rose","Feminine"],suitableFor:commonUses,suitability:"unisex",color:"#d8898d",image:"/images/products/nazakat.webp",status:"active",enabledSizes:[6,12],prices:{6:59900,12:84900} },
  { id:"zara-candy",number:"08",name:"Zara Candy",slug:"zara-candy",subtitle:"Candied pear / strawberry / vanilla",atmosphere:"Sweet memories, bottled.",description:"Top notes: candied pear, strawberry and vanilla.",character:["Sweet","Fruity","Vanilla","Bright"],suitableFor:commonUses,suitability:"unisex",color:"#e3a9a2",image:"/images/products/zara-candy.webp",status:"active",enabledSizes:[6,12],prices:{6:59900,12:84900} },
  { id:"deer-musk",number:"09",name:"Deer Musk",slug:"deer-musk",subtitle:"Cardamom / bergamot / velvet musk",atmosphere:"Nature. Instinct. Elegance.",description:"Top notes: cardamom, bergamot and velvet musk.",character:["Natural","Instinctive","Elegant","Musky"],suitableFor:commonUses,suitability:"unisex",color:"#8a5b2c",image:"/images/products/deer-musk.webp",status:"active",enabledSizes:[6,12],prices:{6:64900,12:94900} },
  { id:"afsoon",number:"10",name:"AFSOON",slug:"afsoon",subtitle:"Dark Cherry / Plum / Velvet Rose",atmosphere:"Dark fruit. Velvet florals. After-dark enchantment.",microDescription:"Dark cherry, ripe plum and velvet rose wrapped in warm amber and soft musk.",summary:"Afsoon is a dark, seductive fragrance built around juicy dark cherry, rich plum and velvety rose. As it develops, warm amber, soft woods and musk create a smooth, addictive drydown with a mysterious after-dark character.",description:"Afsoon means enchantment—and that is exactly the mood this fragrance is designed to create.\n\nThe opening is immediately rich and juicy, led by dark cherry and ripe plum. The fruit is deep rather than fresh, giving Afsoon a darker, almost wine-like sweetness. Velvet rose adds a luxurious floral layer and prevents the fragrance from becoming overly sugary.\n\nAs the scent settles, the fruity opening becomes warmer and smoother. A soft amber accord, subtle spice and dark florals begin to emerge, giving the composition more depth and sensuality.\n\nThe drydown is built around warm musk, smooth woods and amber, leaving behind a soft but noticeable trail. The overall effect is dark, sweet and mysterious rather than aggressive—ideal for evenings, dates and occasions where you want the fragrance to feel memorable.",inspirationLine:"Inspired by Vampire Blood",searchAliases:["Vampire Blood"],character:["Mysterious","Sweet","Seductive","Nocturnal"],suitableFor:["Evening wear","Dates","Statement occasions"],suitability:"unisex",suitabilityNote:"Slightly sensual-sweet leaning",positioning:"Evening / statement attar",notes:{top:["Dark Cherry","Plum","Velvet Rose"],heart:["Red Berries","Dark Floral Accord","Warm Saffron","Amber"],base:["Velvet Musk","Sandalwood","Vanilla","Warm Woods","Soft Amber"]},journey:{opening:"Juicy · Dark-fruity · Sweet",heart:"Floral · Warm · Sensual",drydown:"Musky · Amber · Softly woody"},color:"#4f1724",image:"/images/products/product-image-pending.svg",imageAlt:"Afsoon product photograph awaiting owner upload",imagePending:true,status:"active",enabledSizes:[6,12],prices:{6:49900,12:89900} },
];

export const productRedirects: Record<string, string> = { "oud-maracuja":"junoon", delina:"nazakat" };
export function getProduct(slug: string) { return products.find((product) => product.slug === slug); }
export function statusLabel() { return "Available"; }
