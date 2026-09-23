import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getExperienceSettings} from "../../../lib/experience-settings";
import {pageMetadata} from "../../../lib/seo";
import {productsForSearchCollection,searchCollections} from "../../../lib/search-collections";
import {getSiteUrl} from "../../../lib/site-url";
import {getStorefrontProducts} from "../../../lib/storefront";
import {JsonLd} from "../../components/json-ld";
import {CollectionCatalogue} from "../collection-catalogue";

export function generateStaticParams(){return searchCollections.map(({slug})=>({slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const collection=searchCollections.find(item=>item.slug===slug);if(!collection)return {};
  return pageMetadata({title:`${collection.title} | Rehmat Panjab India`,description:collection.description,path:`/collection/${collection.slug}`});
}

export default async function SearchCollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const collection=searchCollections.find(item=>item.slug===slug);if(!collection)notFound();
  const [catalogue,experience]=await Promise.all([getStorefrontProducts(),getExperienceSettings()]);
  const products=productsForSearchCollection(collection,catalogue);if(!products.length)notFound();
  const origin=getSiteUrl(),url=`${origin}/collection/${collection.slug}`;
  return <main id="main-content" className="collection-page">
    <JsonLd data={[
      {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:origin},{"@type":"ListItem",position:2,name:"Collection",item:`${origin}/collection`},{"@type":"ListItem",position:3,name:collection.name,item:url}]},
      {"@context":"https://schema.org","@type":"CollectionPage",name:collection.title,description:collection.description,url,mainEntity:{"@type":"ItemList",numberOfItems:products.length,itemListElement:products.map((product,index)=>({"@type":"ListItem",position:index+1,name:product.name,url:`${origin}/product/${product.slug}`}))}},
    ]}/>
    <header className="collection-intro"><p className="eyebrow">India fragrance edit</p><h1>{collection.name}</h1><p>{collection.intro} Showing {products.length} current {products.length===1?"fragrance":"fragrances"}.</p></header>
    <nav className="seo-collection-nav" aria-label="Related perfume oil collections"><Link href="/collection">All perfume oils</Link>{searchCollections.filter(item=>item.slug!==collection.slug).map(item=><Link key={item.slug} href={`/collection/${item.slug}`}>{item.name}</Link>)}</nav>
    <CollectionCatalogue products={products} whatsappSettings={{enabled:experience.whatsappEnabled,number:experience.whatsappNumber,defaultMessage:experience.whatsappDefaultMessage}}/>
  </main>;
}
