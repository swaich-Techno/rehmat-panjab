import Image from "next/image";

type ProductMediaItem = { id: string; name: string; number: string; image: string; heroImage?: string; imageAlt?: string; imageKind?: "product" | "campaign" | "placeholder" };

export function ProductMedia({ product, priority = false, className = "", role = "card" }: { product: ProductMediaItem; priority?: boolean; className?: string; role?: "card" | "hero" }) {
  const source = role === "hero" ? product.heroImage ?? product.image : product.image;
  return (
    <div className={`product-media scent-${product.id} ${className}`} data-scent={product.id} data-image-pending={source.includes("product-image-pending") || undefined} data-media-kind={product.imageKind}>
      <div className="media-haze" />
      <Image
        src={source}
        alt={product.imageAlt ?? `${product.name} perfume oil by Rehmat Panjab`}
        fill
        priority={priority}
        sizes="(max-width: 767px) 92vw, (max-width: 1200px) 48vw, 42vw"
      />
      {product.imageKind === "campaign" && <span className="media-disclosure">Campaign artwork</span>}
      <span className="media-index">{product.number}</span>
    </div>
  );
}
