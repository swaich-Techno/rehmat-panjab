"use client";

import { FormEvent, useState } from "react";

export function NotifyForm({ productSlug }: { productSlug?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    setMessage("");
    try {
      const [response] = await Promise.all([
        fetch("/api/notifications", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: data.get("email"),
            consent: data.get("consent") === "on",
            category: productSlug ? "restock" : "product_launch",
            productSlug,
          }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 900)),
      ]);
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message);
      setStatus("success");
      setMessage(result.message ?? "You’re on the private list.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && error.message ? error.message : "We couldn’t save that yet. Try once more.");
    }
  }

  return (
    <form className="notify-form" onSubmit={submit}>
      <label htmlFor={`notify-${productSlug ?? "house"}`}>Email address</label>
      <div className="input-row">
        <input id={`notify-${productSlug ?? "house"}`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <button className={`button button-dark transit-button state-${status}`} type="submit" disabled={status === "loading" || status === "success"}>
          <span className="transit-label">{status === "success" ? "You’re on the list" : status === "loading" ? "Sending" : "Notify me"}</span>
          <span className="transit-route" aria-hidden="true"><i /><b /><em /></span>
          <span className="transit-success" aria-hidden="true">Joined <i>✓</i></span>
        </button>
      </div>
      <label className="consent-row">
        <input type="checkbox" name="consent" required />
        <span>I agree to receive this Rehmat update by email. I can unsubscribe at any time.</span>
      </label>
      <p className={`form-message ${status}`} aria-live="polite">{message}</p>
    </form>
  );
}
