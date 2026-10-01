"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { availabilityLabel, firstPrice, type StorefrontProduct } from "../../lib/catalog";
import { formatMoney } from "../../lib/cart";
import { FragranceNoteReveal } from "./fragrance-note-reveal";

type CinematicTodayProps = {
  product: StorefrontProduct;
  alternatives: StorefrontProduct[];
  eyebrow: string;
  headline: string;
  description: string;
};

type MotionTimeline = { pause: () => unknown; play: () => unknown; restart: () => unknown };

export function CinematicToday({ product, alternatives, eyebrow, headline, description }: CinematicTodayProps) {
  const rootRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<MotionTimeline | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 52, y: 38 });
  const inViewRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const userPausedRef = useRef(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const notes = product.notes ? [["Top", product.notes.top], ["Heart", product.notes.heart], ["Base", product.notes.base]] as const : [];
  const price = firstPrice(product);

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = Boolean(connection?.saveData);
    root.dataset.reducedMotion = String(reduced);
    root.dataset.saveData = String(saveData);

    let cancelled = false;
    let cleanupMotion = () => {};

    if (!reduced && !saveData) {
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollModule]) => {
        if (cancelled || !rootRef.current || !sceneRef.current) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const context = gsap.context(() => {
          const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
          entrance
            .fromTo(".today-brand", { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: .65 })
            .fromTo(".today-copy-line", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .72, stagger: .11 }, .18)
            .fromTo(".today-reveal-wrap", { autoAlpha: 0, y: 42, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.15 }, .32)
            .fromTo(".today-live-notes", { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: .75 }, 1.35)
            .fromTo(".today-motion-controls", { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 }, 1.7);
          entranceRef.current = entrance;

          const media = gsap.matchMedia();
          media.add("(min-width: 701px) and (prefers-reduced-motion: no-preference)", () => {
            gsap.timeline({
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "+=60%",
                scrub: .65,
                pin: scene,
                pinSpacing: true,
                invalidateOnRefresh: true,
              },
            })
              .to(".today-copy", { autoAlpha: .18, yPercent: -14, duration: .8 }, 0)
              .to(".today-reveal-wrap", { xPercent: -9, scale: .94, duration: 1 }, 0)
              .to(".today-live-notes", { xPercent: 12, autoAlpha: .12, duration: .8 }, .08)
              .to(".today-scroll-destination", { autoAlpha: 1, y: 0, duration: .48 }, .5);
          });
          media.add("(max-width: 700px) and (prefers-reduced-motion: no-preference)", () => {
            gsap.fromTo(".today-scroll-destination", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, scrollTrigger: { trigger: root, start: "bottom 92%", end: "bottom 66%", scrub: true } });
          });
          cleanupMotion = () => media.revert();
        }, root);
        cleanupMotion = (() => {
          const cleanupMedia = cleanupMotion;
          return () => { cleanupMedia(); context.revert(); entranceRef.current = null; };
        })();
      }).catch(() => {
        root.dataset.motionFallback = "true";
      });
    } else {
      root.dataset.motionFallback = "true";
    }

    const syncPlayback = () => {
      const shouldPause = userPausedRef.current || !inViewRef.current || !pageVisibleRef.current;
      root.dataset.paused = String(shouldPause);
      if (shouldPause) entranceRef.current?.pause(); else entranceRef.current?.play();
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
      root.dataset.visible = String(entry.isIntersecting);
      syncPlayback();
    }, { threshold: .08 });
    observer?.observe(root);
    const visibility = () => {
      pageVisibleRef.current = document.visibilityState === "visible";
      syncPlayback();
    };
    document.addEventListener("visibilitychange", visibility);

    return () => {
      cancelled = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      cleanupMotion();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [product.slug]);

  function moveLight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      rootRef.current?.style.setProperty("--today-light-x", `${pointerRef.current.x}%`);
      rootRef.current?.style.setProperty("--today-light-y", `${pointerRef.current.y}%`);
    });
  }

  function replayScene() {
    setReplay(value => value + 1);
    entranceRef.current?.restart();
  }

  function toggleMotion() {
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setMotionPaused(next);
    if (rootRef.current) rootRef.current.dataset.paused = String(next || !inViewRef.current || !pageVisibleRef.current);
    if (next) entranceRef.current?.pause(); else if (inViewRef.current && pageVisibleRef.current) entranceRef.current?.play();
  }

  return <section ref={rootRef} className="today-cinematic" aria-labelledby="todays-rehmat-heading" data-visible="true" data-paused="false" onPointerMove={moveLight}>
    <div ref={sceneRef} className="today-cinematic-scene">
      <div className="today-stage-poster" aria-hidden="true" />
      <div className="today-atmosphere" aria-hidden="true"><i/><i/><i/><span/><span/></div>
      <div className="today-brand" aria-hidden="true"><span>Rehmat</span><i/>Panjab</div>

      <div className="today-copy">
        <p className="eyebrow light today-copy-line">{eyebrow} · India</p>
        <h1 id="todays-rehmat-heading" className="today-copy-line">Perfume oil,<br/><em>worn close.</em></h1>
        <div className="today-recommendation today-copy-line">
          <span>Today’s Rehmat</span>
          <h2>{product.name}</h2>
          <p>{description}</p>
        </div>
        <div className="today-buying today-copy-line">
          <strong>{price === null ? "Price on request" : `From ${formatMoney(price)}`}</strong>
          <span>{product.enabledSizes.join(" / ")} ml · {availabilityLabel(product)}</span>
        </div>
        <div className="today-actions today-copy-line">
          <Link className="button button-cream" href={`/product/${product.slug}`}>Discover Today’s Rehmat</Link>
          <Link className="button today-find-link" href="/find-your-scent">Find My Scent</Link>
        </div>
      </div>

      <div className="today-reveal-wrap">
        <FragranceNoteReveal product={product} priority active replay={replay} onActivate={replayScene} onDismiss={() => {}} persistent />
        <p className="today-bottle-caption">{headline}</p>
      </div>

      {notes.length ? <dl className="today-live-notes" aria-label={`${product.name} fragrance notes`}>
        {[...notes].reverse().map(([tier, values]) => <div key={tier}><dt>{tier}</dt><dd>{values.join(" · ")}</dd></div>)}
      </dl> : null}

      <div className="today-motion-controls" aria-label="Cinematic scene controls">
        <button type="button" onClick={toggleMotion} aria-pressed={motionPaused}>{motionPaused ? "Play motion" : "Pause motion"}</button>
        <button type="button" onClick={replayScene}>Replay</button>
      </div>

      {alternatives.length ? <nav className="today-alternatives" aria-label="Other daily recommendations">
        <span>Also selected</span>{alternatives.map(item => <Link href={`/product/${item.slug}`} key={item.slug}>{item.name}</Link>)}
      </nav> : null}
      <p className="today-scroll-destination" aria-hidden="true">How would you like to begin?</p>
    </div>
  </section>;
}
