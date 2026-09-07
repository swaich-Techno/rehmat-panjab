"use client";

import { useState } from "react";

export function ReviewActions({ id, response, verified }: { id: string; response: string; verified: boolean }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function update(payload: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const reply = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...payload }) });
    const result = await reply.json() as { message?: string }; setBusy(false); setMessage(result.message ?? (reply.ok ? "Saved." : "Unable to save."));
    if (reply.ok) window.location.reload();
  }
  return <div className="review-admin-actions"><div><button type="button" disabled={busy} onClick={() => update({ status: "approved" })}>Approve</button><button type="button" disabled={busy} onClick={() => update({ status: "rejected" })}>Reject</button><button type="button" disabled={busy} onClick={() => update({ status: "archived" })}>Archive</button>{!verified && <button type="button" disabled={busy} onClick={() => update({ verifiedPurchase: true })}>Verify purchase</button>}</div><label>Public response<textarea defaultValue={response} id={`response-${id}`} rows={3} /></label><button className="button button-outline" type="button" disabled={busy} onClick={() => update({ adminResponse: (document.getElementById(`response-${id}`) as HTMLTextAreaElement)?.value ?? "" })}>Save response</button><p role="status">{message}</p></div>;
}

export function ReviewSettingsToggle({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  async function toggle() { setBusy(true); const response = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ submissionsEnabled: !enabled }) }); setBusy(false); if (response.ok) window.location.reload(); }
  return <button className="button button-outline" type="button" disabled={busy} onClick={toggle}>{enabled ? "Pause all submissions" : "Enable submissions"}</button>;
}
