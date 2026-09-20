import type { Metadata } from "next";
import { DropRoom } from "./drop-room";
import {pageMetadata} from "../../lib/seo";

export const metadata: Metadata = pageMetadata({title:"Shape the Next Perfume Oil",description:"Help shape the mood and creative direction of a future Rehmat Panjab concentrated perfume oil through the Next Drop experience.",path:"/next-drop"});

export default function NextDropPage() {
  return <main id="main-content"><DropRoom /></main>;
}
