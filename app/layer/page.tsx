import type { Metadata } from "next";
import { getExperienceSettings } from "../../lib/experience-settings";
import { products } from "../../lib/products";
import type { ScentId } from "../../lib/products";
import { getStorefrontProducts } from "../../lib/storefront";
import { LayeringLab } from "./layering-lab";

export const metadata: Metadata = { title: "AI Layering Lab", description: "Create grounded fragrance layering guidance using active Rehmat Panjab oils.", alternates: { canonical: "/layer" } };

export default async function LayerPage({searchParams}:{searchParams:Promise<{products?:string}>}) {
  const [settings, storefront] = await Promise.all([getExperienceSettings(), getStorefrontProducts()]);
  const active = products.filter((product) => storefront.some((item) => item.slug === product.slug && item.status === "active") && !settings.productExclusions.includes(product.slug));
  const query=await searchParams; const initialSelected=(query.products?.split(",").filter((id):id is ScentId=>active.some((item)=>item.id===id))??[]).slice(0,settings.layeringMaxFragrances);
  return <main id="main-content"><LayeringLab catalogue={active} settings={settings} initialSelected={initialSelected} /></main>;
}
