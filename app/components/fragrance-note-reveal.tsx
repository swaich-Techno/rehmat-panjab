"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
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

const ingredientDrops = [
  { visual: 0, left: "4%", bottom: "7%", size: "58px", delay: "350ms", duration: "920ms", drift: "14px", start: "-34deg", end: "8deg" },
  { visual: 1, left: "18%", bottom: "4%", size: "48px", delay: "510ms", duration: "980ms", drift: "-18px", start: "29deg", end: "-7deg" },
  { visual: 2, left: "31%", bottom: "8%", size: "43px", delay: "690ms", duration: "900ms", drift: "12px", start: "-24deg", end: "5deg" },
  { visual: 0, left: "64%", bottom: "6%", size: "51px", delay: "430ms", duration: "1040ms", drift: "-15px", start: "32deg", end: "-9deg" },
  { visual: 1, left: "78%", bottom: "9%", size: "44px", delay: "620ms", duration: "940ms", drift: "16px", start: "-27deg", end: "6deg" },
  { visual: 2, left: "87%", bottom: "4%", size: "55px", delay: "790ms", duration: "980ms", drift: "-12px", start: "38deg", end: "-6deg" },
  { visual: 0, left: "10%", bottom: "17%", size: "37px", delay: "760ms", duration: "930ms", drift: "20px", start: "-31deg", end: "11deg" },
  { visual: 2, left: "73%", bottom: "17%", size: "39px", delay: "900ms", duration: "900ms", drift: "-18px", start: "25deg", end: "-8deg" },
] as const;

export function FragranceNoteReveal({ product, priority = false, active, replay, onActivate, onDismiss }: FragranceNoteRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const palette = fragranceNotePaletteFor(product.slug);
  const notes = primaryFragranceNotes(product.notes);
  const visuals = ingredientVisualsFor(product.slug, product.notes);
  const canReveal = Boolean(palette && notes && visuals.length);
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
    {active && palette && notes && visuals.length > 0 && <div key={`${product.slug}-${replay}`} id={stageId} className="fragrance-note-stage" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{product.name} fragrance ingredients: {noteSummary}</span>
      <span className="fragrance-liquid-bloom" aria-hidden="true" />
      <span className="fragrance-particles" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
      <span className="fragrance-note-map" aria-hidden="true">
        {noteGroups.map((group) => <span key={group.label}>
          <b>{group.label}</b>
          <small>{group.notes.join(" · ")}</small>
        </span>)}
      </span>
      <span className="fragrance-ingredients">
        {ingredientDrops.map((drop, index) => {
          const visual = visuals[drop.visual % visuals.length];
          const isPrimary = index < visuals.length;
          const dropStyle = {
            "--ingredient-left": drop.left,
            "--ingredient-bottom": drop.bottom,
            "--ingredient-size": drop.size,
            "--ingredient-delay": drop.delay,
            "--ingredient-duration": drop.duration,
            "--ingredient-drift": drop.drift,
            "--ingredient-start-rotation": drop.start,
            "--ingredient-end-rotation": drop.end,
          } as CSSProperties;
          return <i
            className="fragrance-ingredient"
            data-ingredient-key={visual.key}
            key={`${visual.key}-${index}`}
            style={dropStyle}
            role={isPrimary ? "img" : undefined}
            aria-label={isPrimary ? visual.note : undefined}
            aria-hidden={isPrimary ? undefined : true}
            tabIndex={isPrimary ? 0 : undefined}
            title={visual.note}
          >
            <Image src={visual.asset} alt="" width={512} height={512} draggable={false} />
            <span className="fragrance-ingredient-name" aria-hidden="true">{visual.note}</span>
          </i>;
        })}
      </span>
    </div>}
  </div>;
}
