import type { Metadata } from "next";
import { getStorefrontProducts } from "../../lib/storefront";
import { CollectionCatalogue } from "./collection-catalogue";

export const metadata: Metadata = {
  title: "The Collection",
  description: "Your Oil, Your Atmosphere. Explore concentrated perfume oils from Rehmat Panjab.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const products = await getStorefrontProducts();
  return (
    <main id="main-content" className="collection-page">
      <header className="page-intro collection-intro">
        <p className="eyebrow">The catalogue · 01—10</p>
        <h1>Your Oil,<br /><em>Your Atmosphere</em></h1>
        <div className="intro-aside">
          <p>Concentrated perfume oil, worn close to skin. Apply sparingly to pulse points.</p>
          <span>Choose a bottle size and request your order directly on WhatsApp.</span>
        </div>
      </header>
      <CollectionCatalogue products={products} />
    </main>
  );
}
