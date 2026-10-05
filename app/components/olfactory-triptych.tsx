"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { StorefrontProduct } from "../../lib/catalog";
import { fragranceNotePaletteFor, ingredientVisualsFor } from "../../lib/fragrance-note-reveal";

type Tier = "top" | "heart" | "base";

const tierCopy: Record<Tier, { chapter: string; title: string }> = {
  top: { chapter: "First light", title: "The Opening" },
  heart: { chapter: "The character", title: "At Its Heart" },
  base: { chapter: "What remains", title: "The Drydown" },
};

export function OlfactoryTriptych({ product }: { product: StorefrontProduct }) {
  const [activeTier, setActiveTier] = useState<Tier | "all">("base");
  const palette = fragranceNotePaletteFor(product.slug);
  if (!product.notes || !palette) return null;

  const visuals = ingredientVisualsFor(product.slug, product.notes);
  const groups = (["top", "heart", "base"] as const).map((tier) => ({
    tier,
    notes: product.notes?.[tier] ?? [],
    visuals: visuals.filter((visual) => visual.tier === tier),
    description: tier === "top" ? product.journey?.opening : tier === "heart" ? product.journey?.heart : product.journey?.drydown,
  }));
  const style = {
    "--triptych-light": palette.light,
    "--triptych-middle": palette.middle,
    "--triptych-deep": palette.deep,
  } as CSSProperties;

  return <section className="olfactory-triptych" style={style} data-active-tier={activeTier} aria-labelledby={`triptych-${product.slug}`}>
    <header className="olfactory-triptych-heading">
      <div>
        <p className="eyebrow">The olfactory triptych</p>
        <h3 id={`triptych-${product.slug}`}>Three movements.<br/><em>One atmosphere.</em></h3>
      </div>
      <button type="button" data-cursor-lens onClick={() => setActiveTier("all")} aria-pressed={activeTier === "all"}>Reveal all notes</button>
    </header>
    <div className="olfactory-triptych-stage">
      <Image className="olfactory-triptych-seal" src="/images/brand/rehmat-panjab-crest.webp" alt="" width={640} height={640} aria-hidden="true" />
      {groups.map((group) => {
        const selected = activeTier === "all" || activeTier === group.tier;
        const sequence = group.tier === "base" ? 0 : group.tier === "heart" ? 1 : 2;
        return <button
          key={group.tier}
          type="button"
          className={`olfactory-tier olfactory-tier-${group.tier}`}
          style={{ "--triptych-sequence": sequence } as CSSProperties}
          aria-pressed={selected}
          onClick={() => setActiveTier(group.tier)}
          data-cursor-lens
        >
          <span className="olfactory-tier-number">0{sequence + 1}</span>
          <span className="olfactory-tier-chapter">{tierCopy[group.tier].chapter}</span>
          <strong>{tierCopy[group.tier].title}</strong>
          <span className="olfactory-tier-visuals" aria-hidden="true">
            {group.visuals.slice(0, 3).map((visual) => <Image key={`${group.tier}-${visual.note}`} src={visual.asset} alt="" width={512} height={512} />)}
          </span>
          <span className="olfactory-tier-notes">{group.notes.join(" · ")}</span>
          <small>{group.description ?? `${group.notes.join(", ")} shape the ${group.tier} of the fragrance.`}</small>
        </button>;
      })}
    </div>
    <p className="sr-only" aria-live="polite">{activeTier === "all" ? `All notes revealed: ${groups.flatMap(group => group.notes).join(", ")}` : `${tierCopy[activeTier].title}: ${product.notes[activeTier].join(", ")}`}</p>
  </section>;
}
