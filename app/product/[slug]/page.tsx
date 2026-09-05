import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotifyForm } from "../../components/notify-form";
import { ProductMedia } from "../../components/product-media";
import { getProduct, products, statusLabel } from "../../../lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
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
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main id="main-content" className={`product-page scent-page-${product.id}`}>
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
          <h2>Small bottle.<br />Slow ritual.</h2>
          <div className="size-row" aria-label="Planned sizes">
            {product.enabledSizes.map((size, index) => <span className={index === 0 ? "is-primary" : ""} key={size}>{size} ml {index === 0 && <small>Primary</small>}</span>)}
          </div>
          <p>Only enabled sizes are shown. Price and inventory will appear after they are confirmed.</p>
        </section>
        <section className="story-panel notify-panel">
          <p className="eyebrow">05 · Private notice</p>
          <h2>Be there when<br />the first drop lands.</h2>
          <p>No false countdown. No invented scarcity. Leave your email for one considered launch note.</p>
          <NotifyForm productSlug={product.slug} />
        </section>
      </div>
    </main>
  );
}
