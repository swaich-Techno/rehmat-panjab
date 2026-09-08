import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createRazorpayOrderToken(orderId: string, secret: string) {
  return createHmac("sha256", secret).update(`rehmat-order|${orderId}`).digest("hex");
}

export function verifyRazorpayOrderToken(orderId: string, token: string, secret: string) {
  return safeEqual(createRazorpayOrderToken(orderId, secret), token);
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyRazorpayWebhookSignature(body:string,signature:string,secret:string){
  return safeEqual(createHmac("sha256",secret).update(body).digest("hex"),signature);
}
