"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "../../lib/cart";

export type WhatsAppOrderProduct = {
  name: string;
  slug: string;
  variants: Array<{ sizeMl: number; pricePaise: number | null; currency?: "INR" }>;
};
export type WhatsAppOrderSettings = { enabled: boolean; number: string; defaultMessage: string; notice: string };

export function WhatsAppOrder({ products, settings, compact = false }: { products: WhatsAppOrderProduct[]; settings: WhatsAppOrderSettings; compact?: boolean }) {
  const available = useMemo(() => products.map((product) => ({ ...product, variants: product.variants.filter((variant) => variant.pricePaise !== null) })).filter((product) => product.variants.length), [products]);
  const [sizes, setSizes] = useState<Record<string, number>>(() => Object.fromEntries(available.map((product) => [product.slug, product.variants[0]?.sizeMl ?? 6])));
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(available.map((product) => [product.slug, 1])));
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  if (!settings.enabled || !available.length) return null;

  function requestOrder() {
    if (pin && !/^\d{6}$/.test(pin)) { setMessage("Enter a six-digit delivery PIN code or leave it blank."); return; }
    const lines = available.flatMap((product) => {
      const size = sizes[product.slug]; const variant = product.variants.find((item) => item.sizeMl === size) ?? product.variants[0];
      const quantity = Math.max(1, Math.min(10, quantities[product.slug] ?? 1)); const subtotal = (variant.pricePaise ?? 0) * quantity;
      return [`Product: ${product.name}`, `Size: ${variant.sizeMl} ml`, `Quantity: ${quantity}`, `Unit price: ${formatMoney(variant.pricePaise ?? 0, "INR")}`, `Subtotal: ${formatMoney(subtotal, "INR")}`];
    });
    const text = ["Hello Rehmat Panjab, I would like to request an order:", "", ...lines, name.trim() ? `Customer name: ${name.trim().slice(0, 80)}` : "", pin ? `Delivery PIN code: ${pin}` : "", "", settings.defaultMessage].filter(Boolean).join("\n");
    let number = settings.number.replace(/\D/g, "").slice(0, 15); if (number.length === 10) number = `91${number}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setMessage("WhatsApp opened with an editable request. Stock, delivery and payment are still unconfirmed.");
  }

  return <section className={compact ? "whatsapp-order is-compact" : "whatsapp-order"} aria-labelledby={`whatsapp-${available.map((item) => item.slug).join("-")}`}>
    <div><p className="eyebrow">Manual order request</p><h3 id={`whatsapp-${available.map((item) => item.slug).join("-")}`}>Order on WhatsApp</h3><p>{settings.notice}</p></div>
    <div className="whatsapp-items">{available.map((product) => <fieldset key={product.slug}><legend>{product.name}</legend><label>Bottle size<select value={sizes[product.slug]} onChange={(event) => setSizes((current) => ({ ...current, [product.slug]: Number(event.target.value) }))}>{product.variants.map((variant) => <option key={variant.sizeMl} value={variant.sizeMl}>{variant.sizeMl} ml · {formatMoney(variant.pricePaise ?? 0, "INR")}</option>)}</select></label><label>Quantity<input type="number" min={1} max={10} value={quantities[product.slug]} onChange={(event) => setQuantities((current) => ({ ...current, [product.slug]: Math.max(1, Math.min(10, Number(event.target.value) || 1)) }))} /></label></fieldset>)}</div>
    <div className="whatsapp-customer"><label>Name <span>optional</span><input value={name} maxLength={80} autoComplete="name" onChange={(event) => setName(event.target.value)} /></label><label>Delivery PIN <span>optional</span><input value={pin} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} /></label></div>
    <button className="button button-dark whatsapp-button" type="button" onClick={requestOrder}>Open order request</button>
    <p className="form-message" aria-live="polite">{message}</p>
  </section>;
}

