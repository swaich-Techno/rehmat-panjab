import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { diwaliCalendarPreview, offerPhase, publicOffers } from "../../lib/public-offers";
import { pageMetadata } from "../../lib/seo";
import { getSiteUrl } from "../../lib/site-url";

export const revalidate = 900;

export const metadata: Metadata = pageMetadata({
  title: "Current fragrance offers",
  description: "See current and upcoming Rehmat Panjab fragrance offers, eligibility, dates and verified terms.",
  path: "/offers",
});

const phaseLabel = { live: "Available now", upcoming: "Begins soon", ended: "Ended" } as const;

export default function OffersPage() {
  const now = new Date();
  const offers = publicOffers.map((offer) => ({ ...offer, phase: offerPhase(offer, now) }));
  const available = offers.filter((offer) => offer.phase === "live").length;
  const origin = getSiteUrl();

  return <main id="main-content" className="offers-page">
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Rehmat Panjab offers",
      description: "Current and upcoming verified Rehmat Panjab fragrance offers.",
      url: `${origin}/offers`,
      isPartOf: { "@type": "WebSite", name: "Rehmat Panjab", url: origin },
    }} />

    <section className="offers-hero" aria-labelledby="offers-heading">
      <div className="offers-hero-copy">
        <p className="eyebrow">The Rehmat edit · verified terms</p>
        <h1 id="offers-heading">A little more<br/><em>to remember.</em></h1>
        <p>Considered ways to discover the house—without inflated countdowns, hidden conditions or overlapping promises.</p>
        <div className="offers-hero-actions">
          <Link className="button button-dark" href="#current-offers">View current offers</Link>
          <Link className="text-link" href="/collection">Explore fragrances <span aria-hidden="true">↗</span></Link>
        </div>
        <p className="offers-live-count"><i aria-hidden="true" /> {available} {available === 1 ? "offer" : "offers"} available now</p>
      </div>
      <div className="offers-visual" aria-hidden="true">
        <span className="offers-orbit offers-orbit-one" />
        <span className="offers-orbit offers-orbit-two" />
        <Image className="offers-ingredient offers-ingredient-amber" src="/images/fragrance-notes/amber-resin.webp" alt="" width={512} height={512} />
        <Image className="offers-ingredient offers-ingredient-rose" src="/images/fragrance-notes/rose-petals.webp" alt="" width={512} height={512} />
        <Image className="offers-bottle" src="/images/bottles/rose-gold-bottle-oil-cutout.webp" alt="" width={1254} height={1254} priority />
        <div className="offers-glass-plaque"><span>First Rehmat</span><strong>15% off</strong><small>Code NEW · eligibility applies</small></div>
      </div>
    </section>

    <section id="current-offers" className="offers-list" aria-labelledby="current-offers-heading">
      <header>
        <p className="eyebrow">Current and scheduled</p>
        <h2 id="current-offers-heading">Every offer,<br/>clearly stated.</h2>
        <p>The checkout or WhatsApp quote validates eligibility, inventory and the final amount. Promotions never stack; the single highest-value eligible saving is applied.</p>
      </header>
      <div className="offer-card-grid">
        {offers.map((offer, index) => <article className={`offer-card offer-tone-${offer.tone}`} key={offer.id} data-phase={offer.phase}>
          <div className="offer-card-number">0{index + 1}</div>
          <div className="offer-card-status"><i aria-hidden="true" />{phaseLabel[offer.phase]}</div>
          <p className="eyebrow">{offer.eyebrow}</p>
          <h3>{offer.title}</h3>
          <p className="offer-card-description">{offer.description}</p>
          {offer.code && <p className="offer-code"><span>Use code</span><kbd>{offer.code}</kbd></p>}
          <ul>{offer.terms.map((term) => <li key={term}>{term}</li>)}</ul>
          {offer.startsAt && <p className="offer-window">
            <span>Offer window</span>
            <time dateTime={offer.startsAt}>9 October 2026, 12:00 AM IST</time>
            <time dateTime={offer.endsAt}>23 October 2026, 11:59 PM IST</time>
          </p>}
          {offer.phase !== "ended" && <Link className="text-link" href={offer.href}>{offer.action} <span aria-hidden="true">↗</span></Link>}
        </article>)}
      </div>
    </section>

    <section className="offers-calendar-preview" aria-labelledby="diwali-preview-heading">
      <div>
        <p className="eyebrow light">Next on the house calendar</p>
        <h2 id="diwali-preview-heading">{diwaliCalendarPreview.title}</h2>
        <p>{diwaliCalendarPreview.description}</p>
      </div>
      <dl>
        <div><dt>Preview opens</dt><dd>{diwaliCalendarPreview.revealDate}</dd></div>
        <div><dt>Verified festival date</dt><dd>{diwaliCalendarPreview.festivalDate}</dd></div>
      </dl>
    </section>

    <section className="offers-fine-print">
      <p className="eyebrow">Before you choose</p>
      <h2>Quiet luxury.<br/>Clear conditions.</h2>
      <div><p>Discounts apply to eligible merchandise only and exclude shipping. Stock, customer eligibility and final totals are checked by the server before payment or manual confirmation.</p><p>A WhatsApp message remains an order request until Rehmat Panjab confirms stock, delivery and payment. See the complete conditions before ordering.</p></div>
      <div className="button-row"><Link className="button button-dark" href="/policies/terms">Read offer terms</Link><Link className="button button-outline" href="/contact">Ask the house</Link></div>
    </section>
  </main>;
}
