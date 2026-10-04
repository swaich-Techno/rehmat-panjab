import {
  BUY_TWO_GIFT_LABEL,
  FESTIVAL_END_ISO,
  FESTIVAL_PUBLIC_LABEL,
  FESTIVAL_START_ISO,
  WELCOME_CODE,
  WELCOME_PUBLIC_LABEL,
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
];

export function offerPhase(offer: PublicOffer, now = new Date()): "live" | "upcoming" | "ended" {
  if (offer.startsAt && now < new Date(offer.startsAt)) return "upcoming";
  if (offer.endsAt && now > new Date(offer.endsAt)) return "ended";
  return "live";
}

export const diwaliCalendarPreview = {
  title: "Diwali gifting edit",
  festivalDate: "8 November 2026",
  revealDate: "29 October 2026",
  description: "A luminous fragrance and gifting edit will appear ten days before Diwali. No discount or coupon is promised until the house publishes approved terms.",
};
