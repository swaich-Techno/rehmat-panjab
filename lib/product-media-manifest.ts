export type ProductMediaRole = "product" | "card" | "hero" | "mood" | "social";

type CampaignMedia = {
  product: null;
  card: string;
  hero: string;
  mood: string;
  social: string;
  alt: string;
  generated: true;
};

const campaign = (slug: string, name: string): CampaignMedia => ({
  product: null,
  card: `/images/products/campaign/${slug}-card.webp`,
  hero: `/images/products/campaign/${slug}-hero.webp`,
  mood: `/images/products/campaign/${slug}-mood.webp`,
  social: `/images/products/campaign/${slug}-social.webp`,
  alt: `${name} campaign artwork by Rehmat Panjab`,
  generated: true,
});

/** Exact-slug media ownership. Never infer media from display order or a partial name. */
export const PRODUCT_MEDIA_MANIFEST = {
  "musk-rizali": campaign("musk-rizali", "Musk Rizali"),
  "vanilla-musk": campaign("vanilla-musk", "Vanilla Musk"),
  "white-oud": campaign("white-oud", "White Oud"),
  "oud-rose": campaign("oud-rose", "Oud Rose"),
  junoon: campaign("junoon", "JUNOON"),
  "red-musk": campaign("red-musk", "Red Musk"),
  nazakat: campaign("nazakat", "NAZAKAT"),
  "zara-candy": campaign("zara-candy", "Zara Candy"),
  "deer-musk": campaign("deer-musk", "Deer Musk"),
  afsoon: campaign("afsoon", "AFSOON"),
} as const;

export type ProductMediaSlug = keyof typeof PRODUCT_MEDIA_MANIFEST;

export function mediaForSlug(slug: string) {
  return PRODUCT_MEDIA_MANIFEST[slug as ProductMediaSlug] ?? null;
}
