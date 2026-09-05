import type { Metadata } from "next";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { ArchiveLogin } from "./archive-login";

export const metadata: Metadata = { title: "Private Fragrance Archive", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const safeReturn = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/my-rehmat";
  return <main id="main-content"><ArchiveLogin configured={isSupabaseConfigured()} returnTo={safeReturn} /></main>;
}
