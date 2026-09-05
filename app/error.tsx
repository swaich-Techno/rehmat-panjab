"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main-content" className="error-page"><p className="eyebrow">The atmosphere shifted</p><h1>We couldn’t open<br /><em>that just yet.</em></h1><button className="button button-dark" type="button" onClick={reset}>Try once more</button></main>; }
