import type { Metadata } from "next";
import { getStorefrontProducts } from "../../lib/storefront";
import { CollectionCatalogue } from "./collection-catalogue";

export const metadata: Metadata = {
  title: "The Five",
  description: "Explore five concentrated perfume oils from Rehmat Panjab.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const products = await getStorefrontProducts();
  return (
    <main id="main-content" className="collection-page">
      <header className="page-intro collection-intro">
        <p className="eyebrow">The catalogue · 01—05</p>
        <h1>Five oils.<br /><em>Five atmospheres.</em></h1>
        <div className="intro-aside">
          <p>Concentrated perfume oil, worn close to skin. Apply sparingly to pulse points.</p>
          <span>Only active, stocked variants can be purchased.</span>
        </div>
      </header>
      <CollectionCatalogue products={products} />
    </main>
  );
}
