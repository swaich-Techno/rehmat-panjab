import type { Metadata } from "next";
import Image from "next/image";
import { getStorefrontProducts } from "../../lib/storefront";
import { APPROVED_TESTERS } from "../../lib/tester-packs";
import { pageMetadata } from "../../lib/seo";
import { TesterBuilder } from "./tester-builder";
import { INSPIRATION_DISCLAIMER } from "../../lib/products";

export const metadata:Metadata=pageMetadata({title:"Build Your 3 ml Tester Pack",description:"Choose two, three or five different Rehmat Panjab fragrance testers.",path:"/testers"});

export default async function TestersPage({searchParams}:{searchParams:Promise<{pack?:string}>}){
  const requestedPack=Number((await searchParams).pack);
  const catalogue=await getStorefrontProducts();
  const bySlug=new Map(catalogue.map(product=>[product.slug,product]));
  const products=APPROVED_TESTERS.map(tester=>{const product=bySlug.get(tester.slug);return {...tester,inspirationLine:product?.inspirationLine??tester.inspirationLine,productId:product?.databaseId??tester.slug,image:product?.image??"/images/bottles/rose-gold-bottle-oil.webp",imageAlt:product?.imageAlt??`${tester.name} 3 ml tester presentation`,notes:product?.notes??null};});
  return <main id="main-content" className="tester-page"><header className="tester-hero"><div><p className="eyebrow light">Build your discovery set</p><h1>Meet your Rehmat.</h1><p>Choose distinct fragrances in 3 ml formats before committing to a full bottle.</p></div><figure><Image src="/images/bottles/rose-gold-bottle-oil.webp" width={960} height={1200} priority alt="Rehmat Panjab 3 ml concentrated perfume oil bottle"/><figcaption>3 ml concentrated perfume oil tester</figcaption></figure></header><TesterBuilder products={products} initialPackSize={requestedPack}/><p className="inspiration-disclaimer">{INSPIRATION_DISCLAIMER}</p></main>;
}
