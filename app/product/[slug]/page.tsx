import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { NotifyForm } from "../../components/notify-form";
import { ProductMedia } from "../../components/product-media";
import { ProductPurchase } from "../../components/product-purchase";
import { ProductReviews } from "../../components/product-reviews";
import { INSPIRATION_DISCLAIMER, productRedirects, products as editorialProducts } from "../../../lib/products";
import { availabilityLabel, isPurchasable, suitabilityLabels } from "../../../lib/catalog";
import { COMMERCE_ENABLED } from "../../../lib/commerce";
import { getProductReviewSummary } from "../../../lib/reviews";
import { getStorefrontProduct, getStorefrontProducts } from "../../../lib/storefront";
import { getExperienceSettings } from "../../../lib/experience-settings";
import { getSiteUrl } from "../../../lib/site-url";
import { getPublishedPolicyRecord, getStoreSettings, supportedTrustItems } from "../../../lib/store-settings";
import { TrustStrip } from "../../components/trust-strip";

export function generateStaticParams() {
  return editorialProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (productRedirects[slug]) permanentRedirect(`/product/${productRedirects[slug]}`);
  const product = await getStorefrontProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.microDescription || `${product.subtitle}. A concentrated perfume oil from Rehmat Panjab.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: `${product.name} — Rehmat Panjab`, description: product.atmosphere, images: [{ url: product.socialImage, width: 1200, height: 630, alt: `${product.name} perfume oil by Rehmat Panjab` }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (productRedirects[slug]) permanentRedirect(`/product/${productRedirects[slug]}`);
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const [reviews, catalogue, experience, storeSettings, publishedPolicies] = await Promise.all([
    product.databaseId ? getProductReviewSummary(product.databaseId, product.reviewsEnabled) : Promise.resolve({ average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [], submissionsEnabled: false }),
    getStorefrontProducts(),
    getExperienceSettings(),
    getStoreSettings(),
    getPublishedPolicyRecord(),
  ]);
  const related = catalogue.filter((item) => item.slug !== product.slug).slice(0, 3);
  const purchasable = COMMERCE_ENABLED && product.variants.some((variant) => isPurchasable(product, variant));
  const origin = getSiteUrl();
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    audience: { "@type": "PeopleAudience", suggestedGender: suitabilityLabels[product.suitability] },
    image: [product.socialImage.startsWith("http") ? product.socialImage : `${origin}${product.socialImage}`],
    ...(COMMERCE_ENABLED ? { sku: product.variants[0]?.sku, offers: product.variants.filter((variant) => isPurchasable(product, variant)).map((variant) => ({
      "@type": "Offer",
      url: `${origin}/product/${product.slug}`,
      priceCurrency: variant.currency,
      price: ((variant.pricePaise ?? 0) / 100).toFixed(2),
      sku: variant.sku,
      availability: variant.availableQuantity > 0 && product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })) } : {}),
    ...(reviews.total ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average.toFixed(1), reviewCount: reviews.total } } : {}),
  };

  return (
    <main id="main-content" className={`product-page scent-page-${product.id}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }} />
      <aside className="product-sticky">
        <ProductMedia product={product} priority role="hero" />
        <p className="product-sticky-caption"><span>{product.number}</span> Rehmat Panjab · Bottle formats</p>
      </aside>
      <div className="product-story">
        <section className="story-panel story-opening">
          <p className="eyebrow">Rehmat {product.number} · {availabilityLabel(product)}</p>
          <h1>{product.name}</h1>
          {product.inspirationLine && <p className="product-inspiration">{product.inspirationLine}</p>}
          {product.inspirationLine && <p className="inspiration-disclaimer">{INSPIRATION_DISCLAIMER}</p>}
          <p className="product-lede">{product.atmosphere}</p>
          {product.microDescription && <p className="product-micro-description">{product.microDescription}</p>}
          <p className="product-suitability"><span>{suitabilityLabels[product.suitability]}</span>{product.suitabilityNote && <> · {product.suitabilityNote}</>}</p>
          <div className="character-chips">{product.character.map((word) => <span key={word}>{word}</span>)}</div>
        </section>
        <section className="story-panel product-description-panel">
          <p className="eyebrow">01 · Notes and journey</p>
          <h2>How it<br />unfolds.</h2>
          {product.notes && <div className="note-groups" aria-label="Fragrance notes"><div><h3>Top</h3><p>{product.notes.top.join(" · ")}</p></div><div><h3>Heart</h3><p>{product.notes.heart.join(" · ")}</p></div><div><h3>Base</h3><p>{product.notes.base.join(" · ")}</p></div></div>}
          {product.journey && <div className="scent-journey" aria-label="Scent journey"><p><strong>Opening</strong>{product.journey.opening}</p><p><strong>Heart</strong>{product.journey.heart}</p><p><strong>Drydown</strong>{product.journey.drydown}</p></div>}
          <div className="suitable-for"><h3>Suitable for</h3><ul>{product.suitableFor.map((use) => <li key={use}>{use}</li>)}</ul></div>
          <details className="product-details"><summary>Full fragrance portrait</summary><div className="long-description">{product.description.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{product.positioning && <p className="product-positioning"><strong>Positioning</strong> {product.positioning}</p>}</details>
          <details className="product-details"><summary>How to wear it</summary><p>Apply sparingly to pulse points and allow the concentrated perfume oil to settle naturally. Experience varies by skin, climate and application.</p></details>
          {product.campaignImage && <figure className="product-campaign-inline"><div className="editorial-campaign-image"><Image src={product.campaignImage} alt={product.campaignImageAlt ?? `${product.name} scent atmosphere`} fill sizes="(max-width: 700px) 88vw, 32vw" /></div><figcaption>Scent atmosphere</figcaption></figure>}
        </section>
        <section className="story-panel format-panel">
          <p className="eyebrow">02 · Bottle and order</p>
          <h2>Choose your<br />bottle.</h2>
          <ProductPurchase product={product} policiesPublished={Boolean(publishedPolicies)} whatsappSettings={{enabled:experience.whatsappEnabled,number:experience.whatsappNumber,defaultMessage:experience.whatsappDefaultMessage,notice:experience.whatsappNotice}} />
          <TrustStrip items={supportedTrustItems(storeSettings)}/>
        </section>
        <ProductReviews productId={product.databaseId ?? "00000000-0000-0000-0000-000000000000"} productName={product.name} summary={reviews} />
        <section className="story-panel related-panel"><p className="eyebrow">Continue exploring</p><h2>Related<br />fragrances.</h2><div className="related-fragrances">{related.map((item) => <Link key={item.slug} href={`/product/${item.slug}`}><span>{item.number}</span><strong>{item.name}</strong><small>{item.atmosphere}</small></Link>)}</div><Link className="button button-outline" href="/layer">Explore this fragrance in Layering Lab</Link></section>
        {!purchasable && product.status === "sold_out" && <section className="story-panel notify-panel"><p className="eyebrow">Availability notice</p><h2>Return when<br />it is replenished.</h2><p>Leave your email for one considered back-in-stock note.</p><NotifyForm productSlug={product.slug} /></section>}
      </div>
    </main>
  );
}
