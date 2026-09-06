import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/auth/", "/cart", "/my-rehmat", "/api/"] }], sitemap: "https://rehmat-panjab.vercel.app/sitemap.xml" };
}
