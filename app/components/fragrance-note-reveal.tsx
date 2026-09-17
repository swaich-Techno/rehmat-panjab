"use client";

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import type { StorefrontProduct } from "../../lib/catalog";
import { fragranceNotePaletteFor, primaryFragranceNotes } from "../../lib/fragrance-note-reveal";
import { ProductMedia } from "./product-media";

type FragranceNoteRevealProps = {
  product: StorefrontProduct;
  priority?: boolean;
  active: boolean;
  replay: number;
  onActivate: () => void;
  onDismiss: () => void;
};

const crackPaths = [
  "M50 48 36 29 27 20", "M49 47 60 27 67 15", "M51 49 74 39 86 35",
  "M51 51 74 62 88 68", "M49 52 60 74 64 88", "M47 52 31 72 22 80",
  "M46 50 25 52 11 58", "M47 47 30 38 17 34", "M52 46 70 18 79 11",
  "M53 50 83 48 94 43", "M50 53 44 79 38 91", "M46 48 21 24 11 17",
];

export function FragranceNoteReveal({ product, priority = false, active, replay, onActivate, onDismiss }: FragranceNoteRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const palette = fragranceNotePaletteFor(product.slug);
  const notes = primaryFragranceNotes(product.notes);
  const canReveal = Boolean(palette && notes);
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

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && active) {
      event.stopPropagation();
      onDismiss();
    } else if ((event.key === "Enter" || event.key === " ") && canReveal && !event.repeat) {
      event.preventDefault();
      onActivate();
    }
  }

  return <div ref={rootRef} className={`catalogue-card-media fragrance-note-reveal${active ? " is-active" : ""}`} style={style}>
    <button
      className="fragrance-note-trigger"
      type="button"
      aria-label={canReveal ? `Show fragrance notes for ${product.name}` : `Fragrance notes unavailable for ${product.name}`}
      aria-expanded={canReveal && active}
      aria-controls={canReveal && active ? stageId : undefined}
      disabled={!canReveal}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
    >
      <ProductMedia product={product} priority={priority} />
      {canReveal && <span className="fragrance-note-hint" aria-hidden="true">Reveal notes</span>}
    </button>
    {active && palette && notes && <div key={`${product.slug}-${replay}`} id={stageId} className="fragrance-note-stage" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{product.name} fragrance notes</span>
      <svg className="fragrance-light-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {crackPaths.map((path, index) => <path d={path} key={path} style={{ "--crack-index": index } as CSSProperties} />)}
      </svg>
      <span className="fragrance-particles" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
      <span className="fragrance-note-label fragrance-note-top"><small>TOP</small><strong>{notes.top}</strong></span>
      <span className="fragrance-note-label fragrance-note-heart"><small>HEART</small><strong>{notes.heart}</strong></span>
      <span className="fragrance-note-label fragrance-note-base"><small>BASE</small><strong>{notes.base}</strong></span>
    </div>}
  </div>;
}
