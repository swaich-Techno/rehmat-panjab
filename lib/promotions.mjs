export const FESTIVAL_CAMPAIGN_ID = "navratri-dussehra-2026";
export const FESTIVAL_START_ISO = "2026-10-08T18:30:00.000Z";
export const FESTIVAL_END_ISO = "2026-10-23T18:29:59.999Z";
export const FESTIVAL_PUBLIC_LABEL = "Save up to 30% during our Navratri & Dussehra celebration.";
export const BUY_TWO_GIFT_LABEL = "Buy any 2 eligible 6 ml bottles and choose 1 eligible 3 ml bottle free.";
export const WELCOME_CODE = "NEW";
export const WELCOME_PUBLIC_LABEL = "15% off eligible merchandise on your first completed purchase.";

export const DEFAULT_FESTIVAL_TIERS = Object.freeze([
  { minimumPaise: 99900, maximumPaise: 149899, percent: 10 },
  { minimumPaise: 149900, maximumPaise: 249899, percent: 20 },
  { minimumPaise: 249900, maximumPaise: null, percent: 30 },
]);

const whole = (value) => Number.isSafeInteger(value) ? value : 0;

export function festivalSaving(subtotalPaise, now = new Date(), campaign = {}) {
  const startsAt = new Date(campaign.startsAt ?? FESTIVAL_START_ISO);
  const endsAt = new Date(campaign.endsAt ?? FESTIVAL_END_ISO);
  const current = now instanceof Date ? now : new Date(now);
  if (campaign.active === false || !Number.isFinite(current.getTime()) || current < startsAt || current > endsAt) return null;
  const tiers = Array.isArray(campaign.tiers) && campaign.tiers.length ? campaign.tiers : DEFAULT_FESTIVAL_TIERS;
  const tier = tiers.find((item) => subtotalPaise >= whole(item.minimumPaise) && (item.maximumPaise == null || subtotalPaise <= whole(item.maximumPaise)));
  if (!tier) return null;
  const cap = whole(campaign.maxDiscountPaise ?? 90000);
  const savingPaise = Math.min(cap, Math.floor(subtotalPaise * whole(tier.percent) / 100));
  if (savingPaise < 1) return null;
  return { kind: "festival", label: campaign.publicLabel ?? FESTIVAL_PUBLIC_LABEL, savingPaise, percent: whole(tier.percent), priority: 30 };
}

export function buyTwoGiftSaving({ paidSixMlQuantity, rewardPricePaise, rewardAvailableQuantity, rewardVariantId }) {
  const rewardQuantity = whole(paidSixMlQuantity) >= 2 ? 1 : 0;
  if (!rewardVariantId || rewardQuantity < 1 || whole(rewardPricePaise) < 1 || whole(rewardAvailableQuantity) < rewardQuantity) return null;
  return {
    kind: "buy-two-gift",
    label: BUY_TWO_GIFT_LABEL,
    savingPaise: whole(rewardPricePaise) * rewardQuantity,
    rewardVariantId,
    rewardQuantity,
    priority: 20,
  };
}

export function chooseBestPromotion(candidates) {
  return candidates.filter(Boolean).sort((left, right) => right.savingPaise - left.savingPaise || right.priority - left.priority)[0] ?? null;
}
