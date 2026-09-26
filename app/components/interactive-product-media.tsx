"use client";

import { useState } from "react";
import type { StorefrontProduct } from "../../lib/catalog";
import { FragranceNoteReveal } from "./fragrance-note-reveal";

export function InteractiveProductMedia({ product, priority = false, className = "" }: { product: StorefrontProduct; priority?: boolean; className?: string }) {
  const [replay, setReplay] = useState(-1);
  return <div className={className}>
    <FragranceNoteReveal product={product} priority={priority} active={replay >= 0} replay={Math.max(0, replay)} onActivate={() => setReplay(value => value + 1)} onDismiss={() => setReplay(-1)} />
  </div>;
}
