"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import type { StorefrontProduct } from "../../lib/catalog";
import { fragranceNotePaletteFor, ingredientVisualsFor, primaryFragranceNotes } from "../../lib/fragrance-note-reveal";
import { ProductMedia } from "./product-media";

type FragranceNoteRevealProps = {
  product: StorefrontProduct;
  priority?: boolean;
  active: boolean;
  replay: number;
  onActivate: () => void;
  onDismiss: () => void;
};

const ingredientTiers = [
  { visual: 2, tier: "Base", bottom: "39%", size: "70px", delay: "520ms", drift: "-16px" },
  { visual: 1, tier: "Heart", bottom: "57%", size: "66px", delay: "900ms", drift: "14px" },
  { visual: 0, tier: "Top", bottom: "74%", size: "62px", delay: "1280ms", drift: "-10px" },
] as const;

export function FragranceNoteReveal({ product, priority = false, active, replay, onActivate, onDismiss }: FragranceNoteRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transientReveal = useRef(false);
  const palette = fragranceNotePaletteFor(product.slug);
  const notes = primaryFragranceNotes(product.notes);
  const visuals = ingredientVisualsFor(product.slug, product.notes);
  const canReveal = Boolean(palette && notes);
  const noteGroups = [
    { label: "Top", notes: product.notes?.top.filter(Boolean) ?? [] },
    { label: "Heart", notes: product.notes?.heart.filter(Boolean) ?? [] },
    { label: "Base", notes: product.notes?.base.filter(Boolean) ?? [] },
  ];
  const noteSummary = noteGroups.flatMap((group) => group.notes).join(", ");
  const stageId = `fragrance-notes-${product.slug}`;
  const style = palette ? ({
    "--note-light": palette.light,
    "--note-middle": palette.middle,
    "--note-deep": palette.deep,
  } as CSSProperties) : undefined;

  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) onDismiss();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [active, onDismiss]);

  useEffect(() => {
    if (!active) return;
    const dismiss = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [active, onDismiss]);

  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  function queueReveal() {
    if (active || !canReveal || typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    revealTimer.current = setTimeout(() => { transientReveal.current = true; onActivate(); }, 260);
  }
  function cancelQueuedReveal() { if (revealTimer.current) clearTimeout(revealTimer.current); revealTimer.current = null; }
  function leaveReveal(event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) {
    cancelQueuedReveal();
    if ("relatedTarget" in event && event.relatedTarget instanceof Node && rootRef.current?.contains(event.relatedTarget)) return;
    if (transientReveal.current) { transientReveal.current = false; onDismiss(); }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && active) {
      event.stopPropagation();
      onDismiss();
    }
  }

  return <div ref={rootRef} className={`catalogue-card-media fragrance-note-reveal${active ? " is-active" : ""}`} style={style} onMouseEnter={queueReveal} onMouseLeave={leaveReveal} onFocus={queueReveal} onBlur={leaveReveal}>
    <button
      className="fragrance-note-trigger"
      type="button"
      aria-label={canReveal ? `Show fragrance notes for ${product.name}` : `Fragrance notes unavailable for ${product.name}`}
      aria-expanded={canReveal && active}
      aria-controls={canReveal && active ? stageId : undefined}
      disabled={!canReveal}
      onClick={() => { cancelQueuedReveal(); transientReveal.current = false; onActivate(); }}
      onKeyDown={handleKeyDown}
    >
      <ProductMedia product={product} priority={priority} />
      {canReveal && <span className="fragrance-note-hint" aria-hidden="true">Reveal notes</span>}
    </button>
    {active && palette && notes && <div key={`${product.slug}-${replay}`} id={stageId} className="fragrance-note-stage" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{product.name} fragrance ingredients: {noteSummary}</span>
      <span className="fragrance-liquid-bloom" aria-hidden="true" />
      <span className="fragrance-bottle-cap" aria-hidden="true" />
      <span className="fragrance-particles" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
      <span className="fragrance-note-map" aria-hidden="true">
        {[...noteGroups].reverse().map((group) => <span key={group.label}>
          <b>{group.label}</b>
          <small>{group.notes.join(" · ")}</small>
        </span>)}
      </span>
      {visuals.length > 0 && <span className="fragrance-ingredients">
        {ingredientTiers.map((drop) => {
          const visual = visuals[drop.visual % visuals.length];
          const dropStyle = {
            "--ingredient-bottom": drop.bottom,
            "--ingredient-size": drop.size,
            "--ingredient-delay": drop.delay,
            "--ingredient-drift": drop.drift,
          } as CSSProperties;
          return <i
            className="fragrance-ingredient"
            data-ingredient-key={visual.key}
            data-note-tier={drop.tier.toLowerCase()}
            key={`${drop.tier}-${visual.key}`}
            style={dropStyle}
            role="img"
            aria-label={`${drop.tier} note: ${visual.note}`}
            tabIndex={0}
            title={visual.note}
          >
            <Image src={visual.asset} alt="" width={512} height={512} draggable={false} />
            <span className="fragrance-ingredient-name" aria-hidden="true"><b>{drop.tier}</b>{visual.note}</span>
          </i>;
        })}
      </span>}
    </div>}
  </div>;
}
