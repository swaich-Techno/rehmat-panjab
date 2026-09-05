"use client";

import Link from "next/link";
import { useState } from "react";

const questions = [
  { prompt: "The next Rehmat should feel…", options: ["Rain on stone", "Warm lamplight", "A rose after dark"] },
  { prompt: "Its texture should be…", options: ["Clear and weightless", "Soft and creamy", "Deep and resinous"] },
  { prompt: "You would wear it…", options: ["Every quiet morning", "Close to someone", "When the evening begins"] },
];

export function DropRoom() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "saved" | "signin" | "error">("idle");
  const step = answers.length;

  async function submit() {
    setState("loading");
    try {
      const response = await fetch("/api/next-drop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) });
      if (response.status === 401) { setState("signin"); return; }
      if (!response.ok) throw new Error();
      setState("saved");
    } catch { setState("error"); }
  }

  if (!started) return (
    <section className="drop-room-intro">
      <div className="drop-room-copy">
        <p className="eyebrow light">The next Rehmat · Drop room</p>
        <h1>The bottle is empty.<br /><em>You set the mood.</em></h1>
        <p>Three choices shape the community direction. No fake vote count—just a considered brief for what comes next.</p>
        <button className="button button-cream" type="button" onClick={() => setStarted(true)}>Enter the drop room</button>
      </div>
      <div className="empty-drop-vessel" aria-hidden="true"><i /><span>?</span></div>
    </section>
  );

  if (step < questions.length) return (
    <section className="drop-question">
      <div className="drop-question-visual" aria-hidden="true"><i style={{ height: `${22 + step * 23}%` }} /><span>{Math.round((step / questions.length) * 100)}%</span></div>
      <div className="drop-question-copy">
        <p className="eyebrow">Community brief · {String(step + 1).padStart(2, "0")} / 03</p>
        <h1>{questions[step].prompt}</h1>
        <div className="drop-options">
          {questions[step].options.map((option) => <button key={option} type="button" onClick={() => setAnswers((current) => [...current, option])}>{option}<i /></button>)}
        </div>
        <button className="back-button" type="button" disabled={!step} onClick={() => setAnswers((current) => current.slice(0, -1))}>← Back</button>
      </div>
    </section>
  );

  return (
    <section className="drop-result">
      <div>
        <p className="eyebrow">Your direction for the next Rehmat</p>
        <h1>{answers[0]}</h1>
        <p>{answers.slice(1).join(" · ")}</p>
        {state === "idle" && <button className="button button-dark" type="button" onClick={submit}>Save my vote</button>}
        {state === "loading" && <button className="button button-dark" type="button" disabled>Saving…</button>}
        {state === "signin" && <div className="action-notice"><p>Sign in to verify and save one vote for this drop.</p><Link className="button button-dark" href="/auth/login?returnTo=/next-drop">Enter the private archive</Link></div>}
        {state === "saved" && <p className="success-note" role="status">Your vote is in the room.</p>}
        {state === "error" && <div className="action-notice"><p>We couldn’t save that yet. Your choices are still here.</p><button className="text-button" type="button" onClick={submit}>Try once more</button></div>}
      </div>
      <ol className="drop-timeline">
        <li className="complete"><span>Concept</span><b>Complete</b></li>
        <li className="active"><span>Community vote</span><b>Active</b></li>
        <li><span>Testing</span><b>Not started</b></li>
        <li><span>Bottle</span><b>Not started</b></li>
        <li><span>Arrival</span><b>Not started</b></li>
      </ol>
    </section>
  );
}
