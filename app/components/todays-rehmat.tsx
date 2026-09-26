import Link from "next/link";
import { firstPrice, type StorefrontProduct } from "../../lib/catalog";
import { formatMoney } from "../../lib/cart";
import { todaysRehmat } from "../../lib/daily-rehmat";
import { InteractiveProductMedia } from "./interactive-product-media";
import { OpenGuideButton } from "./open-guide-button";
import { ProductAddButton } from "./product-add-button";

export function TodaysRehmat({ products }: { products: StorefrontProduct[] }) {
  const edit=todaysRehmat(products);
  if (!edit.products.length) return null;
  return <section className="todays-rehmat" aria-labelledby="todays-rehmat-heading">
    <div className="todays-rehmat-heading"><div><p className="eyebrow">Today’s Rehmat · India</p><h2 id="todays-rehmat-heading">{edit.headline}</h2></div><p>{edit.description}</p></div>
    <div className="todays-rehmat-grid">{edit.products.map((product,index)=><article key={product.id}>
      <InteractiveProductMedia product={product} priority={index===0}/>
      <div><p className="eyebrow">{index===0?"Today’s choice":"Also considered"}</p><h3>{product.name}</h3><p>{index===0?edit.description:`A complementary ${product.character[0]?.toLowerCase()??"balanced"} option from today’s live collection.`}</p><strong>{firstPrice(product)===null?"Price on request":`From ${formatMoney(firstPrice(product)!)}`}</strong><span>{product.enabledSizes.join(" / ")} ml</span><div className="button-row"><Link className="button button-outline" href={`/product/${product.slug}`}>View details</Link><ProductAddButton product={product}/></div></div>
    </article>)}</div>
    <div className="todays-rehmat-guide"><span>Want a choice shaped around your mood, climate or occasion?</span><OpenGuideButton className="text-link"/></div>
  </section>;
}
