import Image from "next/image";

type ProductMediaItem = { id: string; name: string; number: string; image: string; imageAlt?: string };

export function ProductMedia({ product, priority = false, className = "" }: { product: ProductMediaItem; priority?: boolean; className?: string }) {
  return (
    <div className={`product-media scent-${product.id} ${className}`} data-scent={product.id} data-image-pending={product.image.includes("product-image-pending") || undefined}>
      <div className="media-haze" />
      <Image
        src={product.image}
        alt={product.imageAlt ?? `${product.name} perfume oil bottle in its campaign setting`}
        fill
        priority={priority}
        sizes="(max-width: 767px) 92vw, (max-width: 1200px) 48vw, 42vw"
      />
      {product.image.includes("product-image-pending") && <span className="media-pending-label">Genuine product image pending</span>}
      <span className="media-index">{product.number}</span>
    </div>
  );
}
