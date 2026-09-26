"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { formatMoney } from "../../lib/cart";
import { LAUNCH_TESTER_SLUGS, APPROVED_TESTERS, TESTER_PACK_SIZES, TESTER_PACK_RULES, testerPackStartingPrice } from "../../lib/tester-packs";
import { fragranceNotePaletteFor } from "../../lib/fragrance-note-reveal";
import { INSPIRATION_DISCLAIMER } from "../../lib/products";

const launchTesters = LAUNCH_TESTER_SLUGS.map((slug) => APPROVED_TESTERS.find((tester) => tester.slug === slug)!).filter(Boolean);

export function TesterPreview(){
  const [copied,setCopied]=useState(false);
  const prices=APPROVED_TESTERS.map(item=>item.pricePaise);
  async function copy(){try{await navigator.clipboard.writeText("NEW");setCopied(true);window.setTimeout(()=>setCopied(false),2000);}catch{setCopied(false);}}
  return <section className="tester-preview" aria-labelledby="tester-preview-heading">
    <div className="tester-preview-copy"><p className="eyebrow light">3 ml discovery</p><h2 id="tester-preview-heading">Discover the 3 ml Tester Collection</h2><p>Explore individual fragrances or build your own set of 2, 3 or 5. Find the scent that feels like you before choosing a larger bottle.</p><div className="tester-preview-actions"><Link className="button button-cream" href="/testers">Build Your Tester Pack</Link><Link className="button tester-secondary-action" href="/testers#individual-testers">Explore Individual Testers</Link></div></div>
    <div className="tester-showcase" aria-label="3 ml tester fragrances">
      {launchTesters.map((tester)=>{const palette=fragranceNotePaletteFor(tester.slug);return <article className="tester-showcase-card" key={tester.slug} style={{"--tester-light":palette?.light,"--tester-middle":palette?.middle,"--tester-deep":palette?.deep} as CSSProperties}>
        <div className="tester-showcase-visual"><span className="tester-showcase-highlight" aria-hidden="true"/><Image src="/images/bottles/rose-gold-bottle-oil.webp" alt={`${tester.name} 3 ml concentrated perfume oil presentation`} width={960} height={1200} sizes="(max-width: 600px) 68vw, 220px"/></div>
        <div><h3>{tester.name}</h3>{tester.inspirationLine&&<small>{tester.inspirationLine}</small>}<p>{formatMoney(tester.pricePaise)} · 3 ml</p><span>Available now</span><Link href={`/product/${tester.slug}`}>View tester</Link></div>
      </article>;})}
    </div>
    <div className="tester-pack-cards">{TESTER_PACK_SIZES.map(size=><Link href={`/testers?pack=${size}`} className="tester-pack-card" key={size}><span>Pick Any {size}</span><strong>From {formatMoney(testerPackStartingPrice(prices,size)??0)}</strong><small>3 ml each · {TESTER_PACK_RULES[size].discountPercent}% pack saving</small></Link>)}</div>
    <div className="tester-coupon"><p><strong>New here?</strong> Get 15% off your first completed purchase with code <b>NEW</b>.</p><button type="button" className="text-button" onClick={copy}>{copied?"Copied":"Copy code"}</button><Link href="/policies/terms">Eligibility and terms</Link></div>
    <p className="tester-draft-note">Pack prices are calculated securely from current eligible tester prices and the approved pack discounts.</p>
    <p className="inspiration-disclaimer">{INSPIRATION_DISCLAIMER}</p>
  </section>;
}
