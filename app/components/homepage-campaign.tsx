"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function HomepageCampaign() {
  const heroRef = useRef<HTMLElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const bounds = useRef<DOMRect | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const transition = transitionRef.current;
    if (!hero || !transition) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frameRef.current = null;
      if (reducedMotion.matches) {
        hero.style.setProperty("--scene-progress", "1");
        hero.dataset.chapter = "3";
        return;
      }
      const rect = hero.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / range);
      hero.style.setProperty("--scene-progress", progress.toFixed(4));
      hero.dataset.chapter = progress < 0.27 ? "0" : progress < 0.55 ? "1" : progress < 0.8 ? "2" : "3";
    };
    const requestUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) hero.dataset.active = String(entry.isIntersecting);
        if (entry.target === transition && entry.isIntersecting) transition.classList.add("is-visible");
      }
    }, { threshold: 0.12 });

    observer.observe(hero);
    observer.observe(transition);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    reducedMotion.addEventListener("change", requestUpdate);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const prepareLight = () => {
    if (heroRef.current) bounds.current = heroRef.current.getBoundingClientRect();
  };

  const moveLight = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = bounds.current;
    const hero = heroRef.current;
    if (!rect || !hero) return;
    hero.style.setProperty("--light-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    hero.style.setProperty("--light-y", `${((event.clientY - rect.top) / Math.min(rect.height, window.innerHeight)) * 100}%`);
  };

  return (
    <>
      <section ref={heroRef} className="campaign-hero campaign-cinema" onPointerEnter={prepareLight} onPointerMove={moveLight}>
        <div className="campaign-sticky">
          <h1 className="sr-only">Rehmat Panjab — perfume oil, close to skin</h1>
          <div className="campaign-scene campaign-scene-wide" aria-hidden="true">
            <Image src="/images/hero/rehmat-panjab-homepage-hero.webp" width="1731" height="909" priority unoptimized sizes="100vw" alt="" />
          </div>
          <div className="campaign-scene campaign-scene-macro" aria-hidden="true">
            <Image src="/images/hero/rehmat-panjab-homepage-hero.webp" width="1731" height="909" priority unoptimized sizes="100vw" alt="" />
            <span className="campaign-glass-sweep" />
          </div>
          <div className="campaign-scene campaign-scene-bottle" aria-hidden="true">
            <div className="campaign-atmosphere"><Image src="/images/products/campaign/musk-rizali-hero.webp" width="1200" height="1500" unoptimized sizes="100vw" alt="" /></div>
            <div className="campaign-bottle"><Image src="/images/bottles/rose-gold-bottle-oil.webp" width="960" height="1200" priority unoptimized sizes="(max-width: 700px) 66vw, 34vw" alt="" /></div>
            <span className="campaign-bottle-shadow" />
          </div>
          <span className="campaign-refraction" aria-hidden="true" />
          <span className="campaign-light" aria-hidden="true" />
          <span className="campaign-water-ripple" aria-hidden="true" />
          <span className="campaign-film-grain" aria-hidden="true" />

          <div className="campaign-copy campaign-copy-opening">
            <p className="eyebrow light">Concentrated perfume oils · Panjab</p>
            <p>Fragrance, worn close.</p>
          </div>
          <div className="campaign-copy campaign-copy-detail">
            <p className="eyebrow light">A slower ritual</p>
            <p>One drop. Warm skin.<br />A presence that unfolds.</p>
          </div>
          <div className="campaign-copy campaign-copy-finale">
            <p className="eyebrow light">Rehmat Panjab</p>
            <p>Find the atmosphere<br />that feels like yours.</p>
            <div className="button-row">
              <Link className="button button-cream" href="/collection" data-cursor="VIEW">Enter the collection</Link>
              <button className="campaign-guide-link" type="button" onClick={() => window.dispatchEvent(new Event("open-rehmat-guide"))}>Ask Rehmat Guide</button>
            </div>
          </div>

          <nav className="campaign-progress" aria-label="Campaign chapters">
            <span>01</span><i /><span>04</span>
          </nav>
          <Link className="campaign-skip" href="#featured-fragrances">Skip story <span aria-hidden="true">↓</span></Link>
          <p className="campaign-scroll-cue" aria-hidden="true">Scroll to unfold <span /></p>
        </div>
      </section>

      <section className="campaign-intro" aria-label="Rehmat Panjab introduction">
        <p>A quiet fragrance ritual from Panjab. Concentrated oils that settle slowly and stay close.</p>
        <Link className="text-link" href="/discover" data-cursor="VIEW">Discover the house <span aria-hidden="true">↗</span></Link>
      </section>
      <div ref={transitionRef} className="hero-drop-transition" aria-hidden="true">
        <span className="signature-drop" />
        <i /><i /><i />
      </div>
    </>
  );
}
