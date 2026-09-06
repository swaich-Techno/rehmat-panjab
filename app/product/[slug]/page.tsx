import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotifyForm } from "../../components/notify-form";
import { ProductMedia } from "../../components/product-media";
import { ProductPurchase } from "../../components/product-purchase";
import { products as editorialProducts } from "../../../lib/products";
import { isPurchasable, statusLabel } from "../../../lib/catalog";
import { COMMERCE_ENABLED } from "../../../lib/commerce";
import { getStorefrontProduct } from "../../../lib/storefront";

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
  const purchasable = COMMERCE_ENABLED && product.variants.some((variant) => isPurchasable(product, variant));
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rehmat-panjab.vercel.app";
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image.startsWith("http") ? product.image : `${origin}${product.image}`],
    ...(COMMERCE_ENABLED ? { sku: product.variants[0]?.sku, offers: product.variants.filter((variant) => variant.pricePaise !== null).map((variant) => ({
      "@type": "Offer",
      url: `${origin}/product/${product.slug}`,
      priceCurrency: variant.currency,
      price: ((variant.pricePaise ?? 0) / 100).toFixed(2),
      sku: variant.sku,
      availability: variant.availableQuantity > 0 && product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })) } : {}),
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
          <p className="product-lede">{product.subtitle}</p>
          <div className="character-chips">{product.character.map((word) => <span key={word}>{word}</span>)}</div>
        </section>
        <section className="story-panel light-panel">
          <p className="eyebrow">01 · Light</p>
          <h2>See it before<br />you smell it.</h2>
          <p>{product.atmosphere}</p>
          <div className="light-beam" aria-hidden="true" />
        </section>
        <section className="story-panel impression-panel">
          <p className="eyebrow">02 · Scent impression</p>
          <h2>An editorial portrait,<br />not a note pyramid.</h2>
          <p>Fragrance details are still being verified. Until the final oil is approved, we share only its intended atmosphere and character.</p>
        </section>
        <section className="story-panel ritual-panel">
          <p className="eyebrow">03 · The ritual</p>
          <h2>A few drops.<br />A quieter radius.</h2>
          <p>Concentrated perfume oil, worn close to skin. Apply sparingly to pulse points and let it settle.</p>
          <div className="ritual-drop" aria-hidden="true" />
        </section>
        <section className="story-panel format-panel">
          <p className="eyebrow">04 · Available format</p>
          <h2>Choose your<br />quiet ritual.</h2>
          <ProductPurchase product={product} />
        </section>
        {!purchasable && <section className="story-panel notify-panel">
          <p className="eyebrow">05 · Private notice</p>
          <h2>{product.status === "sold_out" ? <>Return when<br />it is replenished.</> : <>Be there when<br />the first drop lands.</>}</h2>
          <p>{product.status === "sold_out" ? "Leave your email for one considered back-in-stock note." : "No false countdown. No invented scarcity. Leave your email for one considered launch note."}</p>
          <NotifyForm productSlug={product.slug} />
        </section>}
      </div>
    </main>
  );
}
