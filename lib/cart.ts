export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  sizeMl: number;
  sku: string;
  unitPricePaise: number;
  currency: "INR";
  image: string;
  quantity: number;
  maxQuantity: number;
};

export type CartLineInput = Omit<CartLine, "quantity"> & { quantity?: number };

const whole = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

export function addCartLine(lines: CartLine[], input: CartLineInput) {
  if (!input.variantId || input.unitPricePaise < 0 || input.maxQuantity < 1) return lines;
  const requested = Math.max(1, whole(input.quantity ?? 1));
  const existing = lines.find((line) => line.variantId === input.variantId);
  if (!existing) return [...lines, { ...input, quantity: Math.min(requested, input.maxQuantity) }];
  return lines.map((line) => line.variantId === input.variantId
    ? { ...line, ...input, quantity: Math.min(line.quantity + requested, input.maxQuantity) }
    : line);
}

export function updateCartQuantity(lines: CartLine[], variantId: string, quantity: number) {
  const next = whole(quantity);
  if (next < 1) return lines.filter((line) => line.variantId !== variantId);
  return lines.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(next, line.maxQuantity) } : line);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.unitPricePaise * line.quantity, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function formatMoney(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(paise / 100);
}

export function parseStoredCart(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => Boolean(
      line && typeof line === "object"
      && typeof line.variantId === "string"
      && typeof line.productSlug === "string"
      && typeof line.productName === "string"
      && typeof line.sku === "string"
      && typeof line.image === "string"
      && line.currency === "INR"
      && Number.isInteger(line.sizeMl) && line.sizeMl > 0
      && Number.isInteger(line.unitPricePaise) && line.unitPricePaise >= 0
      && Number.isInteger(line.quantity) && line.quantity > 0
      && Number.isInteger(line.maxQuantity) && line.maxQuantity > 0
      && line.quantity <= line.maxQuantity
    ));
  } catch {
    return [];
  }
}
