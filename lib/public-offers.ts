import {
  BUY_TWO_GIFT_LABEL,
  DIWALI_CAMPAIGN_ID,
  DIWALI_DISCOUNT_PERCENT,
  DIWALI_END_ISO,
  DIWALI_PUBLIC_LABEL,
  DIWALI_START_ISO,
  FESTIVAL_END_ISO,
  FESTIVAL_PUBLIC_LABEL,
  FESTIVAL_START_ISO,
  SAMPLE_CAMPAIGN_ID,
  SAMPLE_PRICE_PAISE,
  SAMPLE_PUBLIC_LABEL,
  SAMPLE_TOTAL_STOCK,
  WELCOME_CODE,
  WELCOME_PUBLIC_LABEL,
  campaignPhase,
} from "./promotions.mjs";

export type PublicOffer = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  terms: string[];
  href: string;
  action: string;
  code?: string;
  startsAt?: string;
  endsAt?: string;
  windowStartLabel?: string;
  windowEndLabel?: string;
  shareClaim?: boolean;
  tone: "champagne" | "rose" | "sapphire";
};

export const publicOffers: PublicOffer[] = [
  {
    id: "welcome",
    eyebrow: "First Rehmat",
    title: "15% off your first completed purchase",
    description: WELCOME_PUBLIC_LABEL,
    terms: [
      `Use code ${WELCOME_CODE} before sending or confirming your order.`,
      "One successful redemption per eligible first-time customer.",
      "Eligible merchandise only; shipping is excluded.",
    ],
    href: "/collection",
    action: "Choose your first fragrance",
    code: WELCOME_CODE,
    tone: "champagne",
  },
  {
    id: "choose-your-gift",
    eyebrow: "A small Rehmat",
    title: "Choose a complimentary 3 ml",
    description: BUY_TWO_GIFT_LABEL,
    terms: [
      "Choose the complimentary fragrance from eligible in-stock 3 ml testers.",
      "One complimentary tester per eligible order.",
      "The secure quote applies only the single highest-value eligible promotion.",
    ],
    href: "/collection",
    action: "Explore 6 ml fragrances",
    tone: "rose",
  },
  {
    id: "navratri-dussehra-2026",
    eyebrow: "Festive offer · 9–23 October",
    title: "Navratri & Dussehra celebration",
    description: FESTIVAL_PUBLIC_LABEL,
    terms: [
      "10% from ₹999, 20% from ₹1,499, and 30% from ₹2,499 of eligible merchandise.",
      "Maximum saving ₹900; shipping is excluded.",
      "Dussehra falls on 20 October 2026; this Rehmat offer closes 23 October at 11:59 PM IST.",
    ],
    href: "/collection",
    action: "Prepare your festive edit",
    startsAt: FESTIVAL_START_ISO,
    endsAt: FESTIVAL_END_ISO,
    tone: "sapphire",
  },
  {
    id: DIWALI_CAMPAIGN_ID,
    eyebrow: "Diwali · 1–10 November",
    title: `${DIWALI_DISCOUNT_PERCENT}% off for Diwali`,
    description: DIWALI_PUBLIC_LABEL,
    terms: [
      "Eligible live fragrance bottles and tester packs are included; shipping is excluded.",
      "No coupon is needed and there is no maximum discount cap.",
      "Offers do not stack; the server applies the single highest-value eligible saving.",
    ],
    href: "/collection",
    action: "Shop 60% off",
    startsAt: DIWALI_START_ISO,
    endsAt: DIWALI_END_ISO,
    windowStartLabel: "1 November 2026, 12:00 AM IST",
    windowEndLabel: "10 November 2026, 11:59 PM IST",
    tone: "sapphire",
  },
  {
    id: SAMPLE_CAMPAIGN_ID,
    eyebrow: "Limited to 99 verified claims",
    title: "Share Rehmat. Try 3 ml for ₹99.",
    description: SAMPLE_PUBLIC_LABEL,
    terms: [
      `One eligible in-stock 3 ml tester for ₹${SAMPLE_PRICE_PAISE / 100}; shipping is extra.`,
      "One verified claim per customer. Support confirms the share or WhatsApp enquiry and payment manually.",
      `Sharing or sending an enquiry does not reserve stock; the campaign closes after ${SAMPLE_TOTAL_STOCK} confirmed claims or 10 November, whichever comes first.`,
    ],
    href: "/contact",
    action: "Share & claim",
    startsAt: DIWALI_START_ISO,
    endsAt: DIWALI_END_ISO,
    windowStartLabel: "1 November 2026, 12:00 AM IST",
    windowEndLabel: "10 November 2026, 11:59 PM IST",
    shareClaim: true,
    tone: "rose",
  },
];

export function offerPhase(offer: PublicOffer, now = new Date()): "live" | "upcoming" | "ended" {
  if (!offer.startsAt || !offer.endsAt) return "live";
  return campaignPhase(offer.startsAt, offer.endsAt, now);
}
