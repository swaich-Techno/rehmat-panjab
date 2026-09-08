import Link from "next/link";
import type { CSSProperties } from "react";
import { HomepageCampaign } from "./components/homepage-campaign";
import { ProductMedia } from "./components/product-media";
import { getStorefrontProducts } from "../lib/storefront";

export default async function Home() {
  const products = await getStorefrontProducts();
  return (
    <main id="main-content" className="home-v41">
      <HomepageCampaign />

      <section className="v41-oil-act" aria-labelledby="oil-collection-heading">
        <div className="v41-section-heading">
          <div>
            <p className="eyebrow light">Act 02 · Oil / Collection</p>
            <h2 id="oil-collection-heading">Nine oils.<br /><em>Worn close.</em></h2>
          </div>
          <div className="v41-section-aside">
            <p>Each Rehmat carries its own atmosphere inside the same intimate ritual.</p>
            <Link className="text-link v41-light-link" href="/collection" data-cursor="VIEW">View the collection <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className="v41-product-grid">
          {products.slice(0, 3).map((product) => (
            <article className="v41-product-card" key={product.id} style={{ "--scent": product.color } as CSSProperties}>
              <Link href={"/product/" + product.slug} data-cursor="VIEW" aria-label={"View " + product.name}>
                <ProductMedia product={product} />
              </Link>
              <div className="v41-product-copy">
                <span>{product.number}</span>
                <div><h3>{product.name}</h3><p>{product.subtitle}</p></div>
              </div>
            </article>
          ))}
        </div>

        <Link className="button button-cream v41-collection-cta" href="/collection" data-cursor="VIEW">View the collection</Link>
      </section>

      <section className="v41-you-act" aria-labelledby="personal-heading">
        <div className="v41-you-title">
          <p className="eyebrow">Act 03 · You</p>
          <h2 id="personal-heading">What should<br />your Rehmat<br /><em>feel like?</em></h2>
        </div>
        <div className="v41-path-grid">
          <Link href="/find-your-scent" data-cursor="DROP">
            <span>01</span><p>Six sensory choices</p><h3>Find mine</h3><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/create-your-fragrance" data-cursor="MIX">
            <span>02</span><p>Build the fragrance you would want to wear.</p><h3>Create mine</h3><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/next-drop" data-cursor="VOTE">
            <span>03</span><p>Choose the mood that should come next.</p><h3>Shape the next</h3><b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>
    </main>
  );
}
