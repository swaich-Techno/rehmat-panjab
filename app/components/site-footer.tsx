import Link from "next/link";
import {getPublishedPolicyRecord} from "../../lib/store-settings";
import {merchant} from "../../lib/merchant";

export async function SiteFooter() {
  const policies=await getPublishedPolicyRecord();
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
        <a href={`tel:${merchant.phoneE164}`}>+91 70094 66475</a>
        <a href={`mailto:${merchant.email}`}>{merchant.email}</a>
        {policies&&<><Link href="/policies/shipping">Shipping policy</Link><Link href="/policies/returns">Cancellation &amp; refunds</Link><Link href="/policies/privacy">Privacy policy</Link><Link href="/policies/terms">Terms &amp; conditions</Link></>}
        <button className="footer-preference-button" type="button" data-cookie-preferences>Cookie preferences</button>
      </div>
      <div className="footer-mark" aria-hidden="true">R</div>
      <p className="footer-legal">© 2026 Rehmat Panjab · Concentrated perfume oil</p>
    </footer>
  );
}
