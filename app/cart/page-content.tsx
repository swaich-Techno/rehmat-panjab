"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../components/cart-provider";
import { formatMoney } from "../../lib/cart";
import { RazorpayCheckout } from "../components/razorpay-checkout";

export function CartPageContent() {
  const { lines, subtotal, update, remove } = useCart();
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
              <div><p className="eyebrow">{line.sku}</p><h2><Link href={`/product/${line.productSlug}`}>{line.productName}</Link></h2><p>{line.sizeMl} ml</p><strong>{formatMoney(line.unitPricePaise)}</strong></div>
              <div className="cart-page-line-controls"><div className="quantity-stepper" aria-label={`Quantity for ${line.productName}`}><button type="button" onClick={() => update(line.variantId, line.quantity - 1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button type="button" onClick={() => update(line.variantId, line.quantity + 1)} disabled={line.quantity >= line.maxQuantity} aria-label="Increase quantity">+</button></div><button className="remove-line" type="button" onClick={() => remove(line.variantId)}>Remove</button></div>
            </article>)}
          </section>
          <aside className="cart-summary"><p className="eyebrow">Order summary</p><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Prices and stock are rechecked securely before payment. Any delivery charge will be shown before you confirm.</p><RazorpayCheckout lines={lines.map(({ variantId, quantity }) => ({ variantId, quantity }))} /><small>Payments open in Razorpay’s encrypted checkout. Your card or UPI details never pass through Rehmat Panjab.</small></aside>
        </div>
      )}
    </main>
  );
}
