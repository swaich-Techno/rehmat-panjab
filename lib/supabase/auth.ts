import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

export async function getViewer() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login?returnTo=/admin");
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login?returnTo=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) redirect("/");
  return { supabase, user: authData.user, role: profile.role as "admin" | "super_admin" };
}
