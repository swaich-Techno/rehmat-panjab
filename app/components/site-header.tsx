"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMERCE_ENABLED } from "../../lib/commerce";
import { useCart } from "./cart-provider";

const nav = [
  ["Collection", "/collection"],
  ["Find your scent", "/find-your-scent"],
  ["Create yours", "/create-your-fragrance"],
  ["Next drop", "/next-drop"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cart = useCart();

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Rehmat Panjab home" data-cursor="HOME">
        <span>Rehmat</span><span>Panjab</span>
      </Link>
      <nav className={open ? "primary-nav is-open" : "primary-nav"} aria-label="Primary">
        {nav.map(([label, href]) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} data-cursor="OPEN" onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link href="/my-rehmat" className="archive-link" data-cursor="KEY">My Rehmat</Link>
        {COMMERCE_ENABLED && <button className="header-cart" type="button" onClick={cart.show} aria-label={`Open cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`} aria-haspopup="dialog">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h2l1.6 9.2h9.8L20 9H7M9.5 19a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm7 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z" /></svg>
          <span>Cart</span><b aria-hidden="true">{cart.count}</b>
        </button>}
        <button
          type="button"
          className="menu-button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span /><span />
        </button>
      </div>
    </header>
  );
}
