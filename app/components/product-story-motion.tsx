"use client";

import { useEffect, useRef } from "react";

export function ProductStoryMotion() {
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".product-page");
    const sticky = root?.querySelector<HTMLElement>(".product-sticky");
    const panels = root ? Array.from(root.querySelectorAll<HTMLElement>(".story-panel, .product-reviews")) : [];
    if (!root || !sticky || !panels.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.dataset.motionReady = "true";
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) (entry.target as HTMLElement).classList.add("is-story-visible");
      }
    }, { rootMargin: "0px 0px -12%", threshold: 0.12 });
    panels.forEach((panel) => observer.observe(panel));

    const update = () => {
      frameRef.current = null;
      if (reducedMotion.matches) {
        root.style.setProperty("--product-scroll", "0");
        return;
      }
      const rect = root.getBoundingClientRect();
      const range = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      root.style.setProperty("--product-scroll", progress.toFixed(4));
    };
    const requestUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    reducedMotion.addEventListener("change", requestUpdate);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      delete root.dataset.motionReady;
    };
  }, []);

  return null;
}
