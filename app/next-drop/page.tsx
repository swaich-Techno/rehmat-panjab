import type { Metadata } from "next";
import { DropRoom } from "./drop-room";

export const metadata: Metadata = {
  title: "The Next Drop",
  description: "Shape the mood of the next Rehmat perfume oil.",
  alternates: { canonical: "/next-drop" },
};

export default function NextDropPage() {
  return <main id="main-content"><DropRoom /></main>;
}
