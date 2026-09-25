import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/site-url";
import {isPreviewDeployment} from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  const origin=getSiteUrl();
  if(isPreviewDeployment)return {rules:[{userAgent:"*",disallow:"/"}],sitemap:`${origin}/sitemap.xml`,host:origin};
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/auth/", "/account", "/account/", "/cart", "/my-rehmat", "/api/"] }], sitemap: `${origin}/sitemap.xml`,host:origin };
}
