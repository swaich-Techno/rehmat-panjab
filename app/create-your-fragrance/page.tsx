import type { Metadata } from "next";
import { FragrancePortrait } from "./fragrance-portrait";

export const metadata: Metadata = {
  title: "Create Your Rehmat",
  description: "Build a visual fragrance preference portrait—not a formula.",
  alternates: { canonical: "/create-your-fragrance" },
};

export default function CreatePage() {
  return <main id="main-content"><FragrancePortrait /></main>;
}
