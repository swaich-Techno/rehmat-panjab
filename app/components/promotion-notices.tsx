"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BUY_TWO_GIFT_LABEL, DIWALI_END_ISO, DIWALI_START_ISO, WELCOME_CODE, WELCOME_PUBLIC_LABEL, campaignPhase } from "../../lib/promotions.mjs";
import { ShareClaimButton } from "./diwali-campaign";

export function PromotionNotices({ compact = false, whatsappNumber = "917009464475" }: { compact?: boolean; whatsappNumber?: string }) {
  const [phase, setPhase] = useState<"live" | "upcoming" | "ended">(() => campaignPhase(DIWALI_START_ISO, DIWALI_END_ISO));
  useEffect(() => { const refresh = () => setPhase(campaignPhase(DIWALI_START_ISO, DIWALI_END_ISO)); const timer = window.setInterval(refresh, 60_000); return () => window.clearInterval(timer); }, []);
  const className = `${compact ? "promotion-notices is-compact" : "promotion-notices"}${phase === "ended" ? "" : " is-diwali"}`;
  return <aside className={className} aria-label="Current offers">
    {phase !== "ended" ? <>
      <article className="promotion-notice promotion-notice-diwali"><strong>{phase === "upcoming" ? "Diwali starts 1 November" : "Diwali — 60% Off · Applied Automatically"}</strong><p>Eligible fragrance bottles and tester packs from 1–10 November. No code, no cap; shipping is excluded.</p><Link className="text-link" href="/collection">Shop 60% Off <span aria-hidden="true">↗</span></Link></article>
      <article className="promotion-notice promotion-notice-sample"><strong>Share Rehmat. Try 3 ml for ₹99.</strong><p>Only 99 verified claims, one per customer. Shipping is extra and an enquiry does not reserve stock.</p><ShareClaimButton whatsappNumber={whatsappNumber} className="promotion-share-claim text-link" /></article>
    </> : <>
      <article className="promotion-notice"><strong>New to Rehmat?</strong><p>{WELCOME_PUBLIC_LABEL} Use code <b>{WELCOME_CODE}</b>.</p></article>
      <article className="promotion-notice"><strong>Choose your gift</strong><p>{BUY_TWO_GIFT_LABEL} The server applies the single highest-value eligible promotion.</p></article>
    </>}
    <Link className="promotion-notices-link" href="/offers">See dates and full terms <span aria-hidden="true">↗</span></Link>
  </aside>;
}
