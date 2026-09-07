import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "../../lib/supabase/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Rehmat", robots: { index: false, follow: false } };

export default async function MyRehmatPage() {
  const viewer = await getViewer();
  if (!viewer) return (
    <main id="main-content" className="archive-locked-page">
      <div className="keyhole" aria-hidden="true"><i /></div>
      <p className="eyebrow">My scent identity</p>
      <h1>Your Rehmat<br /><em>stays private.</em></h1>
      <p>Open the archive to return to saved profiles, portraits, votes, and layering ideas.</p>
      <Link className="button button-dark" href="/auth/login?returnTo=/my-rehmat">Open the private archive</Link>
      <Link className="text-link" href="/find-your-scent">Create a scent profile first ↗</Link>
    </main>
  );

  const raw=await createSupabaseServerClient(); const client=raw as unknown as SupabaseClient;
  const [{data:quizResults},{data:savedLayers}]=await Promise.all([client.from("quiz_results").select("id,profile,created_at").eq("user_id",viewer.id).order("created_at",{ascending:false}).limit(6),client.from("saved_layering_recommendations").select("id,name,product_slugs,created_at").eq("user_id",viewer.id).order("created_at",{ascending:false}).limit(6)]);
  const latest=(quizResults?.[0]?.profile??null) as {name?:string;feelings?:string[]}|null;
  return (
    <main id="main-content" className="passport-page">
      <header><p className="eyebrow">My scent identity</p><h1>Your Rehmat<br /><em>profile.</em></h1><p>{viewer.email}</p></header>
      <section className="passport-empty"><div className="scent-rings" aria-hidden="true"><i /><i /><i /></div><div><p className="eyebrow">Your scent DNA</p><h2>{latest?.name??"No profile yet."}</h2><p>{latest?.feelings?.length?latest.feelings.join(" · "):"Your answers will shape this portrait. The values are expressive preferences, not scientific measurements."}</p><Link className="button button-dark" href="/find-your-scent">{latest?"Refine your portrait":"Name your Rehmat"}</Link></div></section>
      <section className="passport-grid"><article><span>01</span><h2>Saved fragrances</h2><p>No saved oils yet.</p><Link href="/discover">Start discovering ↗</Link></article><article><span>02</span><h2>Portraits</h2><p>{quizResults?.length?`${quizResults.length} private portrait${quizResults.length===1?"":"s"} saved.`:"No fragrance portraits yet."}</p><Link href="/find-your-scent">Create another ↗</Link></article><article><span>03</span><h2>Layering ideas</h2><p>{savedLayers?.length?savedLayers.map((item)=>item.name).join(" · "):"No combinations saved yet."}</p><Link href="/layer">Enter the lab ↗</Link></article></section>
    </main>
  );
}
