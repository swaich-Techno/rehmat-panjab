"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicOffer } from "../../lib/public-offers";
import { offerPhase } from "../../lib/public-offers";
import { ShareClaimButton } from "../components/diwali-campaign";

const phaseLabel = { live: "Available now", upcoming: "Starts 1 November", ended: "Ended" } as const;

export function OfferList({ offers, whatsappNumber }: { offers: PublicOffer[]; whatsappNumber: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const phasedOffers = useMemo(() => offers.map((offer) => ({ ...offer, phase: offerPhase(offer, now) })), [now, offers]);
  const available = phasedOffers.filter((offer) => offer.phase === "live").length;
  return <section id="current-offers" className="offers-list" aria-labelledby="current-offers-heading">
    <header>
      <p className="eyebrow">Current and scheduled</p>
      <h2 id="current-offers-heading">Every offer,<br/>clearly stated.</h2>
      <p>The checkout or WhatsApp quote validates eligibility, inventory and the final amount. Promotions never stack; the single highest-value eligible saving is applied.</p>
      <p className="offers-live-count"><i aria-hidden="true" /> {available} {available === 1 ? "offer" : "offers"} available now</p>
    </header>
    <div className="offer-card-grid">
      {phasedOffers.map((offer, index) => <article className={`offer-card offer-tone-${offer.tone}`} key={offer.id} data-phase={offer.phase}>
        <div className="offer-card-number">{String(index + 1).padStart(2, "0")}</div>
        <div className="offer-card-status"><i aria-hidden="true" />{phaseLabel[offer.phase]}</div>
        <p className="eyebrow">{offer.eyebrow}</p><h3>{offer.title}</h3>
        <p className="offer-card-description">{offer.description}</p>
        {offer.code && <p className="offer-code"><span>Use code</span><kbd>{offer.code}</kbd></p>}
        <ul>{offer.terms.map((term) => <li key={term}>{term}</li>)}</ul>
        {offer.startsAt && <p className="offer-window"><span>Offer window</span><time dateTime={offer.startsAt}>{offer.windowStartLabel}</time><time dateTime={offer.endsAt}>{offer.windowEndLabel}</time></p>}
        {offer.phase !== "ended" && (offer.shareClaim
          ? <ShareClaimButton whatsappNumber={whatsappNumber} className="offer-share-claim text-link" />
          : <Link className="text-link" href={offer.href}>{offer.action} <span aria-hidden="true">↗</span></Link>)}
      </article>)}
    </div>
  </section>;
}
