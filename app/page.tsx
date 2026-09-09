import Link from "next/link";
import type { CSSProperties } from "react";
import { HomepageCampaign } from "./components/homepage-campaign";
import { ProductMedia } from "./components/product-media";
import { getStorefrontProducts } from "../lib/storefront";
import { getStoreSettings, supportedTrustItems } from "../lib/store-settings";
import { OpenGuideButton } from "./components/open-guide-button";
import { TrustStrip } from "./components/trust-strip";

export default async function Home() {
  const [products,storeSettings] = await Promise.all([getStorefrontProducts(),getStoreSettings()]);
  return (
    <main id="main-content" className="home-v41">
      <HomepageCampaign />

      <section className="v41-oil-act" aria-labelledby="oil-collection-heading">
        <div className="v41-section-heading">
          <div>
            <p className="eyebrow light">Featured fragrances</p>
            <h2 id="oil-collection-heading">Your Oil,<br /><em>Your Atmosphere</em></h2>
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

      <section className="guide-intro" aria-labelledby="personal-heading">
        <div className="v41-you-title">
          <p className="eyebrow">Personal guidance</p>
          <h2 id="personal-heading">Not sure where<br/>to begin?</h2>
        </div>
        <div className="guide-intro-copy"><p>Tell Rehmat Guide the mood, occasion or notes you are drawn to. It can help you choose one fragrance, compare several or build a layering ritual.</p><div className="button-row"><OpenGuideButton/><Link className="text-link" href="/collection">Browse all fragrances <span aria-hidden="true">↗</span></Link></div></div>
      </section>
      <section className="house-preview"><p className="eyebrow">The house</p><h2>Perfume oil,<br/>worn close.</h2><p>Atmosphere, memory and personal ritual shape each Rehmat.</p><Link className="text-link" href="/discover">Read our story <span aria-hidden="true">↗</span></Link></section>
      <TrustStrip items={supportedTrustItems(storeSettings)}/>
    </main>
  );
}
