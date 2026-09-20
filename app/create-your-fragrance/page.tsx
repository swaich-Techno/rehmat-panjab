import type { Metadata } from "next";
import { FragrancePortrait } from "./fragrance-portrait";
import {pageMetadata} from "../../lib/seo";

export const metadata: Metadata = pageMetadata({title:"Create Your Fragrance Portrait",description:"Build a visual Rehmat Panjab fragrance preference portrait by exploring scent character, atmosphere and personal instinct.",path:"/create-your-fragrance"});

export default function CreatePage() {
  return <main id="main-content"><FragrancePortrait /></main>;
}
