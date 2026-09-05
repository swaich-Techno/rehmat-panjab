import type { Metadata } from "next";
import { ScentQuiz } from "./scent-quiz";

export const metadata: Metadata = {
  title: "Find Your Scent",
  description: "Six sensory choices. One Rehmat profile, made from your answers.",
  alternates: { canonical: "/find-your-scent" },
};

export default function FindYourScentPage() {
  return <main id="main-content"><ScentQuiz /></main>;
}
