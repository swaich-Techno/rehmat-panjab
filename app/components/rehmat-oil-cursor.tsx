"use client";

import { useEffect, useRef } from "react";

const IGNORED_TARGETS = "input, textarea, select, option, form, [contenteditable='true'], .razorpay-checkout, [data-native-cursor]";
const INTERACTIVE_TARGETS = "a, button, [role='button'], .v41-product-card, .product-card";

function createOilSplit(x: number, y: number, onControl: boolean, onDone: (effect: HTMLElement, timer: number) => void) {
  const effect = document.createElement("span");
  effect.className = onControl ? "oil-click-effect is-control" : "oil-click-effect";
  effect.style.setProperty("--oil-x", x + "px");
  effect.style.setProperty("--oil-y", y + "px");

  for (const className of [
    "oil-click-main",
    "oil-click-lobe oil-click-lobe-a",
    "oil-click-lobe oil-click-lobe-b",
    "oil-click-ripple",
  ]) {
    const part = document.createElement("i");
    part.className = className;
    effect.appendChild(part);
  }

  document.body.appendChild(effect);
  const timer = window.setTimeout(() => onDone(effect, timer), 560);
  return { effect, timer };
}

export function RehmatOilCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const point = useRef({ x: -40, y: -40, px: -40, py: -40, angle: 0, raf: 0, active: false, settled: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const narrowViewport = window.matchMedia("(max-width: 700px)");
    let cursorEnabled = finePointer.matches && !reduced.matches && !narrowViewport.matches;
    const cursorPoint = point.current;
    const effects = new Set<HTMLElement>();
    const timers = new Set<number>();

    const draw = () => {
      const el = cursorRef.current;
      if (!el || !cursorPoint.active || document.hidden) {
        cursorPoint.raf = 0;
        return;
      }

      const dx = cursorPoint.x - cursorPoint.px;
      const dy = cursorPoint.y - cursorPoint.py;
      cursorPoint.px += dx * 0.34;
      cursorPoint.py += dy * 0.34;
      const distance = Math.hypot(dx, dy);
      const stretch = 1 + Math.min(distance / 95, 0.18);
      const targetAngle = distance > 0.35 ? Math.atan2(dy, dx) * (180 / Math.PI) + 90 : 0;
      cursorPoint.angle += (targetAngle - cursorPoint.angle) * 0.24;

      el.style.transform = "translate3d(" + (cursorPoint.px - 15) + "px," + (cursorPoint.py - 21) + "px,0)";
      el.style.setProperty("--oil-rotate", cursorPoint.angle + "deg");
      el.style.setProperty("--oil-stretch", String(stretch));
      el.style.setProperty("--oil-width", String(2 - stretch));
      el.style.setProperty("--oil-highlight-x", Math.max(-1.4, Math.min(1.4, dx * 0.035)) + "px");
      el.style.setProperty("--oil-highlight-y", Math.max(-1, Math.min(1, dy * 0.025)) + "px");

      if (distance < 0.08 && Math.abs(cursorPoint.angle) < 0.2) cursorPoint.settled += 1;
      else cursorPoint.settled = 0;

      if (cursorPoint.settled > 8) {
        cursorPoint.raf = 0;
        return;
      }
      cursorPoint.raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (cursorEnabled && !cursorPoint.raf) cursorPoint.raf = requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      if (!cursorEnabled) return;
      const el = cursorRef.current;
      if (!el) return;
      const targetElement = event.target as HTMLElement;
      const firstMove = !cursorPoint.active;
      cursorPoint.x = event.clientX;
      cursorPoint.y = event.clientY;
      if (firstMove) {
        cursorPoint.px = event.clientX;
        cursorPoint.py = event.clientY;
      }
      cursorPoint.active = true;
      cursorPoint.settled = 0;

      const interactive = targetElement.closest(INTERACTIVE_TARGETS);
      const hidden = Boolean(targetElement.closest(IGNORED_TARGETS) || window.getSelection()?.type === "Range");
      el.dataset.state = interactive ? "INTERACTIVE" : "DEFAULT";
      el.classList.toggle("is-hidden", hidden);
      document.documentElement.classList.toggle("rehmat-native-cursor", hidden);
      el.classList.add("is-active");
      start();
    };

    const down = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!cursorEnabled || target.closest(IGNORED_TARGETS)) return;
      cursorRef.current?.classList.add("is-pressed");
      const created = createOilSplit(event.clientX, event.clientY, Boolean(target.closest(INTERACTIVE_TARGETS)), (effect, timer) => {
        effect.remove();
        effects.delete(effect);
        timers.delete(timer);
      });
      effects.add(created.effect);
      timers.add(created.timer);
    };
    const up = () => {
      const el = cursorRef.current;
      el?.classList.remove("is-pressed");
      el?.classList.add("is-rebounding");
      window.setTimeout(() => el?.classList.remove("is-rebounding"), 180);
    };
    const leave = () => {
      cursorPoint.active = false;
      cursorRef.current?.classList.remove("is-active");
      document.documentElement.classList.remove("rehmat-native-cursor");
    };
    const visibility = () => {
      if (document.hidden && cursorPoint.raf) {
        cancelAnimationFrame(cursorPoint.raf);
        cursorPoint.raf = 0;
      } else if (cursorPoint.active) start();
    };
    const syncCursorMode = () => {
      cursorEnabled = finePointer.matches && !reduced.matches && !narrowViewport.matches;
      document.documentElement.classList.toggle("has-rehmat-cursor", cursorEnabled);
      if (!cursorEnabled) leave();
    };

    try {
      syncCursorMode();
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerdown", down, { passive: true });
      window.addEventListener("pointerup", up, { passive: true });
      window.addEventListener("pointercancel", up, { passive: true });
      document.documentElement.addEventListener("mouseleave", leave);
      document.addEventListener("visibilitychange", visibility);
      finePointer.addEventListener("change", syncCursorMode);
      reduced.addEventListener("change", syncCursorMode);
      narrowViewport.addEventListener("change", syncCursorMode);
    } catch {
      document.documentElement.classList.remove("has-rehmat-cursor", "rehmat-native-cursor");
      return;
    }

    return () => {
      if (cursorPoint.raf) cancelAnimationFrame(cursorPoint.raf);
      document.documentElement.classList.remove("has-rehmat-cursor");
      document.documentElement.classList.remove("rehmat-native-cursor");
      timers.forEach((timer) => window.clearTimeout(timer));
      effects.forEach((effect) => effect.remove());
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      finePointer.removeEventListener("change", syncCursorMode);
      reduced.removeEventListener("change", syncCursorMode);
      narrowViewport.removeEventListener("change", syncCursorMode);
    };
  }, []);

  return (
    <div ref={cursorRef} className="rehmat-oil-cursor" data-state="DEFAULT" aria-hidden="true">
      <span className="oil-cursor-body">
        <svg viewBox="0 0 22 30" focusable="false">
          <defs>
            <linearGradient id="rehmat-oil-gradient" x1="4" y1="3" x2="18" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffe39a" />
              <stop offset="0.38" stopColor="#d99528" />
              <stop offset="1" stopColor="#794014" />
            </linearGradient>
          </defs>
          <path className="oil-cursor-drop" d="M11.7 1C10.8 5.7 7.1 9.2 4.7 13.5C1.8 18.8 4.2 26.5 11 28.2C17.4 29.8 21.1 24.8 20.6 19.4C20.1 13.9 14.3 9.7 11.7 1Z" />
          <ellipse className="oil-cursor-highlight" cx="8.2" cy="16" rx="1.4" ry="4.2" />
        </svg>
      </span>
      <span className="oil-cursor-split oil-cursor-split-a" />
      <span className="oil-cursor-split oil-cursor-split-b" />
    </div>
  );
}
