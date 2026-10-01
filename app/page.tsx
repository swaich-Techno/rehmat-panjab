import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getStorefrontProducts } from "../lib/storefront";
import { getStoreSettings, supportedTrustItems } from "../lib/store-settings";
import { availabilityLabel, firstPrice } from "../lib/catalog";
import { formatMoney } from "../lib/cart";
import { getHomepageReviews } from "../lib/reviews";
import { pageMetadata } from "../lib/seo";
import { getSiteUrl } from "../lib/site-url";
import { merchant } from "../lib/merchant";
import { JsonLd } from "./components/json-ld";
import { OpenGuideButton } from "./components/open-guide-button";
import { ProductAddButton } from "./components/product-add-button";
import { ProductMedia } from "./components/product-media";
import { TesterPreview } from "./components/tester-preview";
import { TodaysRehmat } from "./components/todays-rehmat";
import { TrustStrip } from "./components/trust-strip";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({ title: "Rehmat Panjab — Concentrated Perfume Oils", description:"Discover Rehmat Panjab concentrated perfume oils and choose a personal scent by mood, fragrance notes and occasion.", path: "/" });

const discoveryPaths = [
  { number: "01", title: "Start Small", copy: "Meet the house through individual 3 ml testers or a set built around your curiosity.", href: "/testers", label: "Explore testers" },
  { number: "02", title: "Find My Scent", copy: "Choose by mood, occasion and the notes you already know you love.", href: "/find-your-scent", label: "Begin the guide" },
  { number: "03", title: "Explore the House", copy: "Move through the complete collection at your own pace.", href: "/collection", label: "View fragrances" },
];

export default async function Home() {
  const [products, storeSettings] = await Promise.all([getStorefrontProducts(), getStoreSettings()]);
  const databaseIds = products.map(product => product.databaseId).filter((id): id is string => Boolean(id));
  const reviews = await getHomepageReviews(databaseIds, 3);
  const productNames = new Map(products.map(product => [product.databaseId, product.name]));
  const origin = getSiteUrl();

  return <main id="main-content" className="home-v41">
    <JsonLd data={[{"@context":"https://schema.org","@type":"Organization",name:merchant.name,url:origin,logo:`${origin}/icon.png`,image:`${origin}/og.png`,email:merchant.email,telephone:merchant.phoneE164,address:{"@type":"PostalAddress",streetAddress:"Village Bagli Khurd",addressLocality:"Samrala",addressRegion:"Punjab",postalCode:"141412",addressCountry:"IN"},areaServed:{"@type":"Country",name:"India"},contactPoint:{"@type":"ContactPoint",contactType:"customer support",telephone:merchant.phoneE164,email:merchant.email,availableLanguage:["English","Punjabi","Hindi"]}},{"@context":"https://schema.org","@type":"WebSite",name:"Rehmat Panjab",url:origin,inLanguage:"en-IN"}]} />

    <TodaysRehmat products={products} />

    <section className="home-paths" aria-labelledby="home-paths-heading">
      <header className="home-paths-heading">
        <p className="eyebrow">Your way into Rehmat</p>
        <h2 id="home-paths-heading">How would you<br/><em>like to begin?</em></h2>
      </header>
      <div className="home-paths-grid">
        {discoveryPaths.map(path => <Link href={path.href} key={path.number}>
          <span>{path.number}</span><h3>{path.title}</h3><p>{path.copy}</p><b>{path.label} <i aria-hidden="true">↗</i></b>
        </Link>)}
      </div>
    </section>

    <TesterPreview compact />

    <section id="featured-fragrances" className="v41-oil-act home-house-edit" aria-labelledby="oil-collection-heading">
      <div className="v41-section-heading">
        <div><p className="eyebrow light">The House Edit · Three ways to wear Rehmat</p><h2 id="oil-collection-heading">Your Oil,<br/><em>Your Atmosphere</em></h2></div>
        <div className="v41-section-aside"><p>A considered edit from the live collection—quiet, expressive and grounded in verified fragrance notes.</p><Link className="text-link v41-light-link" href="/collection">View the complete collection <span aria-hidden="true">↗</span></Link></div>
      </div>
      <div className="v41-product-grid">
        {products.slice(0, 3).map(product => <article className="v41-product-card" key={product.id} style={{ "--scent": product.color } as CSSProperties}>
          <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}><ProductMedia product={product} /></Link>
          <div className="v41-product-copy"><span>{product.number}</span><div><h3>{product.name}</h3><p>{firstPrice(product) === null ? "Price on request" : `From ${formatMoney(firstPrice(product)!)}`} · {availabilityLabel(product)}</p><span className="v41-card-actions"><Link className="v41-card-link" href={`/product/${product.slug}`}>View details</Link><ProductAddButton product={product} className="v41-card-add" /></span></div></div>
        </article>)}
      </div>
      <Link className="button button-cream v41-collection-cta" href="/collection">Explore the house</Link>
    </section>

    <section className="home-oil-ritual" aria-labelledby="oil-ritual-heading">
      <div><p className="eyebrow">Why perfume oil?</p><h2 id="oil-ritual-heading">A quieter way<br/>to leave an impression.</h2></div>
      <ol>
        <li><span>01</span><h3>Worn close</h3><p>Apply sparingly to pulse points and let the fragrance develop with the warmth of your skin.</p></li>
        <li><span>02</span><h3>Made personal</h3><p>Notes unfold differently across people, climate and occasion—part of the pleasure of perfume oil.</p></li>
        <li><span>03</span><h3>Easy to discover</h3><p>Begin with 3 ml, learn what you return to, then choose a larger bottle with confidence.</p></li>
      </ol>
    </section>

    <section className="guide-intro home-ai" aria-labelledby="personal-heading">
      <div className="v41-you-title"><p className="eyebrow">Rehmat AI</p><h2 id="personal-heading">Tell us what<br/>you want to feel.</h2></div>
      <div className="guide-intro-copy"><p>Ask about a mood, occasion, climate, fragrance family or layering idea. Rehmat AI answers from verified catalogue facts and can narrow the live collection to three thoughtful choices.</p><div className="home-ai-prompts" aria-label="Example questions"><span>“Something elegant for an evening wedding”</span><span>“Warm, not too sweet, under ₹700”</span><span>“Help me layer oud and musk”</span></div><div className="button-row"><OpenGuideButton/><Link className="text-link" href="/find-your-scent">Use guided discovery <span aria-hidden="true">↗</span></Link></div></div>
    </section>

    {reviews.length > 0 && <section className="home-reviews" aria-labelledby="home-reviews-heading">
      <header><p className="eyebrow light">Approved customer notes</p><h2 id="home-reviews-heading">Worn, remembered,<br/><em>shared.</em></h2></header>
      <div>{reviews.map(review => <article key={review.id}><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span><blockquote>“{review.body}”</blockquote><p>{review.displayName}{review.verifiedPurchase ? " · Verified purchase" : ""}</p><Link href={`/product/${products.find(product => product.databaseId === review.productId)?.slug ?? ""}`}>{productNames.get(review.productId) ?? "View fragrance"}</Link></article>)}</div>
    </section>}

    <section className="house-preview"><p className="eyebrow">The house</p><h2>Perfume oil,<br/>worn close.</h2><p>Atmosphere, memory and personal ritual shape each Rehmat.</p><Link className="text-link" href="/discover">Read our story <span aria-hidden="true">↗</span></Link></section>
    <TrustStrip items={supportedTrustItems(storeSettings)} />
  </main>;
}
