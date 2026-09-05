import { requireAdmin } from "../../../../lib/supabase/auth";
import { AdminProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export default async function NewProductPage() { const { role } = await requireAdmin(); if (role !== "super_admin") return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>; return <main id="main-content" className="admin-page"><p className="eyebrow">Administration · New product</p><h1>Create a draft.</h1><AdminProductForm /></main>; }
