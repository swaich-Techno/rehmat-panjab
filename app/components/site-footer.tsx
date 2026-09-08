import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">The house</p>
        <p className="footer-statement">Perfume oil,<br />worn close.</p>
      </div>
      <div className="footer-links">
        <p className="eyebrow">Explore</p>
        <Link href="/collection">The collection</Link>
        <Link href="/find-your-scent">Find your scent</Link>
        <Link href="/create-your-fragrance">Create your Rehmat</Link>
        <Link href="/layer">Layering lab</Link>
      </div>
      <div className="footer-links">
        <p className="eyebrow">House</p>
        <Link href="/contact">Contact</Link>
        <Link href="/policies/shipping">Shipping policy</Link>
        <Link href="/policies/returns">Cancellation &amp; refunds</Link>
        <Link href="/policies/privacy">Privacy policy</Link>
        <Link href="/policies/terms">Terms &amp; conditions</Link>
      </div>
      <div className="footer-mark" aria-hidden="true">R</div>
      <p className="footer-legal">© 2026 Rehmat Panjab · Concentrated perfume oil</p>
    </footer>
  );
}
