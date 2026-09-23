import type { Metadata } from "next";
import { CartProvider } from "./components/cart-provider";
import { RehmatOilCursor } from "./components/rehmat-oil-cursor";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./globals.css";
import { getSiteUrl } from "../lib/site-url";
import { RehmatGuide } from "./components/rehmat-guide";
import { CookiePreferences } from "./components/cookie-preferences";
import {isPreviewDeployment} from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const origin = getSiteUrl();
  const socialImage = `${origin}/og.png`;
  return {
    metadataBase: new URL(origin),
    title: { default: "Rehmat Panjab — Concentrated Perfume Oils", template: "%s — Rehmat Panjab" },
    description: "Your Oil, Your Atmosphere. Discover concentrated perfume oils from Rehmat Panjab for personal rituals, memorable occasions and everyday luxury.",
    alternates:{canonical:"/"},
    openGraph: { type: "website", siteName: "Rehmat Panjab", title: "Rehmat Panjab — Concentrated Perfume Oils", description: "Discover concentrated perfume oils created for personal rituals, memorable occasions and everyday luxury.", url:"/", images: [{ url: socialImage, width: 1792, height: 937, alt: "Rehmat Panjab rose-gold perfume oil bottle" }] },
    twitter: { card: "summary_large_image", title: "REHMAT PANJAB", description: "Perfume oil, close to skin.", images: [socialImage] },
    robots:isPreviewDeployment?{index:false,follow:false,nocache:true}:{index:true,follow:true},
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <CartProvider>
          <RehmatOilCursor />
          <SiteHeader />
          {children}
          <SiteFooter />
          <RehmatGuide />
          <CookiePreferences />
        </CartProvider>
      </body>
    </html>
  );
}
