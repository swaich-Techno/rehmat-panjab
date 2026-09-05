"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  ["Collection", "/collection"],
  ["Find your scent", "/find-your-scent"],
  ["Create yours", "/create-your-fragrance"],
  ["Next drop", "/next-drop"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
