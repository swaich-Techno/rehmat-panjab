import type { MetadataRoute } from "next";
import { products } from "../lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://rehmat-panjab.vercel.app";
  const routes = ["", "/collection", "/find-your-scent", "/create-your-fragrance", "/next-drop", "/layer", "/discover"];
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.8 })), ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 }))];
}
