import { COMMERCE_ENABLED } from "./commerce";

export type CatalogStatus = "coming_soon" | "active" | "sold_out";

export type CatalogVariant = {
  id: string;
  sizeMl: number;
  sku: string;
  pricePaise: number | null;
  normalPricePaise?: number | null;
  promotionalLabel?: string | null;
  currency: "INR";
  enabled: boolean;
  availableQuantity: number;
  lowStockThreshold: number;
  bottle?: null | { id:string; name:string; publicLabel:string|null; shortDescription:string|null; photo:string|null; thumbnail:string|null; altText:string|null; applicatorType:string|null; displayOrder:number };
};

export type StorefrontProduct = {
  id: string;
  databaseId: string | null;
  number: string;
  name: string;
  slug: string;
  subtitle: string;
  atmosphere: string;
  microDescription: string;
  summary: string;
  description: string;
  inspirationLine?: string;
  searchAliases: string[];
  suitableFor: string[];
  suitability: "unisex" | "men" | "women";
  suitabilityNote: string | null;
  positioning: string | null;
  notes: { top: string[]; heart: string[]; base: string[] } | null;
  journey: { opening: string; heart: string; drydown: string } | null;
  reviewsEnabled: boolean;
  scentFamily: string | null;
  character: string[];
  color: string;
  image: string;
  imageAlt: string;
  imageKind: "product" | "campaign" | "placeholder";
  heroImage: string;
  moodImage: string;
  socialImage: string;
  imagePending: boolean;
  campaignImage: string | null;
  campaignImageAlt: string | null;
  status: CatalogStatus;
  featured: boolean;
  createdAt: string | null;
  variants: CatalogVariant[];
  enabledSizes: number[];
};

export const suitabilityLabels = { unisex: "Unisex", men: "For Men", women: "For Women" } as const;

export function firstPrice(product: StorefrontProduct) {
  return product.variants
    .filter((variant) => variant.pricePaise !== null)
    .sort((a, b) => (a.pricePaise ?? 0) - (b.pricePaise ?? 0))[0]?.pricePaise ?? null;
}

export function isPurchasable(product: StorefrontProduct, variant: CatalogVariant) {
  return COMMERCE_ENABLED && product.status === "active" && variant.enabled && variant.pricePaise !== null && variant.availableQuantity > 0;
}

export function hasAvailableStock(product: StorefrontProduct) {
  return product.status === "active" && product.variants.some((variant) => variant.enabled && variant.availableQuantity > 0);
}

export function availabilityLabel(product: StorefrontProduct) {
  if (product.status === "coming_soon") return "Launching soon";
  return hasAvailableStock(product) ? "Available" : "Currently unavailable";
}
