import type { Metadata } from "next";
import { headers } from "next/headers";
import { CartProvider } from "./components/cart-provider";
import { RehmatOilCursor } from "./components/rehmat-oil-cursor";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "rehmat-panjab.vercel.app";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;
  return {
    metadataBase: new URL(origin),
    title: { default: "REHMAT PANJAB — Perfume oil, close to skin", template: "%s — REHMAT PANJAB" },
    description: "Concentrated perfume oils from Rehmat Panjab. Made to be worn, not announced.",
    openGraph: { type: "website", siteName: "Rehmat Panjab", title: "REHMAT PANJAB — Perfume oil, close to skin", description: "Five oils. One quiet ritual. Find the Rehmat that feels like you.", images: [{ url: socialImage, width: 1792, height: 937, alt: "Rehmat Panjab perfume oil campaign" }] },
    twitter: { card: "summary_large_image", title: "REHMAT PANJAB", description: "Perfume oil, close to skin.", images: [socialImage] },
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
        </CartProvider>
      </body>
    </html>
  );
}
