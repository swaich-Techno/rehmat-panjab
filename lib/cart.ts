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
  kind?: "product" | "tester-pack";
  testerPack?: {
    packSize: 2 | 3 | 5;
    discountPercent: number;
    selected: Array<{ variantId: string; productId: string; productSlug: string; productName: string; sku: string }>;
  };
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

export function mergeCartLines(authoritative: CartLine[], guest: CartLine[]) {
  const merged = authoritative.map((line) => ({ ...line }));
  for (const candidate of guest) {
    const index = merged.findIndex((line) => line.variantId === candidate.variantId);
    if (index < 0) { merged.push(candidate); continue; }
    const current = merged[index];
    merged[index] = { ...current, quantity: Math.min(current.maxQuantity, current.quantity + candidate.quantity) };
  }
  return merged;
}

export function formatMoney(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(paise / 100);
}

export function roundPaiseToWholeRupee(paise: number) {
  return Math.round(paise / 100) * 100;
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
      && (line.kind !== "tester-pack" || (
        line.testerPack
        && [2, 3, 5].includes(line.testerPack.packSize)
        && Array.isArray(line.testerPack.selected)
        && line.testerPack.selected.length === line.testerPack.packSize
        && new Set(line.testerPack.selected.map((item: { productId?: unknown }) => item.productId)).size === line.testerPack.packSize
      ))
    ));
  } catch {
    return [];
  }
}
