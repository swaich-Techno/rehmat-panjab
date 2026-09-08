"use client";

import { FormEvent, useState } from "react";

type ProductDraft = {
  id: string; product_number: string; name: string; slug: string; status: string;
  subtitle?: string | null; card_line?: string | null; micro_description?: string | null; short_description?: string | null; description?: string | null;
  scent_family?: string | null; scent_profile?: Record<string, unknown> | null;
  suitability?: "unisex" | "men" | "women" | null; suitability_note?: string | null; positioning?: string | null;
  image_path?: string | null; campaign_image_path?: string | null; featured?: boolean;
  image_alt_text?: string | null; image_display_order?: number | null;
  seo_title?: string | null; seo_description?: string | null; og_image_path?: string | null;
  occasions?: string[] | null; reviews_enabled?: boolean;
};

export function AdminProductForm({ initial }: { initial?: ProductDraft }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const character = Array.isArray(initial?.scent_profile?.character) ? initial.scent_profile.character.filter((value): value is string => typeof value === "string").join(", ") : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), id: initial?.id, featured: form.get("featured") === "on", reviewsEnabled: form.get("reviewsEnabled") === "on", character: String(form.get("character") ?? "").split(",").map((value) => value.trim()).filter(Boolean), suitableFor: String(form.get("suitableFor") ?? "").split(",").map((value) => value.trim()).filter(Boolean) };
    try {
      const response = await fetch("/api/admin/products", { method: initial ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message);
      setState("success"); setMessage(initial ? "Product updated." : "Draft saved.");
      if (!initial) event.currentTarget.reset();
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "We couldn’t save that yet."); }
  }

  return <form className="admin-form" onSubmit={submit}>
    <div><label htmlFor="product-number">Product number</label><input id="product-number" name="productNumber" maxLength={3} required defaultValue={initial?.product_number} /></div>
    <div><label htmlFor="product-name">Name</label><input id="product-name" name="name" required defaultValue={initial?.name} /></div>
    <div><label htmlFor="product-slug">Slug</label><input id="product-slug" name="slug" pattern="[a-z0-9-]+" required defaultValue={initial?.slug} /></div>
    <div><label htmlFor="product-status">Status</label><select id="product-status" name="status" defaultValue={initial?.status ?? "draft"}><option value="draft">Draft</option><option value="coming_soon">Coming soon</option><option value="active">Active</option><option value="sold_out">Sold out</option><option value="archived">Archived</option></select></div>
    <div className="full"><label htmlFor="product-subtitle">Subtitle</label><input id="product-subtitle" name="subtitle" defaultValue={initial?.subtitle ?? ""} /></div>
    <div className="full"><label htmlFor="product-card-line">Card line</label><input id="product-card-line" name="cardLine" defaultValue={initial?.card_line ?? ""} /></div>
    <div className="full"><label htmlFor="product-micro-description">Micro description</label><textarea id="product-micro-description" name="microDescription" rows={2} defaultValue={initial?.micro_description ?? ""} /></div>
    <div className="full"><label htmlFor="product-short-description">Short description</label><textarea id="product-short-description" name="shortDescription" rows={3} defaultValue={initial?.short_description ?? ""} /></div>
    <div className="full"><label htmlFor="product-description">Full description</label><textarea id="product-description" name="description" rows={6} defaultValue={initial?.description ?? ""} /></div>
    <div><label htmlFor="product-family">Fragrance family</label><input id="product-family" name="scentFamily" defaultValue={initial?.scent_family ?? ""} /></div>
    <div><label htmlFor="product-character">Character tags</label><input id="product-character" name="character" defaultValue={character} placeholder="Soft, warm, intimate" /></div>
    <div><label htmlFor="product-suitability">Suitability</label><select id="product-suitability" name="suitability" defaultValue={initial?.suitability ?? "unisex"}><option value="unisex">Unisex</option><option value="men">For Men</option><option value="women">For Women</option></select></div>
    <div><label htmlFor="product-suitability-note">Suitability note</label><input id="product-suitability-note" name="suitabilityNote" defaultValue={initial?.suitability_note ?? ""} placeholder="Optional nuance" /></div>
    <div className="full"><label htmlFor="product-positioning">Positioning</label><input id="product-positioning" name="positioning" defaultValue={initial?.positioning ?? ""} placeholder="Evening / statement attar" /></div>
    <div className="full"><label htmlFor="product-suitable">Suitable for</label><input id="product-suitable" name="suitableFor" defaultValue={(initial?.occasions ?? []).join(", ")} placeholder="Everyday wear, gifting" /></div>
    <div><label htmlFor="product-image">Primary product image path</label><input id="product-image" name="imagePath" aria-describedby="product-image-hint" defaultValue={initial?.image_path ?? ""} /><p className="field-hint" id="product-image-hint">Use a genuine owner-supplied product photograph or the honest placeholder.</p></div>
    <div><label htmlFor="campaign-image">Editorial campaign artwork path</label><input id="campaign-image" name="campaignImagePath" aria-describedby="campaign-image-hint" defaultValue={initial?.campaign_image_path ?? ""} /><p className="field-hint" id="campaign-image-hint">Optional mood artwork. It is never used as the primary commerce image.</p></div>
    <div><label htmlFor="product-image-alt">Image alt text</label><input id="product-image-alt" name="imageAltText" defaultValue={initial?.image_alt_text ?? ""} placeholder="Describe the genuine product image" /></div>
    <div><label htmlFor="product-image-order">Image display order</label><input id="product-image-order" name="imageDisplayOrder" type="number" min="0" max="999" defaultValue={initial?.image_display_order ?? 0} /></div>
    <label className="admin-check"><input name="featured" type="checkbox" defaultChecked={initial?.featured ?? false} /><span>Featured product</span></label>
    <label className="admin-check"><input name="reviewsEnabled" type="checkbox" defaultChecked={initial?.reviews_enabled ?? true} /><span>Accept public reviews</span></label>
    <div className="full"><label htmlFor="seo-title">SEO title</label><input id="seo-title" name="seoTitle" defaultValue={initial?.seo_title ?? ""} /></div>
    <div className="full"><label htmlFor="seo-description">Meta description</label><textarea id="seo-description" name="seoDescription" rows={3} defaultValue={initial?.seo_description ?? ""} /></div>
    <div className="full"><label htmlFor="og-image">Social image path</label><input id="og-image" name="ogImagePath" defaultValue={initial?.og_image_path ?? ""} /></div>
    <p className={`form-message ${state}`} aria-live="polite">{message}</p>
    <button className="button button-dark" type="submit" disabled={state === "loading"}>{state === "loading" ? "Saving…" : initial ? "Update product" : "Save draft"}</button>
  </form>;
}
