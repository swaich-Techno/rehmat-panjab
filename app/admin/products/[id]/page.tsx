import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/supabase/auth";
import { AdminProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { supabase, role } = await requireAdmin(); if (role !== "super_admin") return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>; const { data } = await supabase.from("products").select("id,product_number,name,slug,status,subtitle,description").eq("id", id).maybeSingle(); if (!data) notFound(); return <main id="main-content" className="admin-page"><p className="eyebrow">Administration · Edit product</p><h1>{data.name}</h1><AdminProductForm initial={data} /></main>; }
