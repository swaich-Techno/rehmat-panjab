"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { products } from "../../lib/products";
import { quizQuestions, scoreQuiz, type QuizOption } from "../../lib/quiz";

export function ScentQuiz() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [preview, setPreview] = useState<QuizOption | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);

  const complete = step >= quizQuestions.length;
  const question = quizQuestions[step];
  const ranking = complete ? scoreQuiz(answers) : [];
  const primary = ranking[0] ? products.find((product) => product.id === ranking[0][0])! : products[0];
  const secondary = ranking[1] ? products.find((product) => product.id === ranking[1][0])! : products[1];
  const selectedOptions = quizQuestions.flatMap((item) => item.options).filter((option) => answers.includes(option.id));
  const profileWords = [...new Set(selectedOptions.flatMap((option) => option.feeling))].slice(0, 3);

  function beginHold(option: QuizOption) {
    didHold.current = false;
    holdTimer.current = setTimeout(() => { didHold.current = true; setPreview(option); }, 500);
  }

  function endHold(option: QuizOption) {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (didHold.current) { setPreview(null); return; }
    setAnswers((current) => [...current, option.id]);
    setStep((current) => current + 1);
  }

  async function share() {
    const text = `My Rehmat profile: ${primary.name} — ${profileWords.join(" · ")}`;
    try {
      if (navigator.share) await navigator.share({ title: "My Rehmat", text, url: window.location.href });
      else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setShareMessage("Result link copied."); }
    } catch { setShareMessage("Sharing was closed."); }
  }

  if (step === -1) return (
    <section className="quiz-intro immersive-intro">
      <div className="quiz-intro-copy">
        <p className="eyebrow">Your scent profile · Six questions</p>
        <h1>What should your<br />fragrance <em>feel</em> like?</h1>
        <p>Choose by instinct. Every answer changes the atmosphere and brings one of the five closer.</p>
        <button className="button button-dark" type="button" onClick={() => setStep(0)}>Begin</button>
      </div>
      <div className="sensory-orb" aria-hidden="true"><i /><i /><span>Tap to choose<br />Hold to feel</span></div>
    </section>
  );

  if (complete) return (
    <section className="quiz-result">
      <div className="result-atmosphere" style={{ "--result-color": primary.color } as React.CSSProperties} aria-hidden="true"><i /><i /><i /></div>
      <div className="result-copy">
        <p className="eyebrow">Your scent profile</p>
        <p className="result-number">{primary.number}</p>
        <h1>{primary.name}</h1>
        <p className="match-label">Primary match</p>
        <div className="result-words">{profileWords.map((word) => <span key={word}>{word}</span>)}</div>
        <div className="why-match">
          <p className="eyebrow">Why it matches</p>
          <p>Your choices leaned {profileWords.join(", ").toLowerCase()}. {primary.atmosphere}</p>
          <p className="second-match">A close neighbour: <Link href={`/product/${secondary.slug}`}>{secondary.name}</Link></p>
        </div>
        <div className="button-row result-actions">
          <Link className="button button-dark" href={`/product/${primary.slug}`}>Explore this Rehmat</Link>
          <Link className="button button-outline" href="/auth/login?returnTo=/my-rehmat">Sign in to save</Link>
          <button className="text-button" type="button" onClick={share}>Share result</button>
          <button className="text-button" type="button" onClick={() => { setAnswers([]); setStep(0); }}>Start again</button>
        </div>
        <p className="form-message" aria-live="polite">{shareMessage}</p>
      </div>
    </section>
  );

  return (
    <section className="quiz-stage" style={{ "--preview": preview?.tint ?? "#e8e8dc" } as React.CSSProperties}>
      <header className="quiz-progress">
        <span>{String(step + 1).padStart(2, "0")} / {String(quizQuestions.length).padStart(2, "0")}</span>
        <div
          className="quiz-code-progress"
          role="progressbar"
          aria-label="Scent profile progress"
          aria-valuemin={1}
          aria-valuemax={quizQuestions.length}
          aria-valuenow={step + 1}
        >
          {quizQuestions.map((item, index) => (
            <i
              className={index < step ? "is-complete" : index === step ? "is-current" : ""}
              key={item.prompt}
              aria-hidden="true"
            />
          ))}
        </div>
        <button type="button" onClick={() => { setAnswers((current) => current.slice(0, -1)); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0}>Back</button>
      </header>
      <div className="quiz-question">
        <p className="eyebrow">{question.kicker}</p>
        <h1>{question.prompt}</h1>
        <p className="quiz-instruction">Tap to choose. Hold to feel.</p>
      </div>
      <div className="quiz-options">
        {question.options.map((option) => (
          <button
            type="button"
            key={option.id}
            style={{ "--option-tint": option.tint } as React.CSSProperties}
            onPointerDown={() => beginHold(option)}
            onPointerUp={() => endHold(option)}
            onPointerLeave={() => { if (holdTimer.current) clearTimeout(holdTimer.current); if (didHold.current) setPreview(null); }}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); endHold(option); } }}
          >
            <span>{option.label}</span><i aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className={preview ? "sensory-preview is-visible" : "sensory-preview"} aria-live="polite">
        {preview && <><p>{preview.label}</p><div>{preview.feeling.map((word) => <span key={word}>{word}</span>)}</div></>}
      </div>
    </section>
  );
}
