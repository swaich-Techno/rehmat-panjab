"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function HomepageCampaign() {
  const heroRef = useRef<HTMLElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const bounds = useRef<DOMRect | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const transition = transitionRef.current;
    if (!hero || !transition) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) hero.dataset.active = String(entry.isIntersecting);
        if (entry.target === transition && entry.isIntersecting) transition.classList.add("is-visible");
      }
    }, { threshold: 0.18 });
    observer.observe(hero);
    observer.observe(transition);
    return () => observer.disconnect();
  }, []);

  const prepareLight = () => {
    if (heroRef.current) bounds.current = heroRef.current.getBoundingClientRect();
  };

  const moveLight = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = bounds.current;
    const hero = heroRef.current;
    if (!rect || !hero) return;
    hero.style.setProperty("--light-x", ((event.clientX - rect.left) / rect.width * 100) + "%");
    hero.style.setProperty("--light-y", ((event.clientY - rect.top) / rect.height * 100) + "%");
  };

  return (
    <>
      <section ref={heroRef} className="campaign-hero" onPointerEnter={prepareLight} onPointerMove={moveLight}>
        <h1 className="sr-only">Rehmat Panjab — Perfume oil, close to skin</h1>
        <div className="campaign-frame">
          <Image
            src="/images/hero/rehmat-panjab-homepage-hero.webp"
            width="1731"
            height="909"
            priority
            unoptimized
            alt="Rehmat Panjab amber perfume oil bottle beside a water ripple"
          />
          <span className="campaign-refraction" aria-hidden="true" />
          <span className="campaign-light" aria-hidden="true" />
          <span className="campaign-water-ripple" aria-hidden="true" />
          <span className="campaign-veil" aria-hidden="true" />
        </div>
        <div className="campaign-intro">
          <p>A quiet fragrance ritual from Panjab. Concentrated oils that settle slowly and stay close.</p>
          <div className="button-row">
            <button className="button button-dark" type="button" onClick={()=>window.dispatchEvent(new Event("open-rehmat-guide"))}>Ask Rehmat Guide</button>
            <Link className="text-link" href="/collection" data-cursor="VIEW">View the collection <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <div ref={transitionRef} className="hero-drop-transition" aria-hidden="true">
        <span className="signature-drop" />
        <i /><i /><i />
      </div>
    </>
  );
}
