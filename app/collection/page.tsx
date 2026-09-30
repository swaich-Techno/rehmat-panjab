import type { Metadata } from "next";
import { getStorefrontProducts } from "../../lib/storefront";
import { CollectionCatalogue } from "./collection-catalogue";
import { getExperienceSettings } from "../../lib/experience-settings";
import {JsonLd} from "../components/json-ld";
import {pageMetadata} from "../../lib/seo";
import {getSiteUrl} from "../../lib/site-url";
import Link from "next/link";
import {searchCollections} from "../../lib/search-collections";

export const metadata: Metadata = pageMetadata({title:"The Perfume Oil Collection",description:"Explore Rehmat Panjab concentrated perfume oils by fragrance family, mood, bottle size, occasion and availability.",path:"/collection"});

export default async function CollectionPage() {
  const [catalogue,experience] = await Promise.all([getStorefrontProducts(),getExperienceSettings()]);
  const products=catalogue.filter(product=>product.status==="active");
  const audienceCategories=[
    {slug:"mens-perfume-oils",label:"For Men",description:"Fresh, woody, spicy and oud-led",count:products.filter(product=>product.suitability==="men").length},
    {slug:"womens-perfume-oils",label:"For Women",description:"Floral, fruity, musky and gourmand",count:products.filter(product=>product.suitability==="women").length},
    {slug:"unisex-perfume-oils",label:"Unisex",description:"Balanced profiles chosen by mood",count:products.filter(product=>product.suitability==="unisex").length},
  ];
  const origin=getSiteUrl();
  return (
    <main id="main-content" className="collection-page">
      <JsonLd data={{"@context":"https://schema.org","@type":"CollectionPage",name:"The Rehmat Panjab Perfume Oil Collection",description:"Explore concentrated perfume oils by fragrance family, mood, bottle size and occasion.",url:`${origin}/collection`,mainEntity:{"@type":"ItemList",numberOfItems:products.length,itemListElement:products.map((product,index)=>({"@type":"ListItem",position:index+1,name:product.name,url:`${origin}/product/${product.slug}`}))}}}/>
      <header className="collection-intro">
        <p className="eyebrow">THE COLLECTION</p>
        <h1>Your Oil, <em>Your Atmosphere</em></h1>
        <p>{products.length} concentrated perfume oils. Explore by mood, notes, suitability or price.</p>
      </header>
      <section className="audience-collections" aria-labelledby="audience-collections-title">
        <div className="audience-collections-heading"><div><p className="eyebrow">SHOP BY CATEGORY</p><h2 id="audience-collections-title">Find your fragrance direction.</h2></div><p>For Men, For Women and Unisex are helpful edits, not rules. Choose what feels right on your skin.</p></div>
        <nav className="audience-collection-grid" aria-label="Shop perfume oils by audience">
          {audienceCategories.map((category,index)=><Link key={category.slug} className="audience-collection-card" data-audience={category.slug.split("-")[0]} href={`/collection/${category.slug}`}>
            <span className="audience-collection-number" aria-hidden="true">0{index+1}</span><span><strong>{category.label}</strong><small>{category.description}</small></span><span className="audience-collection-count">{category.count} {category.count===1?"oil":"oils"}</span><span className="audience-collection-arrow" aria-hidden="true">&rarr;</span>
          </Link>)}
        </nav>
      </section>
      <nav className="seo-collection-nav" aria-label="Browse perfume oil collections">{searchCollections.map(collection=><Link key={collection.slug} href={`/collection/${collection.slug}`}>{collection.name}</Link>)}</nav>
      <CollectionCatalogue products={products} showAudienceFilter whatsappSettings={{enabled:experience.whatsappEnabled,number:experience.whatsappNumber,defaultMessage:experience.whatsappDefaultMessage}} />
    </main>
  );
}
