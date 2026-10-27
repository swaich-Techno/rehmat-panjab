"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DIWALI_END_ISO, DIWALI_START_ISO, campaignPhase } from "../../lib/promotions.mjs";

const POPUP_SESSION_KEY = "rehmat:diwali-2026-popup";
const SHARE_TEXT = "Discover Rehmat Panjab concentrated perfume oils: https://www.rehmatpanjab.com";
const CLAIM_TEXT = "Hi Rehmat Panjab, I shared the website and would like to request one eligible 3 ml tester for ₹99. I understand stock is limited to 99 verified claims, one per customer, and shipping is extra.";
type CampaignPhase = "live" | "upcoming" | "ended";

function useCampaignPhase() {
  const [phase, setPhase] = useState<CampaignPhase>(() => campaignPhase(DIWALI_START_ISO, DIWALI_END_ISO));
  useEffect(() => {
    const refresh = () => setPhase(campaignPhase(DIWALI_START_ISO, DIWALI_END_ISO));
    const timer = window.setInterval(refresh, 60_000);
    refresh();
    return () => window.clearInterval(timer);
  }, []);
  return phase;
}

export function ShareClaimButton({ whatsappNumber, className = "button button-dark" }: { whatsappNumber: string; className?: string }) {
  const [status, setStatus] = useState("");
  const shareAndClaim = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rehmat Panjab", text: SHARE_TEXT, url: "https://www.rehmatpanjab.com" });
        setStatus("Shared. Opening the enquiry for manual verification…");
      } else {
        await navigator.clipboard?.writeText("https://www.rehmatpanjab.com");
        setStatus("Website copied. Opening the enquiry for manual verification…");
      }
      window.location.assign(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(CLAIM_TEXT)}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("Sharing was cancelled. No sample has been reserved.");
        return;
      }
      window.location.assign(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(CLAIM_TEXT)}`);
    }
  };
  return <>
    <button className={className} type="button" onClick={shareAndClaim}>Share &amp; Claim</button>
    <span className="share-claim-status" aria-live="polite">{status}</span>
  </>;
}

export function DiwaliPopup({ whatsappNumber }: { whatsappNumber: string }) {
  const phase = useCampaignPhase();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (phase === "ended" || window.sessionStorage.getItem(POPUP_SESSION_KEY)) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(POPUP_SESSION_KEY, "seen");
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    }, 1_200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [close, open]);

  if (!open || phase === "ended") return null;
  return <div className="diwali-popup-shell" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <div className="diwali-popup" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <button className="diwali-popup-close" ref={closeRef} type="button" onClick={close} aria-label="Close Diwali offers">×</button>
      <p className="eyebrow">{phase === "upcoming" ? "Starts 1 November" : "1–10 November · Applied automatically"}</p>
      <h2 id={titleId}>Diwali — 60% Off</h2>
      <p id={descriptionId}>Eligible fragrance bottles and tester packs. No code needed, no discount cap, and shipping is excluded.</p>
      <div className="diwali-popup-sample">
        <span>Limited to 99 verified claims</span>
        <strong>Share Rehmat.<br/>Try 3 ml for ₹99.</strong>
        <small>One per customer · shipping extra · enquiry does not reserve stock</small>
      </div>
      <div className="diwali-popup-actions">
        <Link className="button button-cream" href="/collection" onClick={close}>Shop 60% Off</Link>
        <ShareClaimButton whatsappNumber={whatsappNumber} className="button button-outline" />
      </div>
      <Link className="diwali-popup-terms" href="/offers" onClick={close}>Dates and full terms</Link>
    </div>
  </div>;
}
