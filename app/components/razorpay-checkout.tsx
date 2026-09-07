"use client";

import Script from "next/script";
import { useState } from "react";
import { useCart } from "./cart-provider";

type CheckoutLine = { variantId: string; quantity: number };
type PaymentResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type CheckoutState = "idle" | "creating" | "verifying" | "success" | "cancelled" | "error";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: PaymentResponse) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function readResponse(response: Response) {
  return response.json().catch(() => ({ message: "The payment service returned an unreadable response." })) as Promise<Record<string, unknown>>;
}

export function RazorpayCheckout({ lines }: { lines: CheckoutLine[] }) {
  const { clear } = useCart();
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("Your total will be rechecked securely before the payment window opens.");

  async function beginCheckout() {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const RazorpayConstructor = window.Razorpay;
    if (!key || !RazorpayConstructor) {
      setState("error");
      setMessage("Secure checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setState("creating");
    setMessage("Checking price and availability…");
    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const order = await readResponse(orderResponse);
      if (!orderResponse.ok) throw new Error(typeof order.message === "string" ? order.message : "Checkout could not start.");
      if (typeof order.order_id !== "string" || typeof order.order_token !== "string" || typeof order.amount !== "number" || typeof order.currency !== "string") {
        throw new Error("Checkout received an incomplete order.");
      }

      let paymentStarted = false;
      let paymentFailed = false;
      const checkout = new RazorpayConstructor({
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Rehmat Panjab",
        description: "Perfume oil order",
        order_id: order.order_id,
        theme: { color: "#173d32" },
        handler: async (payment) => {
          paymentStarted = true;
          setState("verifying");
          setMessage("Payment received. Verifying its signature…");
          try {
            const verificationResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payment, order_token: order.order_token }),
            });
            const verification = await readResponse(verificationResponse);
            if (!verificationResponse.ok || verification.success !== true) {
              throw new Error(typeof verification.message === "string" ? verification.message : "Payment could not be verified.");
            }
            clear();
            setState("success");
            setMessage("Payment verified. Thank you—your order is confirmed.");
          } catch (error) {
            setState("error");
            setMessage(error instanceof Error ? error.message : "Payment could not be verified. Please contact support before retrying.");
          }
        },
        modal: {
          ondismiss: () => {
            if (paymentStarted || paymentFailed) return;
            setState("cancelled");
            setMessage("Payment was cancelled. Your cart has been kept so you can try again.");
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        paymentFailed = true;
        setState("error");
        setMessage(response.error?.description || "Payment failed. Check the details in the payment window and try again.");
      });
      setState("idle");
      setMessage("Complete payment in the secure Razorpay window.");
      checkout.open();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Checkout could not start. Please try again.");
    }
  }

  const busy = state === "creating" || state === "verifying";
  return (
    <div className={`razorpay-checkout state-${state}`}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onError={() => { setState("error"); setMessage("Secure checkout could not load. Check your connection and try again."); }} />
      <button className="button button-dark" type="button" onClick={beginCheckout} disabled={busy || !lines.length}>
        {state === "creating" ? "Preparing secure checkout…" : state === "verifying" ? "Verifying payment…" : "Pay securely with Razorpay"}
      </button>
      <p className="checkout-status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
  );
}
