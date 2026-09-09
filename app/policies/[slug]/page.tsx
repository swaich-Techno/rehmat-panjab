import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {getPolicyTemplate,policySlugs,type PolicySlug} from "../../../lib/policy-templates";
import {getPublishedPolicyRecord} from "../../../lib/store-settings";
export const dynamic="force-dynamic";

export function generateStaticParams(){return policySlugs.map(slug=>({slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  if(!policySlugs.includes(slug as PolicySlug))return {};
  const published=await getPublishedPolicyRecord();
  if(!published)return {robots:{index:false,follow:false}};
  const policy=getPolicyTemplate(slug as PolicySlug,published.settings);
  return {title:policy.title,description:policy.description,alternates:{canonical:`/policies/${slug}`},openGraph:{title:policy.title,description:policy.description,url:`/policies/${slug}`}};
}

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!policySlugs.includes(slug as PolicySlug))notFound();
  const published=await getPublishedPolicyRecord();
  if(!published)notFound();
  const policy=getPolicyTemplate(slug as PolicySlug,published.settings);
  const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${published.effectiveDate}T00:00:00+05:30`));
  return <main id="main-content" className="legal-page policy-document">
    <header><p className="eyebrow">Rehmat Panjab · Policy {published.version}</p><h1>{policy.title}</h1><p><strong>Last updated:</strong> {date}</p><p>{policy.description}</p></header>
    {policy.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.bullets&&<ul>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}
    <nav className="policy-links" aria-label="Customer policies">{policySlugs.filter(item=>item!==slug).map(item=><Link key={item} href={`/policies/${item}`}>{getPolicyTemplate(item,published.settings).title}</Link>)}</nav>
  </main>;
}
