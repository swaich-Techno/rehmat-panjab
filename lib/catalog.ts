export type CatalogStatus = "coming_soon" | "active" | "sold_out";

export type CatalogVariant = {
  id: string;
  sizeMl: number;
  sku: string;
  pricePaise: number | null;
  currency: "INR";
  enabled: boolean;
  availableQuantity: number;
  lowStockThreshold: number;
};

export type StorefrontProduct = {
  id: string;
  databaseId: string | null;
  number: string;
  name: string;
  slug: string;
  subtitle: string;
  atmosphere: string;
  description: string;
  suitableFor: string[];
  reviewsEnabled: boolean;
  scentFamily: string | null;
  character: string[];
  color: string;
  image: string;
  imageAlt: string;
  status: CatalogStatus;
  featured: boolean;
  createdAt: string | null;
  variants: CatalogVariant[];
  enabledSizes: number[];
};

export function firstPrice(product: StorefrontProduct) {
  return product.variants
    .filter((variant) => variant.pricePaise !== null)
    .sort((a, b) => (a.pricePaise ?? 0) - (b.pricePaise ?? 0))[0]?.pricePaise ?? null;
}

export function isPurchasable(product: StorefrontProduct, variant: CatalogVariant) {
  return COMMERCE_ENABLED && product.status === "active" && variant.enabled && variant.pricePaise !== null && variant.availableQuantity > 0;
}

export function statusLabel(status: CatalogStatus) {
  if (status === "coming_soon") return "Launching soon";
  if (status === "sold_out") return "Sold out";
  return "Available";
}
import { COMMERCE_ENABLED } from "./commerce";
