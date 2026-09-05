import Link from "next/link";
import { requireAdmin } from "../../lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { role } = await requireAdmin();
  return <main id="main-content" className="admin-page"><p className="eyebrow">House administration · {role.replace("_", " ")}</p><h1>Rehmat house<br />operations.</h1><div className="admin-grid"><Link href="/admin/products"><span>01</span><h2>Products</h2><p>Names, status, storytelling, formats, and launch details.</p></Link><article><span>02</span><h2>Analytics</h2><p>No data yet.</p></article><article><span>03</span><h2>Next drop</h2><p>Campaign milestones appear after configuration.</p></article></div></main>;
}
