"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addCartLine, cartCount, cartSubtotal, formatMoney, parseStoredCart, updateCartQuantity, type CartLine, type CartLineInput } from "../../lib/cart";

const STORAGE_KEY = "rehmat-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  add: (line: CartLineInput) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  show: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const storedLines = parseStoredCart(window.localStorage.getItem(STORAGE_KEY));
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLines(storedLines);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  const add = useCallback((line: CartLineInput) => {
    setLines((current) => addCartLine(current, line));
    setAnnouncement(`${line.productName}, ${line.sizeMl} ml added to cart.`);
    setOpen(true);
  }, []);
  const update = useCallback((variantId: string, quantity: number) => {
    setLines((current) => updateCartQuantity(current, variantId, quantity));
    setAnnouncement("Cart quantity updated.");
  }, []);
  const remove = useCallback((variantId: string) => {
    setLines((current) => current.filter((line) => line.variantId !== variantId));
    setAnnouncement("Item removed from cart.");
  }, []);
  const clear = useCallback(() => {
    setLines([]);
    setAnnouncement("Payment verified. Cart cleared.");
  }, []);
  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({
    lines,
    count: cartCount(lines),
    subtotal: cartSubtotal(lines),
    open,
    add,
    update,
    remove,
    clear,
    show,
    close,
  }), [add, clear, close, lines, open, remove, show, update]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

function CartDrawer() {
  const { lines, subtotal, open, close, update, remove } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [close, open]);

  return (
    <div className={open ? "cart-layer is-open" : "cart-layer"} aria-hidden={!open}>
      <button className="cart-scrim" type="button" aria-label="Close cart" onClick={close} tabIndex={open ? 0 : -1} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <header>
          <div><p className="eyebrow">Your selection</p><h2 id="cart-drawer-title">Cart</h2></div>
          <button ref={closeRef} className="cart-close" type="button" onClick={close} aria-label="Close cart">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </header>
        <div className="cart-drawer-body">
          {lines.length ? lines.map((line) => (
            <article className="cart-line" key={line.variantId}>
              <Image src={line.image} alt="" width={92} height={112} unoptimized />
              <div>
                <h3><Link href={`/product/${line.productSlug}`} onClick={close}>{line.productName}</Link></h3>
                <p>{line.sizeMl} ml · {line.sku}</p>
                <strong>{formatMoney(line.unitPricePaise, line.currency)}</strong>
                <div className="cart-line-actions">
                  <div className="quantity-stepper" aria-label={`Quantity for ${line.productName}`}>
                    <button type="button" onClick={() => update(line.variantId, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button type="button" onClick={() => update(line.variantId, line.quantity + 1)} disabled={line.quantity >= line.maxQuantity} aria-label="Increase quantity">+</button>
                  </div>
                  <button className="remove-line" type="button" onClick={() => remove(line.variantId)}>Remove</button>
                </div>
              </div>
            </article>
          )) : <div className="cart-empty"><div className="empty-drop" aria-hidden="true" /><h3>Your cart is quiet.</h3><p>Explore the collection and choose an available oil.</p></div>}
        </div>
        {lines.length > 0 && <footer><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Shipping and discounts are calculated at secure checkout.</p><Link className="button button-dark" href="/cart" onClick={close}>Review cart</Link></footer>}
      </aside>
    </div>
  );
}
