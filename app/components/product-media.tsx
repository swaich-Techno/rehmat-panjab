import Image from "next/image";

type ProductMediaItem = { id: string; name: string; number: string; image: string; heroImage?: string; imageAlt?: string; imageKind?: "product" | "campaign" | "placeholder"; notes?:{top:string[];heart:string[];base:string[]}|null; notesVerified?:boolean };

export function ProductMedia({ product, priority = false, className = "" }: { product: ProductMediaItem; priority?: boolean; className?: string; role?: "card" | "hero" }) {
  const notesConfirmed=Boolean(product.notesVerified&&product.notes?.top[0]&&product.notes?.heart[0]&&product.notes?.base[0]);
  const source=notesConfirmed?"/images/bottles/rose-gold-bottle-oil.webp":"/images/bottles/rose-gold-bottle-reference.jpeg";
  return (
    <div className={`product-media scent-${product.id} ${className}`} data-scent={product.id} data-image-pending={source.includes("product-image-pending") || undefined} data-media-kind={product.imageKind}>
      <div className="media-haze" />
      <Image
        src={source}
        alt={`${product.name} perfume oil by Rehmat Panjab`}
        fill
        priority={priority}
        sizes="(max-width: 767px) 92vw, (max-width: 1200px) 48vw, 42vw"
      />
      <span className="product-bottle-label" aria-hidden="true">{product.name}</span>
    </div>
  );
}
