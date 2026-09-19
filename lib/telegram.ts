import "server-only";

type TelegramResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "request_failed" };

async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ORDER_CHAT_ID?.trim();
  if (!token || !chatId) return { sent: false, reason: "not_configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? { sent: true } : { sent: false, reason: "request_failed" };
  } catch {
    return { sent: false, reason: "request_failed" };
  }
}

export async function sendTelegramOrderAlert(order: {
  orderNumber: string | null;
  totalPaise: number;
  currency: string;
}) {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: order.currency,
  }).format(order.totalPaise / 100);

  return sendTelegramMessage(
    [`New paid order`, `Order: ${order.orderNumber ?? "Reference pending"}`, `Total: ${amount}`, "Payment: captured"].join("\n"),
  );
}

export function sendTelegramReadinessMessage() {
  return sendTelegramMessage("Rehmat Panjab order alerts are connected.");
}
