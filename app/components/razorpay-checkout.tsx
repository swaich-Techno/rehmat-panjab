"use client";

import Script from "next/script";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-provider";
import type {CheckoutAddress} from "../../lib/address";

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
  prefill: { email: string; contact: string };
  readonly: { email: boolean; contact: boolean };
  method: { upi: boolean; card: boolean; netbanking: boolean; wallet: boolean; emi: boolean; paylater: boolean };
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

export function RazorpayCheckout({ lines, policyVersion,address }: { lines: CheckoutLine[]; policyVersion: string;address:CheckoutAddress|null }) {
  const { clear } = useCart();
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("Your total will be rechecked securely before the payment window opens.");
  const [termsAccepted,setTermsAccepted]=useState(false);
  const [returnsAccepted,setReturnsAccepted]=useState(false);
  const [marketingConsent,setMarketingConsent]=useState(false);

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
        body: JSON.stringify({ lines,deliveryAddress:address,deliveryPin:address?.delivery.pinCode,customerIdentifier:address?.delivery.email,policyAcceptance:{version:policyVersion,acceptedAt:new Date().toISOString(),marketingConsent} }),
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
        description: "Rehmat Panjab concentrated perfume oils · Operated by Harkirat Singh",
        order_id: order.order_id,
        theme: { color: "#173d32" },
        prefill: {email:address?.delivery.email??"",contact:address?.delivery.mobile??""},
        readonly: {email:true,contact:true},
        method: {upi:true,card:true,netbanking:true,wallet:true,emi:false,paylater:false},
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
            window.location.assign("/payment/success");
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
            window.location.assign("/payment/cancelled");
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        paymentFailed = true;
        setState("error");
        setMessage(response.error?.description || "Payment failed. Check the details in the payment window and try again.");
        window.location.assign("/payment/failed");
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
      <div className="checkout-acceptance"><label><input type="checkbox" checked={termsAccepted} onChange={event=>setTermsAccepted(event.target.checked)}/> I accept the <Link href="/policies/terms">Terms and Conditions</Link>.</label><label><input type="checkbox" checked={returnsAccepted} onChange={event=>setReturnsAccepted(event.target.checked)}/> I acknowledge the <Link href="/policies/returns">Cancellation, Return and Refund Policy</Link>.</label><label><input type="checkbox" checked={marketingConsent} onChange={event=>setMarketingConsent(event.target.checked)}/> Send me optional product news and offers.</label></div>
      <button className="button button-dark" type="button" onClick={beginCheckout} disabled={busy || !lines.length || !address || !termsAccepted || !returnsAccepted}>
        {state === "creating" ? "Preparing secure checkout…" : state === "verifying" ? "Verifying payment…" : "Pay securely with Razorpay"}
      </button>
      <p className="checkout-status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
  );
}
