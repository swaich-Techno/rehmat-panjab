import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/supabase/auth";
import { AdminProductForm } from "../product-form";
import { AdminVariantManager, type VariantDraft } from "../variant-manager";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role } = await requireAdmin();
  if (role !== "super_admin") return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const [{ data }, { data: variantRows }] = await Promise.all([
    supabase.from("products").select("id,product_number,name,slug,status,subtitle,short_description,description,scent_family,scent_profile,occasions,reviews_enabled,image_path,campaign_image_path,featured,seo_title,seo_description,og_image_path").eq("id", id).maybeSingle(),
    supabase.from("product_variants").select("id,size_ml,sku,price_paise,enabled,inventory(quantity,reserved,low_stock_threshold)").eq("product_id", id).order("size_ml"),
  ]);
  if (!data) notFound();
  const variants = (variantRows ?? []).map((variant) => {
    const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    return { id: variant.id, size_ml: Number(variant.size_ml), sku: variant.sku, price_paise: variant.price_paise, enabled: variant.enabled, quantity: inventory?.quantity ?? 0, reserved: inventory?.reserved ?? 0, low_stock_threshold: inventory?.low_stock_threshold ?? 2 };
  }) as VariantDraft[];
  return <main id="main-content" className="admin-page"><p className="eyebrow">Administration · Edit product</p><h1>{data.name}</h1><AdminProductForm initial={data} /><AdminVariantManager productId={data.id} variants={variants} /></main>;
}
