import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotifyForm } from "../../components/notify-form";
import { ProductMedia } from "../../components/product-media";
import { ProductPurchase } from "../../components/product-purchase";
import { ProductReviews } from "../../components/product-reviews";
import { products as editorialProducts } from "../../../lib/products";
import { isPurchasable, statusLabel } from "../../../lib/catalog";
import { COMMERCE_ENABLED } from "../../../lib/commerce";
import { getProductReviewSummary } from "../../../lib/reviews";
import { getStorefrontProduct, getStorefrontProducts } from "../../../lib/storefront";

export function generateStaticParams() {
  return editorialProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.subtitle}. A concentrated perfume oil from Rehmat Panjab.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: `${product.name} — Rehmat Panjab`, description: product.atmosphere, images: [{ url: product.image }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const [reviews, catalogue] = await Promise.all([
    product.databaseId ? getProductReviewSummary(product.databaseId, product.reviewsEnabled) : Promise.resolve({ average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [], submissionsEnabled: false }),
    getStorefrontProducts(),
  ]);
  const related = catalogue.filter((item) => item.slug !== product.slug).slice(0, 3);
  const purchasable = COMMERCE_ENABLED && product.variants.some((variant) => isPurchasable(product, variant));
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehmat-panjab.vercel.app";
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image.startsWith("http") ? product.image : `${origin}${product.image}`],
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
        <ProductMedia product={product} priority />
        <p className="product-sticky-caption"><span>{product.number}</span> Rehmat Panjab · 6 ml ritual</p>
      </aside>
      <div className="product-story">
        <section className="story-panel story-opening">
          <p className="eyebrow">Rehmat {product.number} · {statusLabel(product.status)}</p>
          <h1>{product.name}</h1>
          <p className="product-lede">{product.atmosphere}</p>
          <div className="character-chips">{product.character.map((word) => <span key={word}>{word}</span>)}</div>
        </section>
        <section className="story-panel light-panel">
          <p className="eyebrow">01 · Light</p>
          <h2>See it before<br />you smell it.</h2>
          <p>{product.atmosphere}</p>
          <div className="light-beam" aria-hidden="true" />
        </section>
        <section className="story-panel product-description-panel">
          <p className="eyebrow">02 · The fragrance</p>
          <h2>A complete<br />portrait.</h2>
          <div className="long-description">{product.description.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <div className="suitable-for"><h3>Suitable for</h3><ul>{product.suitableFor.map((use) => <li key={use}>{use}</li>)}</ul></div>
        </section>
        <section className="story-panel ritual-panel">
          <p className="eyebrow">03 · The ritual</p>
          <h2>A few drops.<br />A quieter radius.</h2>
          <p>Concentrated perfume oil, worn close to skin. Apply sparingly to pulse points and let it settle.</p>
          <div className="ritual-drop" aria-hidden="true" />
        </section>
        <section className="story-panel format-panel">
          <p className="eyebrow">04 · Available formats</p>
          <h2>Choose your<br />quiet ritual.</h2>
          <ProductPurchase product={product} />
        </section>
        <section className="story-panel service-panel"><p className="eyebrow">Shipping & returns</p><h2>Handled with<br />consideration.</h2><p>Delivery timing and any applicable charge are confirmed before an order is accepted. Unopened items may be eligible for return under the published returns policy.</p></section>
        <ProductReviews productId={product.databaseId ?? "00000000-0000-0000-0000-000000000000"} productName={product.name} summary={reviews} />
        <section className="story-panel related-panel"><p className="eyebrow">Continue exploring</p><h2>Related<br />fragrances.</h2><div className="related-fragrances">{related.map((item) => <Link key={item.slug} href={`/product/${item.slug}`}><span>{item.number}</span><strong>{item.name}</strong><small>{item.atmosphere}</small></Link>)}</div><Link className="button button-outline" href="/layer">Explore this fragrance in Layering Lab</Link></section>
        {!purchasable && <section className="story-panel notify-panel">
          <p className="eyebrow">Private notice</p>
          <h2>{product.status === "sold_out" ? <>Return when<br />it is replenished.</> : product.status === "active" ? <>Know when online<br />purchasing opens.</> : <>Be there when<br />the first drop lands.</>}</h2>
          <p>{product.status === "sold_out" ? "Leave your email for one considered back-in-stock note." : product.status === "active" ? "The catalogue is active while online checkout remains closed. Leave your email for one considered opening note." : "No false countdown. No invented scarcity. Leave your email for one considered launch note."}</p>
          <NotifyForm productSlug={product.slug} />
        </section>}
      </div>
    </main>
  );
}
