import { getSupabaseConfig } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import { products as editorialProducts } from "./products";
import type { CatalogStatus, StorefrontProduct } from "./catalog";
import { COMMERCE_ENABLED } from "./commerce";

type CatalogRow = {
  id: string;
  product_number: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  short_description: string;
  scent_family: string | null;
  status: CatalogStatus;
  scent_profile: Record<string, unknown> | null;
  image_path: string | null;
  campaign_image_path: string | null;
  featured: boolean;
  created_at: string;
  product_variants?: Array<{
    id: string;
    size_ml: number | string;
    sku: string;
    price_paise: number | null;
    enabled: boolean;
    inventory?: { quantity: number; reserved: number } | Array<{ quantity: number; reserved: number }> | null;
  }>;
};

function fallbackCatalogue(): StorefrontProduct[] {
  return editorialProducts.map((product) => ({
    ...product,
    databaseId: null,
    description: product.atmosphere,
    scentFamily: null,
    imageAlt: `${product.name} perfume oil bottle in its campaign setting`,
    featured: false,
    createdAt: null,
    variants: product.enabledSizes.map((size) => ({
      id: `preview-${product.slug}-${size}`,
      sizeMl: size,
      sku: `${product.slug}-${size}`.toUpperCase(),
      pricePaise: null,
      currency: "INR" as const,
      enabled: false,
      availableQuantity: 0,
    })),
  }));
}

function publicImage(path: string | null, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) return path;
  const config = getSupabaseConfig();
  return config ? `${config.url}/storage/v1/object/public/product-images/${path}` : fallback;
}

function mapRow(row: CatalogRow): StorefrontProduct {
  const editorial = editorialProducts.find((product) => product.slug === row.slug);
  const profileCharacter = row.scent_profile?.character;
  const character = Array.isArray(profileCharacter) && profileCharacter.every((item) => typeof item === "string")
    ? profileCharacter
    : editorial?.character ?? [];
  const variants = (row.product_variants ?? []).map((variant) => {
    const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    return {
      id: variant.id,
      sizeMl: Number(variant.size_ml),
      sku: COMMERCE_ENABLED ? variant.sku : "",
      pricePaise: COMMERCE_ENABLED ? variant.price_paise : null,
      currency: "INR" as const,
      enabled: variant.enabled,
      availableQuantity: Math.max(0, (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)),
    };
  }).filter((variant) => variant.enabled).sort((a, b) => a.sizeMl - b.sizeMl);

  return {
    id: editorial?.id ?? row.slug,
    databaseId: row.id,
    number: row.product_number,
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle,
    atmosphere: row.short_description || row.description || editorial?.atmosphere || "",
    description: row.description || row.short_description || editorial?.atmosphere || "",
    scentFamily: row.scent_family,
    character,
    color: editorial?.color ?? "#c7b58f",
    image: publicImage(row.campaign_image_path || row.image_path, editorial?.image ?? "/images/hero/rehmat-panjab-homepage-hero.webp"),
    imageAlt: `${row.name} perfume oil bottle in its campaign setting`,
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
    .select("id,product_number,name,slug,subtitle,description,short_description,scent_family,status,scent_profile,image_path,campaign_image_path,featured,created_at,product_variants(id,size_ml,sku,price_paise,enabled,inventory(quantity,reserved))")
    .in("status", ["coming_soon", "active", "sold_out"])
    .order("product_number");
  if (error) throw new Error("The public catalogue could not be loaded.");
  return ((data ?? []) as unknown as CatalogRow[]).map(mapRow);
}

export async function getStorefrontProduct(slug: string) {
  return (await getStorefrontProducts()).find((product) => product.slug === slug);
}
