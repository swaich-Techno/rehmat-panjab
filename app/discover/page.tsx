import type { Metadata } from "next";
import Link from "next/link";
import { OpenGuideButton } from "../components/open-guide-button";

export const metadata: Metadata = { title: "Our Story", description: "The meaning, atmosphere and close-to-skin ritual of Rehmat Panjab.", alternates: { canonical: "/discover" } };
export default function DiscoverPage() { return <main id="main-content" className="story-page">
  <section className="story-page-hero"><p className="eyebrow">THE HOUSE · REHMAT PANJAB</p><h1>Perfume oil,<br/>worn close.</h1><p>Rehmat Panjab creates concentrated perfume oils shaped around atmosphere, memory and personal ritual. Each fragrance is designed to unfold slowly, remain close to the skin and become part of the person wearing it.</p></section>
  <div className="story-page-grid">
    <section><p className="eyebrow">The meaning of Rehmat</p><h2>A name carried with grace.</h2><p>Rehmat speaks of grace, blessing and something received with gratitude. Panjab is the place, culture and emotional landscape behind the house. Together, the name reflects fragrances created with warmth, restraint and a sense of belonging.</p></section>
    <section><p className="eyebrow">Our approach</p><h2>Your oil. Your atmosphere.</h2><p>We do not believe fragrance should announce a person before they arrive. Our oils are intended to sit closer—to develop with warmth, movement and time. Every Rehmat carries a different atmosphere, from clean musk and soft woods to rose, oud, amber and dark fruit.</p></section>
  </div>
  <section className="story-page-collection"><div><p className="eyebrow">The collection</p><h2>Names of our own.<br/>Directions made clear.</h2></div><div><p>The collection brings together original Rehmat names and selected inspired fragrance interpretations. Where an inspiration is named, it remains secondary to the Rehmat fragrance.</p><p className="story-disclaimer">References to inspiration fragrances describe scent direction only. Rehmat Panjab is independent and is not affiliated with, endorsed by or licensed by the owners of those fragrances.</p></div></section>
  <section className="story-page-ritual"><p className="eyebrow">The ritual</p><h2>A few drops.<br/>Time does the rest.</h2><ul><li>Apply sparingly to pulse points.</li><li>Allow the oil to settle naturally.</li><li>Experience may vary by skin, climate and application.</li></ul></section>
  <section className="story-page-closing"><h2>Made to be worn.<br/>Not announced.</h2><div className="button-row"><Link className="button button-cream" href="/collection">Explore fragrances</Link><OpenGuideButton className="button button-outline"/><Link className="text-link" href="/contact">Contact Rehmat Panjab <span aria-hidden="true">↗</span></Link></div></section>
</main>; }
