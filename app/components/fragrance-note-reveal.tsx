"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import type { StorefrontProduct } from "../../lib/catalog";
import { fragranceNotePaletteFor, hasCompleteIngredientVisuals, ingredientVisualsFor } from "../../lib/fragrance-note-reveal";
import { ProductMedia } from "./product-media";

type FragranceNoteRevealProps = {
  product: StorefrontProduct;
  priority?: boolean;
  active: boolean;
  replay: number;
  onActivate: () => void;
  onDismiss: () => void;
  persistent?: boolean;
};

export function FragranceNoteReveal({ product, priority = false, active, replay, onActivate, onDismiss, persistent = false }: FragranceNoteRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transientReveal = useRef(false);
  const palette = fragranceNotePaletteFor(product.slug);
  const visuals = ingredientVisualsFor(product.slug, product.notes);
  const canReveal = Boolean(palette && hasCompleteIngredientVisuals(product.notes, visuals));
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
    if (persistent || !active || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) onDismiss();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [active, onDismiss, persistent]);

  useEffect(() => {
    const closeOtherReveal = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!persistent && active && detail?.id !== instanceId) onDismiss();
    };
    window.addEventListener("rehmat-fragrance-reveal", closeOtherReveal);
    return () => window.removeEventListener("rehmat-fragrance-reveal", closeOtherReveal);
  }, [active, instanceId, onDismiss, persistent]);

  useEffect(() => {
    if (persistent || !active) return;
    const dismiss = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [active, onDismiss, persistent]);

  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  function queueReveal() {
    if (active || !canReveal || typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    revealTimer.current = setTimeout(() => { transientReveal.current = true; activate(); }, 260);
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

  function activate() {
    if (!canReveal) return;
    window.dispatchEvent(new CustomEvent("rehmat-fragrance-reveal", { detail: { id: instanceId } }));
    onActivate();
  }

  return <div ref={rootRef} className={`catalogue-card-media fragrance-note-reveal${active ? " is-active" : ""}`} style={style} onMouseEnter={queueReveal} onMouseLeave={leaveReveal} onFocus={queueReveal} onBlur={leaveReveal}>
    <button
      className="fragrance-note-trigger"
      type="button"
      aria-label={canReveal ? `Show fragrance notes for ${product.name}` : `Fragrance notes unavailable for ${product.name}`}
      aria-expanded={canReveal && active}
      aria-controls={canReveal && active ? stageId : undefined}
      disabled={!canReveal}
      onClick={() => { cancelQueuedReveal(); transientReveal.current = false; activate(); }}
      onKeyDown={handleKeyDown}
    >
      <ProductMedia product={product} priority={priority} />
      {canReveal && <span className="fragrance-note-hint" aria-hidden="true">Reveal notes</span>}
    </button>
    {active && palette && canReveal && <div key={`${product.slug}-${replay}`} id={stageId} className="fragrance-note-stage" role="status" aria-live="polite" aria-atomic="true">
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
      {visuals.length > 0 && <span className="fragrance-ingredients" aria-hidden="true">
        {visuals.map((visual, visualIndex) => {
          const tierOffset = visual.tier === "base" ? 0 : visual.tier === "heart" ? 560 : 1120;
          const x = visual.count === 1 ? 50 : 28 + (44 * visual.index / (visual.count - 1));
          const dropStyle = {
            "--ingredient-bottom": visual.tier === "base" ? "36%" : visual.tier === "heart" ? "55%" : "74%",
            "--ingredient-size": visual.tier === "base" ? "68px" : visual.tier === "heart" ? "62px" : "58px",
            "--ingredient-delay": `${480 + tierOffset + visual.index * 105}ms`,
            "--ingredient-x": `${x}%`,
            "--ingredient-drift": `${visualIndex % 2 ? 12 : -12}px`,
          } as CSSProperties;
          return <i
            className="fragrance-ingredient"
            data-ingredient-key={visual.key}
            data-note-tier={visual.tier}
            key={`${visual.tier}-${visual.note}`}
            style={dropStyle}
          >
            <Image src={visual.asset} alt="" width={512} height={512} draggable={false} />
            <span className="fragrance-ingredient-name"><b>{visual.tier}</b>{visual.note}</span>
          </i>;
        })}
      </span>}
    </div>}
  </div>;
}
