import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { publicOffers } from "../../lib/public-offers";
import { pageMetadata } from "../../lib/seo";
import { getSiteUrl } from "../../lib/site-url";
import { merchant } from "../../lib/merchant";
import { OfferList } from "./offer-list";
import { OffersHero } from "./offers-hero";

export const revalidate = 900;

export const metadata: Metadata = pageMetadata({
  title: "Current fragrance offers",
  description: "See current and upcoming Rehmat Panjab fragrance offers, eligibility, dates and verified terms.",
  path: "/offers",
});

export default function OffersPage() {
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

    <OffersHero />

    <OfferList offers={publicOffers} whatsappNumber={merchant.whatsapp} />

    <section className="offers-fine-print">
      <p className="eyebrow">Before you choose</p>
      <h2>Quiet luxury.<br/>Clear conditions.</h2>
      <div><p>Discounts apply to eligible merchandise only and exclude shipping. Stock, customer eligibility and final totals are checked by the server before payment or manual confirmation.</p><p>A WhatsApp message remains an order request until Rehmat Panjab confirms stock, delivery and payment. See the complete conditions before ordering.</p></div>
      <div className="button-row"><Link className="button button-dark" href="/policies/terms">Read offer terms</Link><Link className="button button-outline" href="/contact">Ask the house</Link></div>
    </section>
  </main>;
}
