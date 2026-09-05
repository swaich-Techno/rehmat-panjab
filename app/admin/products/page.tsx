import Link from "next/link";
import { requireAdmin } from "../../../lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { supabase, role } = await requireAdmin();
  const { data: items } = await supabase.from("products").select("id,product_number,name,slug,status,updated_at").order("product_number");
  return <main id="main-content" className="admin-page"><div className="admin-title-row"><div><p className="eyebrow">Administration · Products</p><h1>The catalogue.</h1></div>{role === "super_admin" && <Link className="button button-dark" href="/admin/products/new">New product</Link>}</div><div className="admin-table" role="table" aria-label="Products">{items?.length ? items.map((item) => <div role="row" key={item.id}><span>{item.product_number}</span><strong>{item.name}</strong><span>{item.status}</span><Link href={`/admin/products/${item.id}`}>Edit</Link></div>) : <div className="admin-empty"><h2>No data yet.</h2><p>Products appear here after the database migration and first catalogue sync.</p></div>}</div></main>;
}
