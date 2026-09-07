import type { Metadata } from "next";
import { getExperienceSettings } from "../../lib/experience-settings";
import { ScentQuiz } from "./scent-quiz";

export const metadata: Metadata = {
  title: "Name Your Rehmat",
  description: "Twelve considered questions shape a personal Rehmat scent portrait.",
  alternates: { canonical: "/find-your-scent" },
};

export default async function FindYourScentPage() {
  const settings = await getExperienceSettings();
  return <main id="main-content"><ScentQuiz settings={settings} /></main>;
}
