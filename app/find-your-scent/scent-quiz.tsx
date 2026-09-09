"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExperienceSettings } from "../../lib/experience-settings";
import { products, type ScentId } from "../../lib/products";
import { buildPortraitName, quizQuestions, scoreQuiz, type QuizAnswers } from "../../lib/quiz";
import { WhatsAppOrder } from "../components/whatsapp-order";

const refinements: Array<[string, ScentId]> = [["Softer","musk"],["Warmer","vanilla"],["Less sweet","white-oud"],["More floral","nazakat"],["More woody","white-oud"],["Daytime","musk"],["Evening","junoon"],["Bolder","red-musk"],["Simpler","musk"]];

export function ScentQuiz({ settings }: { settings: ExperienceSettings }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [refined, setRefined] = useState<ScentId | null>(null);
  const [message, setMessage] = useState("");
  const complete = step >= quizQuestions.length;
  const question = quizQuestions[step];
  const ranking = useMemo(() => scoreQuiz(answers), [answers]);
  const primaryId = refined ?? ranking[0]?.[0] ?? "musk";
  const primary = products.find((item) => item.id === primaryId) ?? products[0];
  const alternatives = [primary, ...ranking.map(([id]) => products.find((item) => item.id === id)!).filter(Boolean)].filter((item, index, list) => list.findIndex((other) => other.id === item.id) === index).slice(0,3);
  const feelings = [...new Set(quizQuestions.flatMap((item) => item.options.filter((option) => answers[item.id]?.includes(option.id)).flatMap((option) => option.feeling)))].slice(0,4);
  const portrait = buildPortraitName(answers, primary.id, settings.portraitWords);
  const chosen = answers[question?.id] ?? [];

  function choose(optionId: string) {
    if (!question) return;
    if (question.multiple) {
      setAnswers((current) => { const values = current[question.id] ?? []; const next = values.includes(optionId) ? values.filter((id) => id !== optionId) : values.length < (question.limit ?? 1) ? [...values, optionId] : values; return { ...current, [question.id]: next }; });
    } else {
      setAnswers((current) => ({ ...current, [question.id]: [optionId] }));
      setTimeout(() => setStep((value) => value + 1), 160);
    }
  }

  async function share() {
    const text = `My Rehmat scent portrait is ${portrait}: ${primary.name} — ${feelings.join(" · ")}.`;
    try { if (navigator.share) await navigator.share({ title: portrait, text, url: window.location.href }); else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setMessage("Result copied."); } } catch { setMessage("Sharing was closed."); }
  }

  async function save() {
    setMessage("Saving…");
    const response = await fetch("/api/quiz/save", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ answers, portrait, primaryId:primary.id, secondaryId:alternatives[1]?.id ?? primary.id, feelings }) });
    const result = await response.json().catch(() => ({ message:"Could not save this portrait." })); setMessage(result.message);
  }

  if (!settings.quizEnabled) return <section className="quiz-intro immersive-intro"><div className="quiz-intro-copy"><p className="eyebrow">Name Your Rehmat</p><h1>The guide is resting.</h1><p>Please return soon.</p></div></section>;
  if (step === -1) return <section className="quiz-intro immersive-intro"><div className="quiz-intro-copy"><p className="eyebrow">Name Your Rehmat · 12 questions</p><h1>Give your scent<br />instinct a <em>name.</em></h1><p>A private, expressive guide grounded in the active Rehmat fragrance collection. No medical or scientific claims—only considered direction.</p><button className="button button-dark" type="button" onClick={() => setStep(0)}>Begin the portrait</button></div><div className="sensory-orb" aria-hidden="true"><i /><span>Choose by instinct<br />Refine at the end</span></div></section>;

  if (complete) {
    const layerIds = alternatives.slice(0, answers.format?.[0] === "three" ? 3 : 2).map((item) => item.id).join(",");
    return <section className="quiz-result"><div className="result-atmosphere" style={{"--result-color":primary.color} as React.CSSProperties} aria-hidden="true"><i /><i /><i /></div><div className="result-copy"><p className="eyebrow">Your named Rehmat</p><h1>{portrait}</h1><p className="match-label">Primary match · {primary.name}</p><div className="result-words">{feelings.map((word) => <span key={word}>{word}</span>)}</div><div className="why-match"><p className="eyebrow">Why it matches</p><p>Your choices point toward {primary.atmosphere.toLowerCase()}</p><p><strong>Wear:</strong> {answers.wear?.includes("evening") ? "Evening and considered occasions" : "Daytime and adaptable occasions"}. <strong>Strength:</strong> {answers.strength?.[0] ?? "balanced"}.</p><p>For gifting, use this as a starting point and keep the recipient’s own preferences central.</p></div><div className="quiz-alternatives">{alternatives.map((item,index) => <Link href={`/product/${item.slug}`} key={item.id}><span>{index === 0 ? "Primary" : index === 1 ? "Secondary" : "Alternative"}</span><strong>{item.name}</strong></Link>)}</div><div className="quiz-refine"><p className="eyebrow">Refine the result</p>{refinements.map(([label,id]) => <button className={refined === id ? "is-selected" : ""} type="button" key={label} onClick={() => setRefined(id)}>{label}</button>)}</div><div className="button-row result-actions"><Link className="button button-dark" href={`/product/${primary.slug}`}>Explore {primary.name}</Link><Link className="button button-outline" href={`/layer?products=${layerIds}`}>Open in Layering Lab</Link><button className="text-button" type="button" onClick={share}>Share</button><button className="text-button" type="button" onClick={save}>Save to My Rehmat</button><button className="text-button" type="button" onClick={() => { setAnswers({}); setRefined(null); setStep(0); }}>Restart</button></div><p className="form-message" aria-live="polite">{message}</p><WhatsAppOrder compact products={[primary].map((item) => ({name:item.name,slug:item.slug,variants:item.enabledSizes.map((sizeMl) => ({sizeMl,pricePaise:item.prices[sizeMl],currency:"INR" as const}))}))} settings={{enabled:settings.whatsappEnabled,number:settings.whatsappNumber,defaultMessage:settings.whatsappDefaultMessage,notice:settings.whatsappNotice}} /></div></section>;
  }

  return <section className="quiz-stage"><header className="quiz-progress"><span>{String(step+1).padStart(2,"0")} / {quizQuestions.length}</span><div className="quiz-code-progress" role="progressbar" aria-label="Scent portrait progress" aria-valuemin={1} aria-valuemax={quizQuestions.length} aria-valuenow={step+1}>{quizQuestions.map((item,index) => <i key={item.id} className={index<step?"is-complete":index===step?"is-current":""} />)}</div><button type="button" onClick={() => setStep((value) => Math.max(0,value-1))} disabled={step===0}>Back</button></header><div className="quiz-question"><p className="eyebrow">{question.kicker}</p><h1>{question.prompt}</h1>{question.multiple && <p className="quiz-instruction">Choose up to {question.limit}. Then continue.</p>}</div><div className="quiz-options">{question.options.map((option) => <button className={chosen.includes(option.id)?"is-selected":""} aria-pressed={chosen.includes(option.id)} type="button" key={option.id} onClick={() => choose(option.id)}><span>{option.label}</span><i aria-hidden="true" /></button>)}</div>{question.multiple && <div className="quiz-next-row"><button className="button button-dark" type="button" disabled={!chosen.length} onClick={() => setStep((value) => value+1)}>Continue</button></div>}</section>;
}
