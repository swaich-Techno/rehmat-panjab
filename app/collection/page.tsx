import type { Metadata } from "next";
import Link from "next/link";
import { ProductMedia } from "../components/product-media";
import { products, statusLabel } from "../../lib/products";

export const metadata: Metadata = {
  title: "The Five",
  description: "Explore five concentrated perfume oils from Rehmat Panjab.",
  alternates: { canonical: "/collection" },
};

export default function CollectionPage() {
  return (
    <main id="main-content" className="collection-page">
      <header className="page-intro collection-intro">
        <p className="eyebrow">The catalogue · 01—05</p>
        <h1>Five oils.<br /><em>Five atmospheres.</em></h1>
        <div className="intro-aside">
          <p>Concentrated perfume oil, worn close to skin. Apply sparingly to pulse points.</p>
          <span>No prices until they are real.</span>
        </div>
      </header>

      <section className="collection-list" aria-label="Rehmat fragrances">
        {products.map((product, index) => (
          <article className={`collection-product layout-${index % 2 ? "right" : "left"}`} key={product.id}>
            <Link className="collection-media-link" href={`/product/${product.slug}`} data-cursor="VIEW">
              <ProductMedia product={product} priority={index === 0} />
            </Link>
            <div className="collection-copy">
              <div className="number-rule"><span>{product.number}</span><i /></div>
              <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
              <p className="product-subtitle">{product.subtitle}</p>
              <p>{product.atmosphere}</p>
              <ul aria-label="Scent character">{product.character.map((word) => <li key={word}>{word}</li>)}</ul>
              <div className="collection-actions">
                <span className="status-dot">{statusLabel(product.status)}</span>
                <Link className="text-link" href={`/product/${product.slug}`} data-cursor="VIEW">Enter the atmosphere ↗</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
