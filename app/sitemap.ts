import type { MetadataRoute } from "next";
import { getStorefrontProducts } from "../lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://rehmat-panjab.vercel.app";
  const products = await getStorefrontProducts();
  const routes = ["", "/collection", "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover"];
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.8 })), ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 }))];
}
