"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

export function ArchiveLogin({ configured, returnTo }: { configured: boolean; returnTo: string }) {
  const [state, setState] = useState<"locked" | "verifying" | "open" | "error">("locked");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setState("error"); setMessage("The private archive is not accepting sign-ins yet."); return; }
    setState("verifying"); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setState("error"); setMessage("Those details didn’t open the archive. Check them and try again."); return; }
    setState("open");
    window.location.assign(returnTo);
  }

  return (
    <section className={`archive-login state-${state}`}>
      <div className="vault-visual" aria-hidden="true">
        <div className="vault-door"><i /><i /><i /><i /><div className="vault-dial"><b>R</b><span /><span /><span /></div></div>
        <div className="oil-keyline" />
        <p>{state === "locked" || state === "error" ? "Locked" : state === "verifying" ? "Verifying" : "Open"}</p>
      </div>
      <div className="login-copy">
        <p className="eyebrow">Private fragrance archive</p>
        <h1>Return to<br /><em>your Rehmat.</em></h1>
        <p>Your scent profile, saved portraits, layering ideas, and drop-room votes live here.</p>
        <form onSubmit={submit}>
          <label htmlFor="archive-email">Email</label>
          <input id="archive-email" name="email" type="email" autoComplete="email" required disabled={!configured || state === "verifying"} />
          <label htmlFor="archive-password">Password</label>
          <input id="archive-password" name="password" type="password" autoComplete="current-password" required disabled={!configured || state === "verifying"} />
          <button className="button button-dark" type="submit" disabled={!configured || state === "verifying"}>{state === "verifying" ? "Unlocking…" : "Unlock archive"}</button>
          {!configured && <p className="archive-closed">The private archive is opening soon. Public discovery remains available.</p>}
          <p className="form-message error" role="alert">{message}</p>
        </form>
      </div>
    </section>
  );
}
