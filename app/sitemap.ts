import type { MetadataRoute } from "next";
import { getStorefrontProducts } from "../lib/storefront";
import { getSiteUrl } from "../lib/site-url";
import {getPublishedPolicyRecord} from "../lib/store-settings";
import {guides} from "../lib/guides";
import {productsForSearchCollection,searchCollections} from "../lib/search-collections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [products,policies] = await Promise.all([getStorefrontProducts(),getPublishedPolicyRecord()]);
  const active=products.filter(product=>product.status==="active");
  const categoryRoutes=searchCollections.filter(collection=>productsForSearchCollection(collection,active).length>0).map(collection=>`/collection/${collection.slug}`);
  const routes = ["", "/collection",...categoryRoutes,"/guides",...guides.map(guide=>`/guides/${guide.slug}`), "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover", "/contact", ...(policies?["/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"]:[])];
  const releaseDate=new Date("2026-09-22T00:00:00.000Z");
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: policies&&route.startsWith("/policies/")?new Date(`${policies.effectiveDate}T00:00:00.000Z`):releaseDate, changeFrequency: route.startsWith("/guides/")?"monthly" as const:"weekly" as const, priority: route === "" ? 1 : route==="/collection" ? .9 : .8 })), ...active.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: product.createdAt?new Date(product.createdAt):releaseDate, changeFrequency: "weekly" as const, priority: 0.7 }))];
}
