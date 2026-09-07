"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type VariantDraft = { id: string; size_ml: number; sku: string; price_paise: number | null; enabled: boolean; quantity: number; reserved: number; low_stock_threshold: number };

export function AdminVariantManager({ productId, variants }: { productId: string; variants: VariantDraft[] }) {
  return <section className="admin-variants"><div className="admin-section-heading"><div><p className="eyebrow">Purchasable formats</p><h2>Variants and inventory.</h2></div><p>Only enabled variants with a real price and available stock can be added to cart.</p></div>{variants.map((variant) => <VariantForm productId={productId} initial={variant} key={variant.id} />)}<VariantForm productId={productId} /></section>;
}

function VariantForm({ productId, initial }: { productId: string; initial?: VariantDraft }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading"); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { id: initial?.id, productId, sizeMl: form.get("sizeMl"), sku: form.get("sku"), priceRupees: form.get("priceRupees"), quantity: form.get("quantity"), lowStockThreshold: form.get("lowStockThreshold"), enabled: form.get("enabled") === "on" };
    try {
      const response = await fetch("/api/admin/variants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message);
      setState("success"); setMessage(result.message ?? "Variant saved.");
      if (!initial) event.currentTarget.reset();
      router.refresh();
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "The variant could not be saved."); }
  }
  return <form className="variant-form" onSubmit={submit}><div><label htmlFor={`size-${initial?.id ?? "new"}`}>Bottle size (ml)</label><input id={`size-${initial?.id ?? "new"}`} name="sizeMl" type="number" min="0.01" step="0.01" required defaultValue={initial?.size_ml} /></div><div><label htmlFor={`sku-${initial?.id ?? "new"}`}>Variant SKU</label><input id={`sku-${initial?.id ?? "new"}`} name="sku" pattern="[A-Za-z0-9._-]+" required defaultValue={initial?.sku} /></div><div><label htmlFor={`price-${initial?.id ?? "new"}`}>Regular price (₹)</label><input id={`price-${initial?.id ?? "new"}`} name="priceRupees" type="number" min="0" step="0.01" defaultValue={initial?.price_paise === null ? "" : (initial?.price_paise ?? 0) / 100} /></div><div><label htmlFor={`quantity-${initial?.id ?? "new"}`}>Inventory quantity</label><input id={`quantity-${initial?.id ?? "new"}`} name="quantity" type="number" min={initial?.reserved ?? 0} step="1" required defaultValue={initial?.quantity ?? 0} /></div><div><label htmlFor={`threshold-${initial?.id ?? "new"}`}>Low-stock threshold</label><input id={`threshold-${initial?.id ?? "new"}`} name="lowStockThreshold" type="number" min="0" step="1" required defaultValue={initial?.low_stock_threshold ?? 2} /></div><label className="variant-enabled"><input name="enabled" type="checkbox" defaultChecked={initial?.enabled ?? false} /><span>Enabled for storefront</span></label><button className="button button-dark" type="submit" disabled={state === "loading"}>{state === "loading" ? "Saving…" : initial ? "Update variant" : "Add variant"}</button><p className={`form-message ${state}`} aria-live="polite">{message}</p></form>;
}
