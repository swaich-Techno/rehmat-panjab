import type { Metadata } from "next";
import { SwipeDiscovery } from "./swipe-discovery";

export const metadata: Metadata = { title: "Discover", description: "A mobile-first way to meet the five Rehmat atmospheres.", alternates: { canonical: "/discover" } };
export default function DiscoverPage() { return <main id="main-content"><SwipeDiscovery /></main>; }
