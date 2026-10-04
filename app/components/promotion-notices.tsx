import Link from "next/link";
import {
  BUY_TWO_GIFT_LABEL,
  FESTIVAL_PUBLIC_LABEL,
  WELCOME_CODE,
  WELCOME_PUBLIC_LABEL,
} from "../../lib/promotions.mjs";
import { offerPhase, publicOffers } from "../../lib/public-offers";

export function PromotionNotices({ compact = false }: { compact?: boolean }) {
  const festivalOffer = publicOffers.find((offer) => offer.id === "navratri-dussehra-2026");
  const festivalPhase = festivalOffer ? offerPhase(festivalOffer) : "ended";
  const festival = festivalPhase === "live";
  const festivalUpcoming = festivalPhase === "upcoming";

  return <aside className={compact ? "promotion-notices is-compact" : "promotion-notices"} aria-label="Current offers">
    <article className="promotion-notice"><strong>New to Rehmat?</strong><p>{WELCOME_PUBLIC_LABEL} Use code <b>{WELCOME_CODE}</b>.</p></article>
    <article className="promotion-notice"><strong>Choose your gift</strong><p>{BUY_TWO_GIFT_LABEL} The server applies the single highest-value eligible promotion.</p></article>
    {(festival || festivalUpcoming) && <article className="promotion-notice"><strong>{festival ? "Festival offer live" : "Festival offer begins 9 October"}</strong><p>{FESTIVAL_PUBLIC_LABEL} Ends 23 October 2026 at 11:59 PM IST.</p></article>}
    <Link className="promotion-notices-link" href="/offers">See dates and full terms <span aria-hidden="true">↗</span></Link>
  </aside>;
}
