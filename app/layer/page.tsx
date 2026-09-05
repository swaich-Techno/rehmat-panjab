import type { Metadata } from "next";
import { LayeringLab } from "./layering-lab";

export const metadata: Metadata = { title: "Layering Lab", description: "Pair two Rehmat oils and explore an editorial layering suggestion.", alternates: { canonical: "/layer" } };

export default function LayerPage() { return <main id="main-content"><LayeringLab /></main>; }
