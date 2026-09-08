import type { MetadataRoute } from "next";
import { getStorefrontProducts } from "../lib/storefront";
import { getSiteUrl } from "../lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const products = await getStorefrontProducts();
  const routes = ["", "/collection", "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover", "/contact", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.8 })), ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 }))];
}
