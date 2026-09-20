import type { Metadata } from "next";
import { getStorefrontProducts } from "../../lib/storefront";
import { CollectionCatalogue } from "./collection-catalogue";
import { getExperienceSettings } from "../../lib/experience-settings";
import {JsonLd} from "../components/json-ld";
import {pageMetadata} from "../../lib/seo";
import {getSiteUrl} from "../../lib/site-url";

export const metadata: Metadata = pageMetadata({title:"The Perfume Oil Collection",description:"Explore Rehmat Panjab concentrated perfume oils by fragrance family, mood, bottle size, occasion and availability.",path:"/collection"});

export default async function CollectionPage() {
  const [catalogue,experience] = await Promise.all([getStorefrontProducts(),getExperienceSettings()]);
  const products=catalogue.filter(product=>product.status==="active");
  const origin=getSiteUrl();
  return (
    <main id="main-content" className="collection-page">
      <JsonLd data={{"@context":"https://schema.org","@type":"CollectionPage",name:"The Rehmat Panjab Perfume Oil Collection",description:"Explore concentrated perfume oils by fragrance family, mood, bottle size and occasion.",url:`${origin}/collection`,mainEntity:{"@type":"ItemList",numberOfItems:products.length,itemListElement:products.map((product,index)=>({"@type":"ListItem",position:index+1,name:product.name,url:`${origin}/product/${product.slug}`}))}}}/>
      <header className="collection-intro">
        <p className="eyebrow">THE COLLECTION</p>
        <h1>Your Oil, <em>Your Atmosphere</em></h1>
        <p>{products.length} concentrated perfume oils. Explore by mood, notes, suitability or price.</p>
      </header>
      <CollectionCatalogue products={products} whatsappSettings={{enabled:experience.whatsappEnabled,number:experience.whatsappNumber,defaultMessage:experience.whatsappDefaultMessage}} />
    </main>
  );
}
