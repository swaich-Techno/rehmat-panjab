import type { Metadata } from "next";
import { SwipeDiscovery } from "../swipe-discovery";
export const metadata:Metadata={title:"Browse by instinct",description:"A secondary, informal way to explore the active Rehmat catalogue.",robots:{index:false,follow:true},alternates:{canonical:"/collection"}};
export default function Page(){return <main id="main-content"><SwipeDiscovery/></main>}
