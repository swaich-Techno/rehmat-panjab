import type { Metadata } from "next";
import { getExperienceSettings } from "../../lib/experience-settings";
import { ScentQuiz } from "./scent-quiz";
import {pageMetadata} from "../../lib/seo";

export const metadata: Metadata = pageMetadata({title:"Find Your Rehmat Fragrance",description:"Answer twelve considered questions to discover a personal Rehmat Panjab fragrance portrait shaped by your mood and preferences.",path:"/find-your-scent"});

export default async function FindYourScentPage() {
  const settings = await getExperienceSettings();
  return <main id="main-content"><ScentQuiz settings={settings} /></main>;
}
