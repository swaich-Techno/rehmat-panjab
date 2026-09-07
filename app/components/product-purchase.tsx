"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "../../lib/cart";
import { isPurchasable, type StorefrontProduct } from "../../lib/catalog";
import { COMMERCE_ENABLED } from "../../lib/commerce";
import { useCart } from "./cart-provider";
import { WhatsAppOrder, type WhatsAppOrderSettings } from "./whatsapp-order";

export function ProductPurchase({ product, whatsappSettings }: { product: StorefrontProduct; whatsappSettings: WhatsAppOrderSettings }) {
  const cart = useCart();
  const initial = useMemo(() => product.variants.find((variant) => isPurchasable(product, variant)) ?? product.variants[0], [product]);
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selected = product.variants.find((variant) => variant.id === selectedId) ?? initial;
  const canAdd = Boolean(selected && isPurchasable(product, selected));

  if (!product.variants.length) return <p className="purchase-unavailable">Formats are being prepared. Join the private notice for release details.</p>;

  return (
    <div className="product-purchase">
      <fieldset>
        <legend>Choose bottle size</legend>
        <div className="variant-options">
          {product.variants.map((variant) => (
            <button
              type="button"
              key={variant.id}
              className={variant.id === selected?.id ? "is-selected" : ""}
              aria-pressed={variant.id === selected?.id}
              onClick={() => { setSelectedId(variant.id); setQuantity(1); }}
            >
              <span>{variant.sizeMl} ml</span>
              <small>{variant.pricePaise === null ? "Price pending" : formatMoney(variant.pricePaise, variant.currency)}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {selected && <div className="purchase-status" aria-live="polite">
        <div key={selected.id} className="purchase-price"><span>{selected.sizeMl} ml</span><strong>{selected.pricePaise === null ? "Price pending" : formatMoney(selected.pricePaise, selected.currency)}</strong></div>
        <p>{product.status === "sold_out" || selected.availableQuantity < 1 ? "Currently unavailable." : selected.availableQuantity <= selected.lowStockThreshold ? "Only a few left." : "Available."}</p>
      </div>}
      {COMMERCE_ENABLED && product.status === "active" && selected?.pricePaise !== null && <div className="purchase-actions">
        <div className="quantity-stepper" aria-label="Quantity">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => Math.min(selected.availableQuantity, value + 1))} disabled={!canAdd || quantity >= selected.availableQuantity} aria-label="Increase quantity">+</button>
        </div>
        <button
          className="button button-dark add-to-cart"
          type="button"
          disabled={!canAdd}
          data-cursor="ADD"
          onClick={() => selected && cart.add({
            variantId: selected.id,
            productSlug: product.slug,
            productName: product.name,
            sizeMl: selected.sizeMl,
            sku: selected.sku,
            unitPricePaise: selected.pricePaise ?? 0,
            currency: selected.currency,
            image: product.image,
            maxQuantity: selected.availableQuantity,
            quantity,
          })}
        >{canAdd ? "Add to cart" : "Unavailable"}</button>
      </div>}
      {!COMMERCE_ENABLED && <p className="purchase-unavailable">Online purchasing is not open yet. Prices and formats are shown for catalogue information.</p>}
      {!COMMERCE_ENABLED && <WhatsAppOrder compact products={[{name:product.name,slug:product.slug,variants:product.variants.map(({sizeMl,pricePaise,currency})=>({sizeMl,pricePaise,currency}))}]} settings={whatsappSettings} />}
    </div>
  );
}
