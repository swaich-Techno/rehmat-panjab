"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../components/cart-provider";
import { formatMoney } from "../../lib/cart";
import { RazorpayCheckout } from "../components/razorpay-checkout";
import { addressPreview, deliveryAddressSchema, emptyDeliveryAddress, type DeliveryAddress } from "../../lib/address";
import { DeliveryAddressFields } from "../components/delivery-address-fields";

export function CartPageContent({ policyVersion, checkoutEnabled }: { policyVersion: string; checkoutEnabled: boolean }) {
  const { lines, subtotal, update, remove } = useCart();
  const [delivery, setDelivery] = useState<DeliveryAddress>(emptyDeliveryAddress);
  const [billing, setBilling] = useState<DeliveryAddress>(emptyDeliveryAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");

  function review() {
    const deliveryResult = deliveryAddressSchema.safeParse(delivery);
    const billingResult = billingSame ? null : deliveryAddressSchema.safeParse(billing);
    if (!deliveryResult.success) { setAddressMessage(deliveryResult.error.issues[0]?.message ?? "Check the delivery address."); return; }
    if (billingResult && !billingResult.success) { setAddressMessage(billingResult.error.issues[0]?.message ?? "Check the billing address."); return; }
    setDelivery(deliveryResult.data);
    if (billingResult?.success) setBilling(billingResult.data);
    setReviewed(true);
    setAddressMessage("Address reviewed. You can still correct it before checkout.");
  }

  const checkoutLines = lines.filter((line) => !line.testerPack).map(({ variantId, quantity }) => ({ variantId, quantity }));
  const testerPacks = lines.filter((line) => line.testerPack).map((line) => ({
    packSize: line.testerPack!.packSize,
    variantIds: line.testerPack!.selected.map((item) => item.variantId),
    quantity: line.quantity,
  }));

  return (
    <main id="main-content" className="cart-page">
      <header><p className="eyebrow">Your selection</p><h1>Cart.</h1><p>Stock limits are applied to every quantity change.</p></header>
      {!lines.length ? (
        <section className="cart-page-empty"><div className="empty-drop" aria-hidden="true" /><h2>Your cart is quiet.</h2><p>Available oils will appear here when you add them.</p><Link className="button button-dark" href="/collection">View the collection</Link></section>
      ) : (
        <div className="cart-page-grid">
          <section aria-label="Cart items">
            {lines.map((line) => <article className="cart-page-line" key={line.variantId}>
              <Image src={line.image} alt="" width={140} height={170} unoptimized />
              <div>
                <p className="eyebrow">{line.sku}</p>
                <h2>{line.testerPack ? line.productName : <Link href={`/product/${line.productSlug}`}>{line.productName}</Link>}</h2>
                <p>{line.testerPack ? `${line.testerPack.packSize} × 3 ml: ${line.testerPack.selected.map((item) => item.productName).join(", ")}` : `${line.sizeMl} ml`}</p>
                <strong>{formatMoney(line.unitPricePaise)}</strong>
              </div>
              <div className="cart-page-line-controls">
                <div className="quantity-stepper" aria-label={`Quantity for ${line.productName}`}>
                  <button type="button" onClick={() => update(line.variantId, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => update(line.variantId, line.quantity + 1)} disabled={line.quantity >= line.maxQuantity} aria-label="Increase quantity">+</button>
                </div>
                <button className="remove-line" type="button" onClick={() => remove(line.variantId)}>Remove</button>
              </div>
            </article>)}
          </section>
          <aside className="cart-summary">
            <p className="eyebrow">Order summary</p>
            <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
            <p>Tester-pack savings and code NEW never stack. If NEW is eligible, the server applies whichever gives the greater saving. Shipping is never discounted.</p>
            <p>Prices and stock are rechecked securely before payment. Any delivery charge will be shown before you confirm.</p>
            <DeliveryAddressFields value={delivery} onChange={(value) => { setDelivery(value); setReviewed(false); }} />
            <label className="billing-toggle"><input type="checkbox" checked={billingSame} onChange={(event) => { setBillingSame(event.target.checked); setReviewed(false); }} /> Billing address is the same as delivery</label>
            {!billingSame && <DeliveryAddressFields legend="Billing address" value={billing} onChange={(value) => { setBilling(value); setReviewed(false); }} />}
            <button className="button button-outline" type="button" onClick={review}>Review address</button>
            {reviewed && <section className="address-preview"><h3>Address preview</h3><pre>{addressPreview(delivery)}</pre><button type="button" className="text-link" onClick={() => setReviewed(false)}>Correct address</button></section>}
            <p role="status">{addressMessage}</p>
            <p className="purchase-policy-links"><Link href="/policies/shipping">Shipping</Link> · <Link href="/policies/returns">Cancellation &amp; refunds</Link> · <Link href="/policies/terms">Terms</Link> · <Link href="/policies/privacy">Privacy</Link></p>
            {checkoutEnabled ? <RazorpayCheckout policyVersion={policyVersion} lines={checkoutLines} testerPacks={testerPacks} address={reviewed ? { delivery, billingSameAsDelivery: billingSame, billing: billingSame ? undefined : billing } : null} /> : <p className="purchase-unavailable">Online payment remains unavailable. Send an order request on WhatsApp for manual confirmation.</p>}
            <small>Checkout remains unavailable until payment verification is complete. A WhatsApp message is an order request, not a confirmed order, until availability, shipping and payment are verified.</small>
          </aside>
        </div>
      )}
    </main>
  );
}
