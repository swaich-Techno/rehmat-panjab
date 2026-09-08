import type { Product, ScentId } from "./products";

export type LayeringMode = "guide" | "build";
export type LayeringPreferences = {
  mood?: string;
  occasion?: string;
  time?: "day" | "evening" | "either";
  intensity?: "soft" | "balanced" | "rich";
  preference?: "sweet" | "musky" | "floral" | "woody" | "amber" | "warm";
  count?: number;
};
export type LayeringRequest = {
  mode: LayeringMode;
  selectedIds: ScentId[];
  preferences?: LayeringPreferences;
  followUp?: string;
  history?: string[];
};
export type LayeringRecommendation = {
  combinationName: string;
  productIds: ScentId[];
  why: string;
  applicationOrder: Array<{ productId: ScentId; guidance: string }>;
  balance: string;
  placement: string;
  expectedCharacter: string;
  strength: "Soft" | "Balanced" | "Rich";
  occasion: string;
  timing: string;
  lighterAlternative: string;
  richerAlternative: string;
  source: "ai" | "fallback";
};

const weight: Record<ScentId, number> = { musk:1, vanilla:2, "white-oud":2, "oud-rose":3, junoon:4, "red-musk":3, nazakat:2, "zara-candy":2, "deer-musk":2, saffron:4 };
const aliases: Record<string, string[]> = {
  sweet: ["sweet", "creamy", "cosy", "vanilla"], musky: ["musky", "soft", "comforting", "intimate"],
  floral: ["floral", "rose", "romantic", "expressive"], woody: ["woody", "oud", "grounded", "sophisticated"],
  amber: ["amber", "warm", "rich", "golden"], warm: ["warm", "inviting", "comforting", "rich"],
};

function searchable(product: Product) {
  return `${product.name} ${product.atmosphere} ${product.character.join(" ")} ${product.suitableFor.join(" ")}`.toLowerCase();
}

function scoreProduct(product: Product, preferences: LayeringPreferences) {
  const words = [preferences.mood, preferences.occasion, preferences.preference, preferences.time, preferences.intensity]
    .filter(Boolean).flatMap((value) => aliases[String(value).toLowerCase()] ?? [String(value).toLowerCase()]);
  const text = searchable(product);
  return words.reduce((score, word) => score + (text.includes(word) ? 3 : 0), 0) + (product.id === "musk" ? 1 : 0);
}

export function createFallbackRecommendation(input: LayeringRequest, catalogue: Product[]): LayeringRecommendation {
  const available = catalogue.filter((product) => product.status === "active");
  const requested = input.selectedIds.map((id) => available.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
  const desiredCount = Math.max(input.mode === "build" ? 2 : 1, Math.min(5, input.preferences?.count ?? (input.mode === "build" ? requested.length : 2)));
  let chosen = input.mode === "build" && requested.length
    ? requested
    : [...available].sort((a, b) => scoreProduct(b, input.preferences ?? {}) - scoreProduct(a, input.preferences ?? {})).slice(0, desiredCount);
  const followUp = (input.followUp ?? "").toLowerCase();
  if (followUp.includes("lighter")) chosen = [...chosen].sort((a, b) => weight[a.id] - weight[b.id]).slice(0, Math.max(1, chosen.length - 1));
  if (followUp.includes("richer") && chosen.length < Math.min(5, available.length)) {
    const addition = [...available].filter((product) => !chosen.some((item) => item.id === product.id)).sort((a, b) => weight[b.id] - weight[a.id])[0];
    if (addition) chosen = [...chosen, addition];
  }
  if (chosen.filter((product) => weight[product.id] >= 3).length > 2) {
    const lighter = available.find((product) => product.id === "musk" && !chosen.some((item) => item.id === product.id));
    chosen = [...chosen].sort((a, b) => weight[a.id] - weight[b.id]).slice(0, 3);
    if (lighter && chosen.length < 3) chosen.push(lighter);
  }
  chosen = [...new Map(chosen.map((product) => [product.id, product])).values()].slice(0, desiredCount || 2);
  const ordered = [...chosen].sort((a, b) => weight[a.id] - weight[b.id]);
  const character = [...new Set(ordered.flatMap((product) => product.character).filter((word) => word !== "Unisex"))].slice(0, 4);
  const strength: LayeringRecommendation["strength"] = ordered.reduce((sum, product) => sum + weight[product.id], 0) / Math.max(1, ordered.length) >= 3 ? "Rich" : ordered.length === 1 ? "Soft" : "Balanced";
  return {
    combinationName: `${character[0] ?? "Quiet"} ${character[1] ?? "Ritual"}`,
    productIds: ordered.map((product) => product.id),
    why: ordered.map((product) => `${product.name} contributes its approved ${product.character.slice(0, 2).join(" and ").toLowerCase()} character`).join("; ") + ".",
    applicationOrder: ordered.map((product, index) => ({ productId: product.id, guidance: `${index + 1}. Apply ${product.name} with one light touch${index ? " after the previous oil has settled" : " to clean skin"}.` })),
    balance: ordered.length > 2 ? "Begin with one light application of each; omit the richest layer if the result feels too dense." : "Begin with one light application of each fragrance.",
    placement: "Use separate nearby pulse points rather than repeatedly covering the same spot.",
    expectedCharacter: character.join(", "),
    strength,
    occasion: input.preferences?.occasion ?? (strength === "Rich" ? "Evening or a special occasion" : "Everyday wear or a quiet gathering"),
    timing: input.preferences?.time === "day" ? "Daytime; apply lightly" : input.preferences?.time === "evening" ? "Evening or cooler weather" : "Day or evening, adjusted by application count",
    lighterAlternative: `Use ${ordered[0]?.name ?? "the softest selected fragrance"} alone, or omit the final layer.`,
    richerAlternative: ordered.length < 3 ? "Add one light application of a richer active oil only after assessing the first two." : "Keep the same oils and add no more than one extra application of the final layer.",
    source: "fallback",
  };
}
