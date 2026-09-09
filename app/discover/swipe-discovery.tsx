"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { products } from "../../lib/products";

export function SwipeDiscovery() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const startX = useRef<number | null>(null);
  const product = products[index % products.length];

  function next(save: boolean) {
    if (save) setSaved((current) => current.includes(product.id) ? current : [...current, product.id]);
    setIndex((current) => current + 1);
  }

  return (
    <section className="discover-page">
      <header><p className="eyebrow">Browse by instinct · {String((index % products.length) + 1).padStart(2, "0")} / {String(products.length).padStart(2,"0")}</p><h1>Follow an<br />atmosphere.</h1><p>Swipe or use the controls. Saved choices stay in this session until you sign in.</p></header>
      <div className={`discovery-card scent-${product.id}`} onPointerDown={(event) => { startX.current = event.clientX; }} onPointerUp={(event) => { if (startX.current === null) return; const delta = event.clientX - startX.current; if (Math.abs(delta) > 70) next(delta > 0); startX.current = null; }}>
        <Image src={product.image} alt={`${product.name} campaign`} fill priority unoptimized sizes="(max-width: 700px) 92vw, 520px" />
        <div className="discovery-shade" />
        <div className="discovery-copy"><span>{product.number}</span><h2>{product.name}</h2><p>{product.subtitle}</p></div>
      </div>
      <div className="discovery-controls">
        <button type="button" onClick={() => next(false)}><i aria-hidden="true">×</i><span>Not for me</span></button>
        <Link href={`/product/${product.slug}`}><i aria-hidden="true">↑</i><span>Explore</span></Link>
        <button type="button" onClick={() => next(true)}><i aria-hidden="true">+</i><span>Save</span></button>
      </div>
      <p className="saved-count" aria-live="polite">{saved.length ? `${saved.length} saved this session` : "Swipe right to save"}</p>
    </section>
  );
}
