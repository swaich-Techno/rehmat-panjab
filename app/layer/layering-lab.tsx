"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExperienceSettings } from "../../lib/experience-settings";
import type { LayeringMode, LayeringPreferences, LayeringRecommendation } from "../../lib/layering";
import type { Product, ScentId } from "../../lib/products";
import { WhatsAppOrder } from "../components/whatsapp-order";

export function LayeringLab({ catalogue, settings, initialSelected }: { catalogue: Product[]; settings: ExperienceSettings; initialSelected: ScentId[] }) {
  const [mode, setMode] = useState<LayeringMode>(initialSelected.length ? "build" : "guide");
  const [selected, setSelected] = useState<ScentId[]>(initialSelected);
  const [preferences, setPreferences] = useState<LayeringPreferences>({ time: "either", intensity: "balanced", count: 2 });
  const [recommendation, setRecommendation] = useState<LayeringRecommendation | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const recommendedProducts = useMemo(() => recommendation?.productIds.map((id) => catalogue.find((product) => product.id === id)).filter((product): product is Product => Boolean(product)) ?? [], [catalogue, recommendation]);
  const whatsappProducts = recommendedProducts.map((product) => ({ name: product.name, slug: product.slug, variants: product.enabledSizes.map((size) => ({ sizeMl: size, pricePaise: product.prices[size] ?? null, currency: "INR" as const })) }));

  function toggle(id: ScentId) {
    setRecommendation(null); setMessage("");
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < settings.layeringMaxFragrances ? [...current, id] : current);
  }
  function move(id: ScentId, direction: -1 | 1) {
    setSelected((current) => { const index = current.indexOf(id); const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  async function ask(prompt = followUp) {
    if (mode === "build" && selected.length < 2) { setMessage("Choose at least two fragrances."); return; }
    setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/layering", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, selectedIds: selected, preferences, followUp: prompt || undefined, history }) });
      const result = await response.json() as { recommendation?: LayeringRecommendation; message?: string };
      if (!response.ok || !result.recommendation) throw new Error(result.message ?? "The adviser could not respond.");
      setRecommendation(result.recommendation); setHistory((current) => [...current, prompt || "Initial recommendation"].slice(-6)); setFollowUp(""); setStatus("idle");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "The adviser could not respond. Try again."); }
  }
  async function share() {
    if (!recommendation) return; const text = `${recommendation.combinationName}: ${recommendedProducts.map((product) => product.name).join(" + ")} — creative guidance from Rehmat Panjab.`;
    try { if (navigator.share) await navigator.share({ title: recommendation.combinationName, text, url: window.location.href }); else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setMessage("Recommendation copied."); } } catch { setMessage("Sharing was closed."); }
  }
  async function save() {
    if (!recommendation) return; const response = await fetch("/api/layering/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(recommendation) });
    setMessage(response.ok ? "Saved to My Rehmat." : response.status === 401 ? "Sign in to save this recommendation." : "The recommendation could not be saved.");
  }
  function restart() { setSelected([]); setRecommendation(null); setFollowUp(""); setHistory([]); setMessage(""); setStatus("idle"); }

  if (!settings.layeringEnabled) return <section className="layer-page experience-paused"><p className="eyebrow">Layering Lab</p><h1>The adviser is resting.</h1><p>Please return soon.</p></section>;
  return <section className="layer-page ai-layer-page">
    <header className="layer-heading"><p className="eyebrow">AI Layering Lab · Creative guidance</p><h1>Build a ritual.<br /><em>Keep it close.</em></h1><p>Explore grounded combinations using active Rehmat fragrances. The guide never makes formulation, ingredient or medical claims.</p></header>
    <div className="experience-mode-tabs" role="tablist" aria-label="Layering Lab mode"><button role="tab" aria-selected={mode === "guide"} onClick={() => { setMode("guide"); setRecommendation(null); }}>Guide Me</button><button role="tab" aria-selected={mode === "build"} onClick={() => { setMode("build"); setRecommendation(null); }}>Build My Own</button></div>
    <div className="layer-consultation">
      {mode === "guide" ? <form className="guide-form" onSubmit={(event) => { event.preventDefault(); void ask(); }}>
        <label>Desired mood<select value={preferences.mood ?? ""} onChange={(event) => setPreferences((current) => ({ ...current, mood: event.target.value }))}><option value="">Let the guide decide</option>{settings.suggestedMoods.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Occasion<select value={preferences.occasion ?? ""} onChange={(event) => setPreferences((current) => ({ ...current, occasion: event.target.value }))}><option value="">Any occasion</option>{settings.suggestedOccasions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Time<select value={preferences.time} onChange={(event) => setPreferences((current) => ({ ...current, time: event.target.value as LayeringPreferences["time"] }))}><option value="day">Day</option><option value="evening">Evening</option><option value="either">Either</option></select></label>
        <label>Intensity<select value={preferences.intensity} onChange={(event) => setPreferences((current) => ({ ...current, intensity: event.target.value as LayeringPreferences["intensity"] }))}><option value="soft">Soft</option><option value="balanced">Balanced</option><option value="rich">Rich</option></select></label>
        <label>Character<select value={preferences.preference ?? ""} onChange={(event) => setPreferences((current) => ({ ...current, preference: event.target.value as LayeringPreferences["preference"] }))}><option value="">Open preference</option>{["sweet","musky","floral","woody","amber","warm"].map((item) => <option key={item} value={item}>{item[0].toUpperCase()+item.slice(1)}</option>)}</select></label>
        <label>Number of fragrances<select value={preferences.count} onChange={(event) => setPreferences((current) => ({ ...current, count: Number(event.target.value) }))}>{Array.from({ length: settings.layeringMaxFragrances }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count === 1 ? "One fragrance" : `${count} fragrances`}</option>)}</select></label>
        <button className="button button-dark" disabled={status === "loading"}>Create recommendation</button>
      </form> : <div className="build-layering">
        <p>Choose two to {settings.layeringMaxFragrances} active fragrances. Use the arrow controls to set your preferred order.</p>
        <div className="layer-select">{catalogue.map((product) => <button type="button" key={product.id} className={selected.includes(product.id) ? "is-selected" : ""} disabled={!selected.includes(product.id) && selected.length >= settings.layeringMaxFragrances} onClick={() => toggle(product.id)} style={{ "--scent": product.color } as React.CSSProperties}><i /><span>{product.number} · {product.name}</span><b>{selected.includes(product.id) ? "Remove" : "Add"}</b></button>)}</div>
        {selected.length > 0 && <ol className="selected-layer-list">{selected.map((id, index) => { const product = catalogue.find((item) => item.id === id)!; return <li key={id}><span>{index + 1}. {product.name}</span><div><button type="button" onClick={() => move(id,-1)} disabled={index === 0} aria-label={`Move ${product.name} earlier`}>↑</button><button type="button" onClick={() => move(id,1)} disabled={index === selected.length-1} aria-label={`Move ${product.name} later`}>↓</button><button type="button" onClick={() => toggle(id)} aria-label={`Remove ${product.name}`}>Remove</button></div></li>; })}</ol>}
        <button className="button button-dark" type="button" disabled={selected.length < 2 || status === "loading"} onClick={() => void ask()}>Ask whether this works</button>
      </div>}
      <aside className="starter-prompts"><p className="eyebrow">Starting points</p>{settings.featuredPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setFollowUp(prompt); void ask(prompt); }}>{prompt}</button>)}</aside>
    </div>
    {status === "loading" && <div className="ai-loading" role="status"><i />Considering the approved catalogue…</div>}
    {status === "error" && <div className="experience-error" role="alert"><p>{message}</p><button type="button" onClick={() => void ask()}>Try again</button></div>}
    {recommendation && <article className="layer-recommendation">
      <p className="eyebrow">{recommendation.source === "ai" ? "AI-grounded recommendation" : "Grounded house recommendation"}</p><h2>{recommendation.combinationName}</h2>
      <div className="recommended-products">{recommendedProducts.map((product) => <Link key={product.id} href={`/product/${product.slug}`}><span>{product.number}</span><strong>{product.name}</strong><small>{product.character.slice(0,3).join(" · ")}</small></Link>)}</div>
      <div className="recommendation-grid"><section><h3>Why it may work</h3><p>{recommendation.why}</p></section><section><h3>Application order</h3><ol>{recommendation.applicationOrder.map((step) => <li key={step.productId}>{step.guidance}</li>)}</ol></section><section><h3>Balance & placement</h3><p>{recommendation.balance}</p><p>{recommendation.placement}</p></section><section><h3>Expected character</h3><p>{recommendation.expectedCharacter}</p><dl><div><dt>Strength</dt><dd>{recommendation.strength}</dd></div><div><dt>Occasion</dt><dd>{recommendation.occasion}</dd></div><div><dt>Time / season</dt><dd>{recommendation.timing}</dd></div></dl></section><section><h3>Lighter alternative</h3><p>{recommendation.lighterAlternative}</p></section><section><h3>Richer alternative</h3><p>{recommendation.richerAlternative}</p></section></div>
      <p className="safety-notice">{settings.safetyNotice}</p>
      <div className="follow-up-actions"><button onClick={() => void ask("Make this combination lighter.")} type="button">Make lighter</button><button onClick={() => void ask("Make this combination richer.")} type="button">Make richer</button><button onClick={() => void ask("Suggest an alternative using available products.")} type="button">Suggest alternative</button></div>
      <form className="follow-up-form" onSubmit={(event) => { event.preventDefault(); void ask(); }}><label>Ask a follow-up<input value={followUp} maxLength={240} onChange={(event) => setFollowUp(event.target.value)} placeholder="Which fragrance should I apply first?" /></label><button className="button button-outline" disabled={!followUp.trim() || status === "loading"}>Ask</button></form>
      <div className="button-row"><button className="button button-outline" type="button" onClick={share}>Share</button><button className="button button-outline" type="button" onClick={save}>Save to My Rehmat</button><button className="text-button" type="button" onClick={restart}>Restart consultation</button></div><p className="form-message" aria-live="polite">{message}</p>
      <WhatsAppOrder compact products={whatsappProducts} settings={{ enabled: settings.whatsappEnabled, number: settings.whatsappNumber, defaultMessage: settings.whatsappDefaultMessage, notice: settings.whatsappNotice }} />
    </article>}
  </section>;
}
