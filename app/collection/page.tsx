import type { Metadata } from "next";
import { getStorefrontProducts } from "../../lib/storefront";
import { CollectionCatalogue } from "./collection-catalogue";
import { getExperienceSettings } from "../../lib/experience-settings";

export const metadata: Metadata = {
  title: "The Collection",
  description: "Your Oil, Your Atmosphere. Explore concentrated perfume oils from Rehmat Panjab.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const [products,experience] = await Promise.all([getStorefrontProducts(),getExperienceSettings()]);
  return (
    <main id="main-content" className="collection-page">
      <header className="collection-intro">
        <p className="eyebrow">THE COLLECTION</p>
        <h1>Your Oil, <em>Your Atmosphere</em></h1>
        <p>Ten concentrated perfume oils. Explore by mood, notes, suitability or price.</p>
      </header>
      <CollectionCatalogue products={products} whatsappSettings={{enabled:experience.whatsappEnabled,number:experience.whatsappNumber,defaultMessage:experience.whatsappDefaultMessage}} />
    </main>
  );
}
