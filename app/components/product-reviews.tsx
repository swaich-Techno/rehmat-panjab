"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ReviewSummary } from "../../lib/reviews";

export function ProductReviews({ productId, productName, summary }: { productId: string; productName: string; summary: ReviewSummary }) {
  const startedAt = useRef(0);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => { startedAt.current = Date.now(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending"); setMessage("");
    const form = new FormData(event.currentTarget); form.set("productId", productId); form.set("startedAt", String(startedAt.current));
    try {
      const response = await fetch("/api/reviews", { method: "POST", body: form });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "The review could not be submitted.");
      event.currentTarget.reset(); startedAt.current = Date.now(); setState("success"); setMessage("Thank you. Your review is awaiting moderation.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "The review could not be submitted."); }
  }

  return <section className="product-reviews" aria-labelledby="reviews-title">
    <div className="reviews-heading"><div><p className="eyebrow">05 · Community notes</p><h2 id="reviews-title">Reviews of<br />{productName}.</h2></div><div className="rating-summary" aria-label={`${summary.average.toFixed(1)} out of 5 from ${summary.total} approved reviews`}><strong>{summary.total ? summary.average.toFixed(1) : "—"}</strong><span>{summary.total} approved {summary.total === 1 ? "review" : "reviews"}</span></div></div>
    <div className="rating-breakdown">{[5,4,3,2,1].map((rating) => <div key={rating}><span>{rating} star</span><i><b style={{ transform: `scaleX(${summary.total ? summary.breakdown[rating] / summary.total : 0})` }} /></i><small>{summary.breakdown[rating]}</small></div>)}</div>
    <div className="reviews-list">
      {!summary.reviews.length && <p className="reviews-empty">No reviews yet. Be the first to share your experience with this fragrance.</p>}
      {summary.reviews.map((review) => <article key={review.id}><header><div><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><h3>{review.title}</h3></div><time dateTime={review.createdAt}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time></header><p>{review.body}</p>{review.imageUrl && <Image src={review.imageUrl} alt={`Customer image submitted with ${review.title}`} width={420} height={420} /> }<footer><span>{review.displayName}</span>{review.verifiedPurchase && <b>Verified purchase</b>}<small>{review.helpfulCount} found this helpful</small></footer>{review.adminResponse && <blockquote><strong>Rehmat Panjab responds</strong><p>{review.adminResponse}</p></blockquote>}</article>)}
    </div>
    {summary.submissionsEnabled ? <form className="review-form" onSubmit={submit}><div className="review-form-heading"><p className="eyebrow">Share your experience</p><h3>Your words remain private until approved.</h3></div><div><label htmlFor="review-name">Display name</label><input id="review-name" name="displayName" minLength={2} maxLength={80} required autoComplete="name" /></div><div><label htmlFor="review-email">Email address <small>Never published</small></label><input id="review-email" name="email" type="email" required autoComplete="email" /></div><fieldset><legend>Rating</legend><div className="rating-input">{[5,4,3,2,1].map((rating) => <label key={rating}><input type="radio" name="rating" value={rating} required /><span>{rating} star{rating === 1 ? "" : "s"}</span></label>)}</div></fieldset><div className="full"><label htmlFor="review-title">Review title</label><input id="review-title" name="title" minLength={2} maxLength={120} required /></div><div className="full"><label htmlFor="review-body">Review</label><textarea id="review-body" name="body" minLength={20} maxLength={2000} rows={6} required /></div><div className="full"><label htmlFor="review-image">Optional image <small>JPEG, PNG or WebP · 4 MB maximum</small></label><input id="review-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" /></div><div className="review-honeypot" aria-hidden="true"><label htmlFor="review-website">Website</label><input id="review-website" name="website" tabIndex={-1} autoComplete="off" /></div><label className="review-consent full"><input type="checkbox" name="consent" value="yes" required /><span>I consent to Rehmat Panjab publishing this review after moderation.</span></label><button className="button button-dark" type="submit" disabled={state === "sending"}>{state === "sending" ? "Submitting…" : "Submit for review"}</button><p className={`form-message ${state}`} role="status">{message}</p></form> : <p className="reviews-closed">Review submissions are currently paused.</p>}
  </section>;
}
