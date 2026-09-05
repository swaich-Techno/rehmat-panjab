import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">The house</p>
        <p className="footer-statement">Made to be worn.<br />Not announced.</p>
      </div>
      <div className="footer-links">
        <p className="eyebrow">Explore</p>
        <Link href="/collection">The five</Link>
        <Link href="/find-your-scent">Find your scent</Link>
        <Link href="/create-your-fragrance">Create your Rehmat</Link>
        <Link href="/layer">Layering lab</Link>
      </div>
      <div className="footer-links">
        <p className="eyebrow">Return</p>
        <Link href="/next-drop">Next drop</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/my-rehmat">My Rehmat</Link>
      </div>
      <div className="footer-mark" aria-hidden="true">R</div>
      <p className="footer-legal">© 2026 Rehmat Panjab · Concentrated perfume oil</p>
    </footer>
  );
}
