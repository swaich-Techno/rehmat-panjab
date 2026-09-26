import { roundPaiseToWholeRupee } from "./cart";

export const TESTER_PACK_SIZES = [2, 3, 5] as const;
export type TesterPackSize = (typeof TESTER_PACK_SIZES)[number];

export type ApprovedTester = {
  slug: string;
  name: string;
  sku: string;
  pricePaise: number;
  inspirationLine?: string;
};

export const APPROVED_TESTERS: ApprovedTester[] = [
  { slug: "musk-rizali", name: "Musk Rizali", sku: "RP-MR-03", pricePaise: 24900 },
  { slug: "vanilla-musk", name: "Vanilla Musk", sku: "RP-VM-03", pricePaise: 29900 },
  { slug: "white-oud", name: "White Oud", sku: "RP-WO-03", pricePaise: 29900 },
  { slug: "oud-rose", name: "Oud Rose", sku: "RP-OR-03", pricePaise: 34900 },
  { slug: "junoon", name: "Junoon", sku: "RP-JN-03", pricePaise: 34900, inspirationLine: "Inspired by Oud Maracujá" },
  { slug: "red-musk", name: "Red Musk", sku: "RP-RM-03", pricePaise: 29900 },
  { slug: "nazakat", name: "Nazakat", sku: "RP-NZ-03", pricePaise: 29900, inspirationLine: "Inspired by Delina" },
  { slug: "gulnaar", name: "Gulnaar", sku: "RP-GL-03", pricePaise: 29900, inspirationLine: "Inspired by Zara Candy" },
  { slug: "deer-musk", name: "Deer Musk", sku: "RP-DM-03", pricePaise: 34900 },
  { slug: "afsoon", name: "Afsoon", sku: "RP-AF-03", pricePaise: 29900, inspirationLine: "Inspired by Vampire Blood" },
  { slug: "mahnoor", name: "Mon Paris–Inspired Perfume Oil", sku: "RP-MN-03", pricePaise: 24900, inspirationLine: "Inspired by Mon Paris by YSL" },
  { slug: "milaap", name: "Wisal–Inspired Perfume Oil", sku: "RP-ML-03", pricePaise: 24900, inspirationLine: "Inspired by Ajmal Wisal" },
  { slug: "sukoon-oud", name: "Oud Mood–Inspired Perfume Oil", sku: "RP-SO-03", pricePaise: 29900, inspirationLine: "Inspired by Oud Mood" },
  { slug: "shaan-oud", name: "Oud for Glory–Inspired Perfume Oil", sku: "RP-SH-03", pricePaise: 34900, inspirationLine: "Inspired by Oud for Glory" },
  { slug: "samandar", name: "Acqua di Giò–Inspired Perfume Oil", sku: "RP-SD-03", pricePaise: 24900, inspirationLine: "Inspired by Acqua di Giò" },
  { slug: "neel", name: "Light Blue–Inspired Perfume Oil", sku: "RP-NL-03", pricePaise: 24900, inspirationLine: "Inspired by Light Blue" },
  { slug: "ishq", name: "Love Spell–Inspired Perfume Oil", sku: "RP-IQ-03", pricePaise: 24900, inspirationLine: "Inspired by Love Spell" },
  { slug: "siyah-oud", name: "Black Oud", sku: "RP-SY-03", pricePaise: 24900 },
  { slug: "safaa-musk", name: "Musk Al Tahara", sku: "RP-SF-03", pricePaise: 24900 },
  { slug: "adaa", name: "Bombshell–Inspired Perfume Oil", sku: "RP-AD-03", pricePaise: 24900, inspirationLine: "Inspired by Bombshell" },
];

export const LAUNCH_TESTER_SLUGS = APPROVED_TESTERS.map(({ slug }) => slug);

export const TESTER_PACK_RULES: Record<TesterPackSize, { discountPercent: number; packagingCostPaise: number }> = {
  2: { discountPercent: 5, packagingCostPaise: 3520 },
  3: { discountPercent: 8, packagingCostPaise: 4695 },
  5: { discountPercent: 12, packagingCostPaise: 7045 },
};

export function isTesterPackSize(value: number): value is TesterPackSize {
  return TESTER_PACK_SIZES.includes(value as TesterPackSize);
}

export function calculateTesterPackPrice(pricesPaise: number[], packSize: TesterPackSize) {
  if (pricesPaise.length !== packSize) throw new Error(`Choose exactly ${packSize} different fragrances.`);
  if (pricesPaise.some((price) => !Number.isSafeInteger(price) || price < 0)) throw new Error("A tester price is invalid.");
  const subtotalPaise = pricesPaise.reduce((sum, price) => sum + price, 0);
  const discountPercent = TESTER_PACK_RULES[packSize].discountPercent;
  const totalPaise = roundPaiseToWholeRupee(subtotalPaise * (100 - discountPercent) / 100);
  return { subtotalPaise, discountPercent, discountPaise: subtotalPaise - totalPaise, totalPaise };
}

export function testerPackStartingPrice(pricesPaise: number[], packSize: TesterPackSize) {
  if (pricesPaise.length < packSize) return null;
  return calculateTesterPackPrice([...pricesPaise].sort((a, b) => a - b).slice(0, packSize), packSize).totalPaise;
}

export function chooseTesterDiscount(subtotalPaise: number, packDiscountPaise: number, newCouponEligible: boolean) {
  const newCouponDiscountPaise = newCouponEligible ? Math.floor(subtotalPaise * 15 / 100) : 0;
  return newCouponDiscountPaise > packDiscountPaise
    ? { kind: "NEW" as const, discountPaise: newCouponDiscountPaise }
    : { kind: "tester-pack" as const, discountPaise: packDiscountPaise };
}

export type TesterCostInput = {
  totalOilPurchaseCostPaise: number | null;
  totalPurchasedMl: number | null;
  bottleCostPaise: number | null;
  individualBoxCostPaise: number | null;
  labelCostPaise: number | null;
  fillingSealingCostPaise: number | null;
  labourCostPaise: number | null;
  packInsertCostPaise: number | null;
  sellingPricePaise: number;
  marginApproved: boolean;
};

export function calculateTesterCosts(input: TesterCostInput) {
  const required = ["totalOilPurchaseCostPaise", "totalPurchasedMl", "bottleCostPaise", "individualBoxCostPaise", "labelCostPaise", "fillingSealingCostPaise", "labourCostPaise", "packInsertCostPaise"] as const;
  const missing = required.filter((key) => input[key] === null);
  if (missing.length || !input.totalPurchasedMl) return { missing, ready: false, costPerMlPaise: null, threeMlOilCostPaise: null, totalCogsPaise: null, grossProfitPaise: null, grossMarginPercent: null };
  const costPerMlPaise = input.totalOilPurchaseCostPaise! / input.totalPurchasedMl;
  const threeMlOilCostPaise = costPerMlPaise * 3;
  const totalCogsPaise = threeMlOilCostPaise + input.bottleCostPaise! + input.individualBoxCostPaise! + input.labelCostPaise! + input.fillingSealingCostPaise! + input.labourCostPaise! + input.packInsertCostPaise!;
  const grossProfitPaise = input.sellingPricePaise - totalCogsPaise;
  const grossMarginPercent = input.sellingPricePaise > 0 ? grossProfitPaise / input.sellingPricePaise * 100 : null;
  return { missing, ready: input.marginApproved, costPerMlPaise, threeMlOilCostPaise, totalCogsPaise, grossProfitPaise, grossMarginPercent };
}
