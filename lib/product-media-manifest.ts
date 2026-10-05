export type ProductMediaRole = "product" | "card" | "hero" | "mood" | "social";

type ProductMediaSet = {
  product: string;
  card: string;
  hero: string;
  mood: string;
  social: string;
  alt: string;
  generated: true;
};

const bottle = (slug: string, name: string): ProductMediaSet => ({
  product: "/images/bottles/rose-gold-bottle-oil-cutout.webp",
  card: "/images/bottles/rose-gold-bottle-oil-cutout.webp",
  hero: "/images/bottles/rose-gold-bottle-oil-cutout.webp",
  mood: `/images/products/campaign/${slug}-mood.webp`,
  social: "/images/bottles/rose-gold-bottle-social.webp",
  alt: `${name} perfume oil by Rehmat Panjab`,
  generated: true,
});

/** Exact-slug media ownership. Never infer media from display order or a partial name. */
export const PRODUCT_MEDIA_MANIFEST = {
  "musk-rizali": bottle("musk-rizali", "Musk Rizali"),
  "vanilla-musk": bottle("vanilla-musk", "Vanilla Musk"),
  "white-oud": bottle("white-oud", "White Oud"),
  "oud-rose": bottle("oud-rose", "Oud Rose"),
  junoon: bottle("junoon", "Oud Maracuja"),
  "red-musk": bottle("red-musk", "Red Musk"),
  nazakat: bottle("nazakat", "Delina"),
  gulnaar: {...bottle("gulnaar", "Zara Candy"),mood:"/images/bottles/rose-gold-bottle-oil-cutout.webp"},
  "deer-musk": bottle("deer-musk", "Deer Musk"),
  afsoon: bottle("afsoon", "Vampire Blood"),
} as const;

export type ProductMediaSlug = keyof typeof PRODUCT_MEDIA_MANIFEST;

export function mediaForSlug(slug: string) {
  return PRODUCT_MEDIA_MANIFEST[slug as ProductMediaSlug] ?? null;
}
