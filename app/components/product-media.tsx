import Image from "next/image";
import type { Product } from "../../lib/products";

export function ProductMedia({ product, priority = false, className = "" }: { product: Product; priority?: boolean; className?: string }) {
  return (
    <div className={`product-media scent-${product.id} ${className}`} data-scent={product.id}>
      <div className="media-haze" />
      <Image
        src={product.image}
        alt={`${product.name} perfume oil bottle in its campaign setting`}
        fill
        priority={priority}
        unoptimized
        sizes="(max-width: 767px) 92vw, (max-width: 1200px) 48vw, 42vw"
      />
      <span className="media-index">{product.number}</span>
    </div>
  );
}
