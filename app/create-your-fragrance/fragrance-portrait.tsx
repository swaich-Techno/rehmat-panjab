"use client";

import Link from "next/link";
import { useState } from "react";

const stages = [
  { title: "Choose your opening", role: "Opening", options: [
    { id: "citrus", label: "Pale citrus", mood: "Bright", color: "#d9c95d", closest: "white-oud" },
    { id: "saffron", label: "Golden spice", mood: "Radiant", color: "#c77c22", closest: "saffron-amber-oud" },
    { id: "air", label: "Clean air", mood: "Quiet", color: "#dfe6db", closest: "musk-rizali" },
  ]},
  { title: "Choose its heart", role: "Heart", options: [
    { id: "rose", label: "Rose haze", mood: "Velvety", color: "#b76169", closest: "oud-rose" },
    { id: "cream", label: "Warm cream", mood: "Comforting", color: "#d5b27c", closest: "vanilla-musk" },
    { id: "glass", label: "Cool glass", mood: "Clear", color: "#bfd0c4", closest: "white-oud" },
  ]},
  { title: "Choose its base", role: "Base", options: [
    { id: "musk", label: "Soft musk", mood: "Intimate", color: "#e1dfd2", closest: "musk-rizali" },
    { id: "oud", label: "Dark wood", mood: "Grounded", color: "#6c412e", closest: "saffron-amber-oud" },
    { id: "amber", label: "Amber warmth", mood: "Evening", color: "#aa612c", closest: "oud-rose" },
  ]},
  { title: "Set the radius", role: "Mood", options: [
    { id: "private", label: "Close / private", mood: "Close", color: "#ced8cb", closest: "musk-rizali" },
    { id: "warm", label: "Warm / nearby", mood: "Warm", color: "#c58b55", closest: "vanilla-musk" },
    { id: "deep", label: "Deep / remembered", mood: "Deep", color: "#87454a", closest: "oud-rose" },
  ]},
];

type Choice = typeof stages[number]["options"][number] & { role: string };

export function FragrancePortrait() {
  const [started, setStarted] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const step = choices.length;
  const complete = step === stages.length;
  const closestCounts = choices.reduce<Record<string, number>>((counts, choice) => ({ ...counts, [choice.closest]: (counts[choice.closest] ?? 0) + 1 }), {});
  const closest = complete ? Object.entries(closestCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "musk-rizali" : "musk-rizali";

  async function share() {
    const text = `My Rehmat: ${choices.map((choice) => choice.label).join(" · ")}`;
    try {
      if (navigator.share) await navigator.share({ title: "My Rehmat", text, url: window.location.href });
      else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setShareMessage("Portrait link copied."); }
    } catch { setShareMessage("Sharing was closed."); }
  }

  if (!started) return (
    <section className="create-intro immersive-intro">
      <div className="quiz-intro-copy">
        <p className="eyebrow">Create your Rehmat</p>
        <h1>A scent concept<br />you can <em>see.</em></h1>
        <p>Choose four sensory directions. Each one becomes a layer of colour inside your vessel—a preference portrait, never a manufactured formula.</p>
        <button className="button button-dark" type="button" onClick={() => setStarted(true)}>Begin the portrait</button>
      </div>
      <Vessel choices={[]} />
    </section>
  );

  return (
    <section className="create-stage">
      <div className="vessel-column">
        <p className="eyebrow">Your vessel · {Math.round((step / stages.length) * 100)}%</p>
        <Vessel choices={choices} />
        <div className="vessel-progress"><i style={{ transform: `scaleX(${step / stages.length})` }} /></div>
      </div>
      {!complete ? (
        <div className="create-choices">
          <p className="eyebrow">{String(step + 1).padStart(2, "0")} / 04 · {stages[step].role}</p>
          <h1>{stages[step].title}</h1>
          <div>
            {stages[step].options.map((option) => (
              <button key={option.id} type="button" onClick={() => setChoices((current) => [...current, { ...option, role: stages[step].role }])} style={{ "--choice": option.color } as React.CSSProperties}>
                <i /><span>{option.label}</span><small>{option.mood}</small>
              </button>
            ))}
          </div>
          <button className="back-button" type="button" disabled={!step} onClick={() => setChoices((current) => current.slice(0, -1))}>← Back</button>
        </div>
      ) : (
        <div className="portrait-result">
          <p className="eyebrow">Your Rehmat · Fragrance preference portrait</p>
          <h1>{choices[0].mood}<br /><em>{choices[2].mood}</em></h1>
          <dl>{choices.slice(0, 3).map((choice) => <div key={choice.id}><dt>{choice.role}</dt><dd>{choice.label}</dd></div>)}</dl>
          <div className="portrait-mood"><span>Mood</span>{choices.map((choice) => <b key={choice.id}>{choice.mood}</b>)}</div>
          <div className="button-row">
            <Link className="button button-dark" href={`/product/${closest}`}>Find the closest Rehmat</Link>
            <Link className="button button-outline" href="/auth/login?returnTo=/my-rehmat">Sign in to save</Link>
            <button className="text-button" type="button" onClick={share}>Share</button>
            <button className="text-button" type="button" onClick={() => setChoices([])}>Start again</button>
          </div>
          <p className="form-message" aria-live="polite">{shareMessage}</p>
        </div>
      )}
    </section>
  );
}

function Vessel({ choices }: { choices: Choice[] }) {
  return (
    <div className="rehmat-vessel" aria-label={`Vessel ${Math.round((choices.length / 4) * 100)} percent full`}>
      <div className="vessel-cap"><i /><i /><i /></div>
      <div className="vessel-neck" />
      <div className="vessel-glass">
        <div className="vessel-shine" />
        <div className="vessel-liquid" style={{ height: `${8 + choices.length * 22}%` }}>
          {choices.map((choice, index) => <i key={`${choice.id}-${index}`} style={{ "--liquid": choice.color, "--layer": index } as React.CSSProperties} />)}
        </div>
        {choices.map((choice, index) => <span className="falling-component" key={choice.id} style={{ "--liquid": choice.color, "--delay": `${index * 120}ms` } as React.CSSProperties} />)}
        <b>R</b>
      </div>
      <div className="vessel-base" />
    </div>
  );
}
