import type {Metadata} from "next";
import Link from "next/link";
import {guides} from "../../lib/guides";
import {pageMetadata} from "../../lib/seo";
import {getSiteUrl} from "../../lib/site-url";
import {JsonLd} from "../components/json-ld";

export const metadata:Metadata=pageMetadata({title:"Attar & Perfume Oil Guides | Rehmat Panjab India",description:"Practical Rehmat Panjab guides to perfume oil, attar application, fragrance notes and choosing oud, musk, floral or fruity scents.",path:"/guides"});

export default function GuidesPage(){const origin=getSiteUrl();return <main id="main-content" className="legal-page guide-library"><JsonLd data={{"@context":"https://schema.org","@type":"CollectionPage",name:"Rehmat Panjab fragrance guides",url:`${origin}/guides`,mainEntity:{"@type":"ItemList",itemListElement:guides.map((guide,index)=>({"@type":"ListItem",position:index+1,name:guide.title,url:`${origin}/guides/${guide.slug}`}))}}}/><p className="eyebrow">Fragrance knowledge</p><h1>Attar &amp; Perfume Oil Guides</h1><p>Clear, practical guidance from Rehmat Panjab for choosing and wearing concentrated perfume oils.</p><div className="guide-index">{guides.map(guide=><article key={guide.slug}><p className="eyebrow">Updated {guide.updated}</p><h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2><p>{guide.description}</p><Link className="text-link" href={`/guides/${guide.slug}`}>Read the guide <span aria-hidden="true">→</span></Link></article>)}</div></main>;}
