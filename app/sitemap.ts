import type { MetadataRoute } from "next";
import { getStorefrontProducts } from "../lib/storefront";
import { getSiteUrl } from "../lib/site-url";
import {getPublishedPolicyRecord} from "../lib/store-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [products,policies] = await Promise.all([getStorefrontProducts(),getPublishedPolicyRecord()]);
  const routes = ["", "/collection", "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover", "/contact", ...(policies?["/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"]:[])];
  const releaseDate=new Date("2026-09-20T00:00:00.000Z");
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: policies&&route.startsWith("/policies/")?new Date(`${policies.effectiveDate}T00:00:00.000Z`):releaseDate, changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.8 })), ...products.filter(product=>product.status==="active").map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: product.createdAt?new Date(product.createdAt):releaseDate, changeFrequency: "weekly" as const, priority: 0.7 }))];
}
