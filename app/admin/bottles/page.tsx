import type {SupabaseClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../../lib/supabase/auth";
import {BottleManager,type BottleDraft} from "./bottle-manager";
export const dynamic="force-dynamic";
export default async function Page(){const {supabase,role}=await requireAdmin();if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;const {data}=await (supabase as unknown as SupabaseClient).from("bottles").select("*").neq("status","archived").order("display_order");return <main id="main-content" className="admin-page"><p className="eyebrow">House administration</p><h1>Bottles.</h1><p>Manage reusable bottle formats without changing fragrance inventory or historical orders.</p><BottleManager initial={(data||[]) as BottleDraft[]}/></main>}
