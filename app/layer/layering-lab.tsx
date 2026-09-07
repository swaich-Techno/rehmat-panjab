"use client";

import Link from "next/link";
import { useState } from "react";
import { products } from "../../lib/products";

export function LayeringLab() {
  const [selected, setSelected] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const first = products.find((product) => product.id === selected[0]);
  const second = products.find((product) => product.id === selected[1]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  }

  async function sharePair() {
    if (!first || !second) return;
    const text = `${first.name} + ${second.name} — a Rehmat Panjab Layering Lab pairing awaiting house approval.`;
    if (navigator.share) await navigator.share({ title: "Rehmat Panjab Layering Lab", text, url: window.location.href });
    else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setShareMessage("Pairing link copied."); }
  }

  return (
    <section className="layer-page">
      <header className="layer-heading"><p className="eyebrow">Layering lab · Editorial ritual</p><h1>Two oils.<br /><em>One shared atmosphere.</em></h1><p>Select two Rehmat fragrances. We’ll suggest a wearing sequence—never chemistry, always editorial direction.</p></header>
      <div className="layer-workbench">
        <div className="layer-select">
          {products.map((product) => <button type="button" key={product.id} className={selected.includes(product.id) ? "is-selected" : ""} onClick={() => toggle(product.id)} style={{ "--scent": product.color } as React.CSSProperties}><i /><span>{product.number} · {product.name}</span><b>{selected.includes(product.id) ? "Selected" : "Choose"}</b></button>)}
        </div>
        <div className="layer-vessel" aria-label={`${selected.length} of 2 fragrances selected`}>
          <div className="pour-stream stream-a" style={{ "--oil": first?.color ?? "transparent" } as React.CSSProperties} />
          <div className="pour-stream stream-b" style={{ "--oil": second?.color ?? "transparent" } as React.CSSProperties} />
          <div className="shared-glass"><i style={{ "--oil-a": first?.color ?? "transparent", "--oil-b": second?.color ?? "transparent", height: selected.length ? "55%" : "10%" } as React.CSSProperties} /><span>R</span></div>
        </div>
      </div>
      {first && second && <div className="layer-result"><p className="eyebrow">Selected pairing</p><h2>{first.name}<br />+ {second.name}</h2><p>The application order, ratio and combined character are awaiting approval from the house. We will not invent guidance before it is confirmed.</p><div className="button-row"><button className="button button-outline" type="button" onClick={sharePair}>Share pairing</button><Link className="text-link" href={`/product/${first.slug}`}>Explore {first.name} ↗</Link><Link className="text-link" href={`/product/${second.slug}`}>Explore {second.name} ↗</Link></div><small aria-live="polite">{shareMessage || "Both selected formats can be reviewed individually. Checkout remains closed."}</small></div>}
    </section>
  );
}
