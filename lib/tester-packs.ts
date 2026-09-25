import { roundPaiseToWholeRupee } from "./cart";

export const TESTER_PACK_SIZES = [2, 3, 5] as const;
export type TesterPackSize = (typeof TESTER_PACK_SIZES)[number];

export type ApprovedTester = {
  slug: string;
  name: string;
  sku: string;
  pricePaise: number;
};

export const APPROVED_TESTERS: ApprovedTester[] = [
  { slug: "musk-rizali", name: "Musk Rizali", sku: "RP-MR-03", pricePaise: 29900 },
  { slug: "vanilla-musk", name: "Vanilla Musk", sku: "RP-VM-03", pricePaise: 34900 },
  { slug: "white-oud", name: "White Oud", sku: "RP-WO-03", pricePaise: 34900 },
  { slug: "oud-rose", name: "Oud Rose", sku: "RP-OR-03", pricePaise: 39900 },
  { slug: "junoon", name: "JUNOON", sku: "RP-JN-03", pricePaise: 39900 },
  { slug: "red-musk", name: "Red Musk", sku: "RP-RM-03", pricePaise: 34900 },
  { slug: "nazakat", name: "NAZAKAT", sku: "RP-NZ-03", pricePaise: 34900 },
  { slug: "gulnaar", name: "GULNAAR", sku: "RP-GL-03", pricePaise: 34900 },
  { slug: "deer-musk", name: "Deer Musk", sku: "RP-DM-03", pricePaise: 37900 },
  { slug: "afsoon", name: "AFSOON", sku: "RP-AF-03", pricePaise: 29900 },
  { slug: "amber-veil", name: "Amber Veil", sku: "RP-AV-03", pricePaise: 29900 },
  { slug: "velvet-oud", name: "Velvet Oud", sku: "RP-VO-03", pricePaise: 37900 },
  { slug: "purple-oud", name: "Purple Oud", sku: "RP-PO-03", pricePaise: 32900 },
  { slug: "golden-dream", name: "Golden Dream", sku: "RP-GD-03", pricePaise: 29900 },
  { slug: "dubai-chocolate", name: "Dubai Chocolate", sku: "RP-DC-03", pricePaise: 24900 },
  { slug: "mahnoor", name: "MAHNOOR", sku: "RP-MN-03", pricePaise: 24900 },
  { slug: "milaap", name: "MILAAP", sku: "RP-ML-03", pricePaise: 24900 },
  { slug: "sukoon-oud", name: "SUKOON OUD", sku: "RP-SO-03", pricePaise: 29900 },
  { slug: "shaan-oud", name: "SHAAN OUD", sku: "RP-SH-03", pricePaise: 34900 },
  { slug: "samandar", name: "SAMANDAR", sku: "RP-SD-03", pricePaise: 24900 },
  { slug: "neel", name: "NEEL", sku: "RP-NL-03", pricePaise: 24900 },
  { slug: "ishq", name: "ISHQ", sku: "RP-IQ-03", pricePaise: 24900 },
  { slug: "siyah-oud", name: "SIYAH OUD", sku: "RP-SY-03", pricePaise: 24900 },
  { slug: "safaa-musk", name: "SAFAA MUSK", sku: "RP-SF-03", pricePaise: 24900 },
  { slug: "adaa", name: "ADAA", sku: "RP-AD-03", pricePaise: 24900 },
];

export const LAUNCH_TESTER_SLUGS = ["mahnoor", "milaap", "sukoon-oud", "shaan-oud", "samandar", "neel", "ishq", "siyah-oud", "safaa-musk", "adaa"] as const;

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
