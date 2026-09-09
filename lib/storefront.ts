import { getSupabaseConfig } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import { products as editorialProducts } from "./products";
import type { CatalogStatus, StorefrontProduct } from "./catalog";
import { createSupabaseAdminClient } from "./supabase/admin";
import { mediaForSlug } from "./product-media-manifest";

type CatalogRow = {
  id: string;
  product_number: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  short_description: string;
  micro_description?: string | null;
  card_line?: string | null;
  inspiration_line?: string | null;
  search_aliases?: string[] | null;
  scent_family: string | null;
  status: CatalogStatus;
  scent_profile: Record<string, unknown> | null;
  image_path: string | null;
  campaign_image_path: string | null;
  featured: boolean;
  occasions: string[] | null;
  reviews_enabled: boolean;
  suitability?: "unisex" | "men" | "women" | null;
  suitability_note?: string | null;
  positioning?: string | null;
  notes?: Record<string, unknown> | null;
  image_alt_text?: string | null;
  created_at: string;
  product_media?: Array<{ role: "product" | "card" | "hero" | "mood" | "social"; storage_path: string; alt_text: string; is_generated: boolean; sort_order: number }>;
  product_variants?: Array<{
    id: string;
    size_ml: number | string;
    sku: string;
    price_paise: number | null;
    enabled: boolean;
    bottles?: { id:string; name:string; public_label:string|null; short_description:string|null; photo_path:string|null; thumbnail_path:string|null; alt_text:string|null; applicator_type:string|null; status:string; display_order:number } | Array<{ id:string; name:string; public_label:string|null; short_description:string|null; photo_path:string|null; thumbnail_path:string|null; alt_text:string|null; applicator_type:string|null; status:string; display_order:number }> | null;
    inventory?: { quantity: number; reserved: number; low_stock_threshold: number } | Array<{ quantity: number; reserved: number; low_stock_threshold: number }> | null;
  }>;
};

function fallbackCatalogue(): StorefrontProduct[] {
  return editorialProducts.map((product) => {
    const media = mediaForSlug(product.slug);
    return ({
    ...product,
    databaseId: null,
    description: product.description,
    microDescription: product.microDescription ?? product.atmosphere,
    summary: product.summary ?? product.atmosphere,
    inspirationLine: product.inspirationLine,
    searchAliases: product.searchAliases ?? [],
    suitableFor: product.suitableFor,
    suitability: product.suitability,
    suitabilityNote: product.suitabilityNote ?? null,
    positioning: product.positioning ?? null,
    notes: product.notes ?? null,
    journey: product.journey ?? null,
    reviewsEnabled: true,
    scentFamily: null,
    image: media?.card ?? product.image,
    imageAlt: media?.alt ?? product.imageAlt ?? `${product.name} perfume oil by Rehmat Panjab`,
    imageKind: media ? "campaign" as const : product.imagePending ? "placeholder" as const : "product" as const,
    heroImage: media?.hero ?? product.image,
    moodImage: media?.mood ?? product.image,
    socialImage: media?.social ?? product.image,
    imagePending: product.imagePending ?? false,
    campaignImage: product.campaignImage ?? null,
    campaignImageAlt: product.campaignImageAlt ?? null,
    featured: false,
    createdAt: null,
    variants: product.enabledSizes.map((size) => ({
      id: `preview-${product.slug}-${size}`,
      sizeMl: size,
      sku: `${product.slug}-${size}`.toUpperCase(),
      pricePaise: product.prices[size] ?? null,
      currency: "INR" as const,
      enabled: false,
      availableQuantity: 0,
      lowStockThreshold: 2,
      bottle: null,
    })),
    });
  });
}

function publicImage(path: string | null, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) return path;
  const config = getSupabaseConfig();
  return config ? `${config.url}/storage/v1/object/public/product-images/${path}` : fallback;
}

function mapRow(row: CatalogRow): StorefrontProduct {
  const editorial = editorialProducts.find((product) => product.slug === row.slug);
  const media = mediaForSlug(row.slug);
  const assigned=(role:"product"|"card"|"hero"|"mood"|"social")=>(row.product_media??[]).filter(item=>item.role===role).sort((a,b)=>a.sort_order-b.sort_order)[0];
  const genuine=assigned("product"),card=assigned("card"),hero=assigned("hero"),mood=assigned("mood"),social=assigned("social");
  const primary=genuine??card;
  const profileCharacter = row.scent_profile?.character;
  const character = Array.isArray(profileCharacter) && profileCharacter.every((item) => typeof item === "string")
    ? profileCharacter
    : editorial?.character ?? [];
  const variants = (row.product_variants ?? []).map((variant) => {
    const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    const bottleValue=Array.isArray(variant.bottles)?variant.bottles[0]:variant.bottles;
    const bottle=bottleValue?.status==="active"?{id:bottleValue.id,name:bottleValue.name,publicLabel:bottleValue.public_label,shortDescription:bottleValue.short_description,photo:bottleValue.photo_path?publicImage(bottleValue.photo_path,""):null,thumbnail:bottleValue.thumbnail_path?publicImage(bottleValue.thumbnail_path,""):null,altText:bottleValue.alt_text,applicatorType:bottleValue.applicator_type,displayOrder:bottleValue.display_order}:null;
    return {
      id: variant.id,
      sizeMl: Number(variant.size_ml),
      sku: variant.sku,
      pricePaise: variant.price_paise,
      currency: "INR" as const,
      enabled: variant.enabled,
      availableQuantity: Math.max(0, (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)),
      lowStockThreshold: inventory?.low_stock_threshold ?? 2,
      bottle,
    };
  }).filter((variant) => variant.enabled).sort((a, b) => a.sizeMl - b.sizeMl);
  const noteGroups = row.notes;
  const asStrings = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
  const notes = noteGroups ? { top: asStrings(noteGroups.top), heart: asStrings(noteGroups.heart), base: asStrings(noteGroups.base) } : editorial?.notes ?? null;
  const journeyValue = row.scent_profile?.journey;
  const journey = journeyValue && typeof journeyValue === "object" && !Array.isArray(journeyValue)
    ? journeyValue as { opening: string; heart: string; drydown: string }
    : editorial?.journey ?? null;

  return {
    id: editorial?.id ?? row.slug,
    databaseId: row.id,
    number: row.product_number,
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle,
    atmosphere: row.card_line || row.short_description || row.description || editorial?.atmosphere || "",
    microDescription: row.micro_description || editorial?.microDescription || row.short_description || "",
    summary: row.short_description || editorial?.summary || row.description || "",
    description: row.description || row.short_description || editorial?.atmosphere || "",
    inspirationLine: row.inspiration_line || editorial?.inspirationLine,
    searchAliases: Array.isArray(row.search_aliases) ? row.search_aliases : editorial?.searchAliases ?? [],
    suitableFor: Array.isArray(row.occasions) ? row.occasions : editorial?.suitableFor ?? [],
    suitability: row.suitability ?? editorial?.suitability ?? "unisex",
    suitabilityNote: row.suitability_note ?? editorial?.suitabilityNote ?? null,
    positioning: row.positioning ?? editorial?.positioning ?? null,
    notes,
    journey,
    reviewsEnabled: row.reviews_enabled,
    scentFamily: row.scent_family,
    character,
    color: editorial?.color ?? "#c7b58f",
    image: primary ? publicImage(primary.storage_path, "/images/products/product-image-pending.svg") : media?.card ?? publicImage(row.image_path, editorial?.image ?? "/images/products/product-image-pending.svg"),
    imageAlt: primary?.alt_text ?? media?.alt ?? (row.image_alt_text || editorial?.imageAlt || `${row.name} perfume oil by Rehmat Panjab`),
    imageKind: genuine ? "product" : primary?.is_generated || media ? "campaign" : row.image_path?.includes("product-image-pending") ? "placeholder" : "product",
    heroImage: genuine ? publicImage(genuine.storage_path, "/images/products/product-image-pending.svg") : hero ? publicImage(hero.storage_path, "/images/products/product-image-pending.svg") : media?.hero ?? publicImage(row.image_path, editorial?.image ?? "/images/products/product-image-pending.svg"),
    moodImage: mood ? publicImage(mood.storage_path, "/images/products/product-image-pending.svg") : media?.mood ?? publicImage(row.campaign_image_path, editorial?.campaignImage ?? "/images/products/product-image-pending.svg"),
    socialImage: social ? publicImage(social.storage_path, "/og.png") : media?.social ?? publicImage(row.campaign_image_path, editorial?.campaignImage ?? "/og.png"),
    imagePending: !media && row.image_path === "/images/products/product-image-pending.svg",
    campaignImage: mood ? publicImage(mood.storage_path, "") : media?.mood ?? (row.campaign_image_path && row.campaign_image_path !== row.image_path ? publicImage(row.campaign_image_path, "") : editorial?.campaignImage ?? null),
    campaignImageAlt: mood?.alt_text ?? media?.alt ?? editorial?.campaignImageAlt ?? (row.campaign_image_path && row.campaign_image_path !== row.image_path ? `Editorial campaign artwork for ${row.name}; not a product photograph` : null),
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
    variants,
    enabledSizes: variants.map((variant) => variant.sizeMl),
  };
}

export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackCatalogue();
  const { data, error } = await supabase
    .from("products")
    .select("id,product_number,name,slug,subtitle,description,short_description,micro_description,card_line,inspiration_line,search_aliases,scent_family,status,scent_profile,notes,occasions,suitability,suitability_note,positioning,reviews_enabled,image_path,campaign_image_path,image_alt_text,featured,created_at,product_media(role,storage_path,alt_text,is_generated,sort_order),product_variants(id,size_ml,sku,price_paise,enabled,inventory(quantity,reserved,low_stock_threshold),bottles(id,name,public_label,short_description,photo_path,thumbnail_path,alt_text,applicator_type,status,display_order))")
    .in("status", ["coming_soon", "active", "sold_out"])
    .order("product_number");
  if (error) throw new Error("The public catalogue could not be loaded.");
  const catalogue=((data ?? []) as unknown as CatalogRow[]).map(mapRow);
  const admin=createSupabaseAdminClient(); if(!admin)return catalogue;
  const now=new Date().toISOString(); const {data:discounts}=await admin.from("automatic_discounts").select("*,discount_products(product_id),discount_variants(variant_id)").eq("active",true).is("archived_at",null).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`).order("priority",{ascending:false});
  return catalogue.map(product=>({...product,variants:product.variants.map(variant=>{
    if(variant.pricePaise===null)return variant; const price=variant.pricePaise;
    const discount=(discounts??[]).find(item=>{const ps=(item.discount_products??[]).map((x:{product_id:string})=>x.product_id);const vs=(item.discount_variants??[]).map((x:{variant_id:string})=>x.variant_id);return item.minimum_quantity<=1&&item.minimum_subtotal_paise<=price&&(!ps.length||product.databaseId&&ps.includes(product.databaseId))&&(!vs.length||vs.includes(variant.id));});
    if(!discount)return variant; const raw=discount.discount_type==="percentage"?Math.floor(price*Math.min(100,discount.value)/100):discount.value; const saving=Math.min(price,discount.max_discount_paise===null?raw:Math.min(raw,discount.max_discount_paise));
    return {...variant,normalPricePaise:price,pricePaise:price-saving,promotionalLabel:discount.public_label};
  })}));
}

export async function getStorefrontProduct(slug: string) {
  return (await getStorefrontProducts()).find((product) => product.slug === slug);
}
