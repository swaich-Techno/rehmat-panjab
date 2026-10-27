import { upcomingFragrances } from "../../lib/upcoming-fragrances";

export function UpcomingFragrances() {
  return <section className="upcoming-fragrances" aria-labelledby="upcoming-fragrances-heading">
    <header>
      <p className="eyebrow">On the blending table</p>
      <h2 id="upcoming-fragrances-heading">New Ouds &amp; Attars<br/><em>Loading.</em></h2>
      <p>Eight fragrance directions we are preparing for the house. Notes, sizes, prices and release dates will be shared only after each blend is ready.</p>
    </header>
    <div className="upcoming-fragrance-grid">
      {upcomingFragrances.map((fragrance, index) => <article className="upcoming-fragrance-card" key={fragrance.name}>
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <p>{fragrance.category}</p>
        <h3>{fragrance.name}</h3>
        <strong>Coming soon</strong>
      </article>)}
    </div>
  </section>;
}
