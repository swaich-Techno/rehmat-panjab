import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {guides} from "../../../lib/guides";
import {pageMetadata} from "../../../lib/seo";
import {getSiteUrl} from "../../../lib/site-url";
import {getStorefrontProducts} from "../../../lib/storefront";
import {JsonLd} from "../../components/json-ld";

export function generateStaticParams(){return guides.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const guide=guides.find(item=>item.slug===slug);return guide?pageMetadata({title:`${guide.title} | Rehmat Panjab India`,description:guide.description,path:`/guides/${guide.slug}`}):{};}

export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const guide=guides.find(item=>item.slug===slug);if(!guide)notFound();
  const products=(await getStorefrontProducts()).filter(product=>product.status==="active").slice(0,4);const origin=getSiteUrl(),url=`${origin}/guides/${guide.slug}`;
  return <main id="main-content" className="legal-page guide-article"><JsonLd data={[
    {"@context":"https://schema.org","@type":"Article",headline:guide.title,description:guide.description,dateModified:guide.updated,datePublished:guide.updated,author:{"@type":"Organization",name:"Rehmat Panjab",url:origin},publisher:{"@type":"Organization",name:"Rehmat Panjab",url:origin,logo:{"@type":"ImageObject",url:`${origin}/icon.png`}},mainEntityOfPage:url},
    {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:origin},{"@type":"ListItem",position:2,name:"Guides",item:`${origin}/guides`},{"@type":"ListItem",position:3,name:guide.title,item:url}]},
    {"@context":"https://schema.org","@type":"FAQPage",mainEntity:guide.faqs.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}}))},
  ]}/><header><p className="eyebrow">Rehmat Panjab fragrance guide</p><h1>{guide.title}</h1><p>{guide.description}</p><p><strong>Responsible brand:</strong> Rehmat Panjab · <strong>Updated:</strong> 22 September 2026</p></header>{guide.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.bullets&&<ul>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}<section><h2>Explore current fragrances</h2><div className="guide-product-links">{products.map(product=><Link key={product.slug} href={`/product/${product.slug}`}>{product.name}<span>{product.subtitle}</span></Link>)}</div><nav className="policy-links" aria-label="Related collections">{guide.collections.map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></section><section><h2>Frequently asked questions</h2>{guide.faqs.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section><Link className="text-link" href="/guides">All fragrance guides</Link></main>;
}
