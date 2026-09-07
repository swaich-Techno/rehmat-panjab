import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/supabase/auth";
import { ReviewActions, ReviewSettingsToggle } from "./review-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { supabase } = await requireAdmin(); const client = supabase as unknown as SupabaseClient; const filters = await searchParams;
  const [{ data }, { data: settings }] = await Promise.all([
    client.from("product_reviews").select("id,product_id,user_id,display_name,email,rating,title,body,image_path,status,verified_purchase,helpful_count,admin_response,reported,created_at,moderated_at,products(name)").order("created_at", { ascending: false }).limit(100),
    client.from("review_settings").select("submissions_enabled").eq("id", true).maybeSingle(),
  ]);
  const query = (filters.q ?? "").toLowerCase(); const status = filters.status ?? "all";
  const reviews = (data ?? []).filter((review) => (status === "all" || review.status === status || (status === "reported" && review.reported)) && (!query || `${review.display_name} ${review.email} ${(review.products as { name?: string } | null)?.name ?? ""}`.toLowerCase().includes(query)));
  return <main id="main-content" className="admin-page admin-reviews"><div className="admin-title-row"><div><p className="eyebrow">House administration</p><h1>Review<br />moderation.</h1></div><ReviewSettingsToggle enabled={Boolean(settings?.submissions_enabled)} /></div><form className="review-filters"><label>Search<input name="q" defaultValue={filters.q} placeholder="Product, reviewer or email" /></label><label>Status<select name="status" defaultValue={status}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="archived">Archived</option><option value="reported">Reported</option></select></label><button className="button button-dark">Filter</button></form><div className="admin-review-list">{reviews.map((review) => <article key={String(review.id)}><header><div><p className="eyebrow">{(review.products as { name?: string } | null)?.name ?? "Product"} · {String(review.status)}</p><h2>{String(review.title)}</h2></div><strong>{Number(review.rating)}/5</strong></header><p>{String(review.body)}</p><dl><div><dt>Reviewer</dt><dd>{String(review.display_name)}</dd></div><div><dt>Private email</dt><dd>{String(review.email)}</dd></div><div><dt>Verified</dt><dd>{review.verified_purchase ? "Yes" : "No"}</dd></div><div><dt>Reported</dt><dd>{review.reported ? "Yes" : "No"}</dd></div><div><dt>Submitted</dt><dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(review.created_at)))}</dd></div></dl><ReviewActions id={String(review.id)} response={String(review.admin_response ?? "")} verified={Boolean(review.verified_purchase)} /></article>)}</div></main>;
}
