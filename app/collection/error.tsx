"use client";

export default function CollectionError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="collection-page">
      <section className="commerce-empty" role="alert">
        <p className="eyebrow">Catalogue unavailable</p>
        <h1>We could not load the collection.</h1>
        <p>Please try again. If the problem continues, the store may be receiving an update.</p>
        <button className="primary-action" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
