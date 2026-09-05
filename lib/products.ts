export type ScentId = "musk" | "vanilla" | "saffron" | "white-oud" | "oud-rose";

export type Product = {
  id: ScentId;
  number: string;
  name: string;
  slug: string;
  subtitle: string;
  atmosphere: string;
  character: string[];
  color: string;
  image: string;
  status: "coming_soon";
  enabledSizes: number[];
};

export const products: Product[] = [
  {
    id: "musk",
    number: "01",
    name: "Musk Rizali",
    slug: "musk-rizali",
    subtitle: "Luminous musk / quiet woods",
    atmosphere: "Clear light, softened edges, the warmth of skin after dusk.",
    character: ["Clean", "Soft", "Intimate"],
    color: "#b7c6b1",
    image: "/images/products/musk-rizali.webp",
    status: "coming_soon",
    enabledSizes: [6, 12],
  },
  {
    id: "vanilla",
    number: "02",
    name: "Vanilla Musk",
    slug: "vanilla-musk",
    subtitle: "Creamy warmth / velvet musk",
    atmosphere: "A slow amber glow with a soft, comforting finish.",
    character: ["Warm", "Creamy", "Close"],
    color: "#d8b47a",
    image: "/images/products/vanilla-musk.webp",
    status: "coming_soon",
    enabledSizes: [6, 12],
  },
  {
    id: "saffron",
    number: "03",
    name: "Saffron Amber Oud",
    slug: "saffron-amber-oud",
    subtitle: "Spiced amber / resinous woods",
    atmosphere: "Dense golden warmth moving through a dark, polished room.",
    character: ["Golden", "Deep", "Evening"],
    color: "#9b551f",
    image: "/images/products/saffron-amber-oud.webp",
    status: "coming_soon",
    enabledSizes: [6, 12],
  },
  {
    id: "white-oud",
    number: "04",
    name: "White Oud",
    slug: "white-oud",
    subtitle: "Bright glass / quiet woods",
    atmosphere: "Cool light passing through pale wood and clean glass.",
    character: ["Bright", "Dry", "Grounded"],
    color: "#d8d4bd",
    image: "/images/products/white-oud.webp",
    status: "coming_soon",
    enabledSizes: [6, 12],
  },
  {
    id: "oud-rose",
    number: "05",
    name: "Oud Rose",
    slug: "oud-rose",
    subtitle: "Rose haze / amber woods",
    atmosphere: "A deep rose diffusion settling into shadowed warmth.",
    character: ["Floral", "Velvety", "Deep"],
    color: "#9f5258",
    image: "/images/products/oud-rose.webp",
    status: "coming_soon",
    enabledSizes: [6, 12],
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function statusLabel(status: Product["status"]) {
  return status === "coming_soon" ? "Launching soon" : status;
}
