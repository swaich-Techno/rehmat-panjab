export type ScentId = "musk" | "vanilla" | "saffron" | "white-oud" | "oud-rose";

export type Product = {
  id: ScentId;
  number: string;
  name: string;
  slug: string;
  subtitle: string;
  atmosphere: string;
  description: string;
  character: string[];
  suitableFor: string[];
  color: string;
  image: string;
  status: "active";
  enabledSizes: number[];
  prices: Record<number, number>;
};

export const products: Product[] = [
  {
    id: "musk",
    number: "01",
    name: "Musk Rizali",
    slug: "musk-rizali",
    subtitle: "Luminous musk / quiet woods",
    atmosphere: "A soft and elegant musk fragrance with a warm, comforting character designed for effortless everyday wear.",
    description: "Musk Rizali opens with a gentle sense of freshness before settling into a soft, warm and comforting musky character. Its smooth composition feels clean and composed, creating a fragrance that remains elegant without becoming overpowering.\n\nAs it develops on the skin, the fragrance becomes warmer and more intimate. The soft musky character is supported by a refined sense of depth, giving Musk Rizali a balanced presence suitable for both everyday routines and meaningful occasions.\n\nDesigned for effortless wear, Musk Rizali works well during the day or evening. It can accompany work, social gatherings, celebrations, prayer or quiet personal moments. Its understated personality makes it a versatile choice for anyone who appreciates fragrances that feel graceful, comforting and quietly confident.",
    character: ["Clean", "Warm", "Soft", "Refined", "Comforting", "Intimate", "Unisex"],
    suitableFor: ["Everyday wear", "Work and professional settings", "Evening gatherings", "Weddings and celebrations", "Personal reflection", "Gifting"],
    color: "#b7c6b1",
    image: "/images/products/musk-rizali.webp",
    status: "active",
    enabledSizes: [6, 12],
    prices: { 6: 49900, 12: 79900 },
  },
  {
    id: "vanilla",
    number: "02",
    name: "Vanilla Musk",
    slug: "vanilla-musk",
    subtitle: "Creamy warmth / velvet musk",
    atmosphere: "A smooth and comforting fragrance that brings creamy vanilla together with soft musk for a warm and inviting experience.",
    description: "Vanilla Musk is a warm and comforting fragrance built around the familiar sweetness of vanilla and the softness of musk. The opening feels smooth and inviting, introducing a creamy sweetness that is noticeable without feeling sharp or excessively heavy.\n\nAs the fragrance settles, the vanilla becomes softer and blends into a clean musky character. This creates a cosy and balanced impression that stays close to the wearer while maintaining enough warmth to feel distinctive.\n\nVanilla Musk is designed for relaxed everyday wear, quiet evenings and cooler weather. Its approachable sweetness also makes it suitable for gifting or for anyone beginning to explore concentrated fragrance oils.",
    character: ["Creamy", "Sweet", "Warm", "Musky", "Cosy", "Inviting", "Unisex"],
    suitableFor: ["Everyday wear", "Relaxed evenings", "Cooler weather", "Casual gatherings", "Layering", "Gifting"],
    color: "#d8b47a",
    image: "/images/products/vanilla-musk.webp",
    status: "active",
    enabledSizes: [6, 12],
    prices: { 6: 59900, 12: 85000 },
  },
  {
    id: "saffron",
    number: "03",
    name: "Saffron Amber Oud",
    slug: "saffron-amber-oud",
    subtitle: "Spiced amber / resinous woods",
    atmosphere: "A rich and expressive fragrance combining the warmth of saffron and amber with the depth and presence of oud.",
    description: "Saffron Amber Oud is a rich fragrance created for those who enjoy warmth, depth and a more expressive presence. Its opening introduces the distinctive warmth of saffron, setting a refined and luxurious tone from the first application.\n\nThe fragrance develops into a deep amber character that brings smoothness and warmth to the composition. Oud gives the fragrance its darker woody foundation, creating contrast and helping the scent feel structured and confident.\n\nDesigned for evenings, celebrations and special occasions, Saffron Amber Oud has a bold personality without losing its sense of balance. It is especially suited to cooler weather and moments when a richer fragrance feels appropriate.",
    character: ["Warm", "Woody", "Rich", "Bold", "Luxurious", "Expressive", "Unisex"],
    suitableFor: ["Evening wear", "Special occasions", "Weddings and celebrations", "Formal gatherings", "Cooler weather", "Gifting"],
    color: "#9b551f",
    image: "/images/products/saffron-amber-oud.webp",
    status: "active",
    enabledSizes: [6, 12],
    prices: { 6: 79900, 12: 119900 },
  },
  {
    id: "white-oud",
    number: "04",
    name: "White Oud",
    slug: "white-oud",
    subtitle: "Bright glass / quiet woods",
    atmosphere: "A refined interpretation of oud with a smoother, cleaner and more approachable woody character.",
    description: "White Oud offers a smoother and cleaner interpretation of the depth traditionally associated with oud. It begins with a composed woody impression that feels refined, balanced and approachable.\n\nAs it settles, the fragrance develops a soft depth while maintaining its clean character. The result is sophisticated without feeling excessively dark or heavy, making White Oud easier to wear throughout the day.\n\nIts balanced profile makes it suitable for professional settings, formal occasions, evening gatherings and everyday use. White Oud is intended for customers who appreciate woody fragrances but prefer a softer and more restrained presentation.",
    character: ["Clean", "Woody", "Smooth", "Balanced", "Sophisticated", "Refined", "Unisex"],
    suitableFor: ["Everyday wear", "Work and professional settings", "Formal occasions", "Evening gatherings", "Layering", "Gifting"],
    color: "#d8d4bd",
    image: "/images/products/white-oud.webp",
    status: "active",
    enabledSizes: [6, 12],
    prices: { 6: 59900, 12: 85000 },
  },
  {
    id: "oud-rose",
    number: "05",
    name: "Oud Rose",
    slug: "oud-rose",
    subtitle: "Rose haze / amber woods",
    atmosphere: "A graceful meeting of expressive rose and deep oud, creating a warm floral-woody fragrance with elegance and presence.",
    description: "Oud Rose brings together the expressive character of rose and the depth of oud. The fragrance opens with a noticeable floral presence that feels graceful and confident rather than overly delicate.\n\nAs it develops, the deeper woody character of oud begins to support the rose. This creates a balanced contrast between floral brightness and warm depth, giving the fragrance an elegant and memorable personality.\n\nOud Rose is well suited to evenings, weddings, celebrations and special occasions. Its floral-woody character also makes it a thoughtful gift for customers looking for something expressive, warm and refined.",
    character: ["Floral", "Woody", "Warm", "Elegant", "Expressive", "Refined", "Unisex"],
    suitableFor: ["Evening wear", "Weddings", "Celebrations", "Special occasions", "Layering", "Gifting"],
    color: "#9f5258",
    image: "/images/products/oud-rose.webp",
    status: "active",
    enabledSizes: [6, 12],
    prices: { 6: 69900, 12: 109900 },
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function statusLabel() { return "Available"; }
