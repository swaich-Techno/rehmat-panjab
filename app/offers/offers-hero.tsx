"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {DIWALI_END_ISO,DIWALI_START_ISO,campaignPhase} from "../../lib/promotions.mjs";

const copy={
  upcoming:{description:"The Diwali offer starts 1 November: eligible live fragrance bottles and tester packs will receive 60% off automatically.",status:"Starts 1 November 2026 · India Standard Time",plaque:"Starts 1 Nov · applied automatically"},
  live:{description:"Diwali — 60% off eligible live fragrance bottles and tester packs, applied automatically. Shipping is excluded and offers do not stack.",status:"Available now · ends 10 November at 11:59 PM IST",plaque:"1–10 Nov · applied automatically"},
  ended:{description:"The 2026 Diwali offer ended on 10 November. Standing Rehmat offers continue under their published eligibility and terms.",status:"Diwali campaign ended · 10 November 2026",plaque:"Offer ended · 10 Nov"},
} as const;

export function OffersHero(){
  const [phase,setPhase]=useState<keyof typeof copy>(()=>campaignPhase(DIWALI_START_ISO,DIWALI_END_ISO));
  useEffect(()=>{const refresh=()=>setPhase(campaignPhase(DIWALI_START_ISO,DIWALI_END_ISO));const timer=window.setInterval(refresh,60_000);return()=>window.clearInterval(timer);},[]);
  const current=copy[phase];
  return <section className="offers-hero" aria-labelledby="offers-heading">
    <div className="offers-hero-copy">
      <p className="eyebrow">The Rehmat edit · verified terms</p>
      <h1 id="offers-heading">A little more<br/><em>to remember.</em></h1>
      <p>{current.description}</p>
      <div className="offers-hero-actions"><Link className="button button-dark" href="#current-offers">View current offers</Link><Link className="text-link" href="/collection">Explore fragrances <span aria-hidden="true">↗</span></Link></div>
      <p className="offers-live-count"><i aria-hidden="true" /> {current.status}</p>
    </div>
    <div className="offers-visual" aria-hidden="true">
      <span className="offers-orbit offers-orbit-one"/><span className="offers-orbit offers-orbit-two"/>
      <Image className="offers-ingredient offers-ingredient-amber" src="/images/fragrance-notes/amber-resin.webp" alt="" width={512} height={512}/>
      <Image className="offers-ingredient offers-ingredient-rose" src="/images/fragrance-notes/rose-petals.webp" alt="" width={512} height={512}/>
      <Image className="offers-bottle" src="/images/bottles/rose-gold-bottle-oil-cutout.webp" alt="" width={1254} height={1254} priority/>
      <div className="offers-glass-plaque"><span>Diwali at Rehmat</span><strong>60% off</strong><small>{current.plaque}</small></div>
    </div>
  </section>;
}
