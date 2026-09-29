"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { availabilityLabel, firstPrice, type StorefrontProduct } from "../../lib/catalog";
import { formatMoney } from "../../lib/cart";
import { FragranceNoteReveal } from "./fragrance-note-reveal";
import { OpenGuideButton } from "./open-guide-button";
import { ProductAddButton } from "./product-add-button";
import type { DailyScene } from "../../lib/daily-rehmat";

type CinematicTodayProps = {
  product: StorefrontProduct;
  alternatives: StorefrontProduct[];
  eyebrow: string;
  headline: string;
  description: string;
  scene: DailyScene;
};

export function CinematicToday({ product, alternatives, eyebrow, headline, description, scene }: CinematicTodayProps) {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 50, y: 42 });
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const notes = product.notes ? [["Top", product.notes.top], ["Heart", product.notes.heart], ["Base", product.notes.base]] as const : [];
  const price = firstPrice(product);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { root.dataset.visible = String(entry.isIntersecting); }, { threshold: 0.08 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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

  function play() {
    setActive(true);
    setReplay(value => value + 1);
  }

  return <section ref={rootRef} className="today-cinematic" aria-labelledby="todays-rehmat-heading" data-visible="true" data-scene={scene.id} style={{"--today-accent":scene.accent,"--today-glow":scene.glow,"--today-depth":scene.depth} as CSSProperties} onPointerMove={moveLight}>
    <div className="today-cinematic-stage" data-ready={ready || undefined}>
      <div className="today-stage-poster" aria-hidden="true" />
      <div className="today-atmosphere" aria-hidden="true"><i/><i/><i/><b/><b/><b/></div>
      <div className="today-stage-heading"><p className="eyebrow light">{eyebrow}</p><h1 id="todays-rehmat-heading">{headline}</h1></div>
      <div className="today-reveal-wrap"><FragranceNoteReveal product={product} priority active={active} replay={replay} onActivate={play} onDismiss={() => setActive(false)} persistent /></div>
      <div className="today-mobile-offer"><span>{product.name}</span><strong>{price === null ? "Price on request" : `From ${formatMoney(price)}`}</strong><Link href={`/product/${product.slug}`}>View details</Link></div>
      <button className="today-replay" type="button" onClick={play} aria-label={`Replay fragrance notes for ${product.name}`}>Replay notes <span aria-hidden="true">↻</span></button>
      <p className="today-stage-caption">{scene.label} · Base · heart · top</p>
    </div>
    <aside className="today-cinematic-panel" aria-label={`Today's recommendation: ${product.name}`}>
      <div><p className="eyebrow">Today’s Rehmat · India</p><p className="today-panel-kicker">{description}</p><h2>{product.name}</h2><p className="today-panel-description">{product.microDescription || product.summary || product.atmosphere}</p></div>
      {notes.length ? <dl className="today-note-list">{notes.map(([tier, values]) => <div key={tier}><dt>{tier}</dt><dd>{values.join(" · ")}</dd></div>)}</dl> : null}
      <div className="today-buying"><strong>{price === null ? "Price on request" : `From ${formatMoney(price)}`}</strong><span>{product.enabledSizes.join(" / ")} ml · {availabilityLabel(product)}</span></div>
      <div className="today-actions"><Link className="button button-cream" href={`/product/${product.slug}`}>View this fragrance</Link><ProductAddButton product={product} className="button button-outline" /></div>
      {alternatives.length ? <nav className="today-alternatives" aria-label="Other recommendations"><span>Also selected</span>{alternatives.map(item => <Link href={`/product/${item.slug}`} key={item.slug}>{item.name}</Link>)}</nav> : null}
      <OpenGuideButton className="today-guide-link" />
    </aside>
  </section>;
}
