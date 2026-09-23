import {getSiteUrl} from "../../lib/site-url";
import {getStorefrontProducts} from "../../lib/storefront";

export const dynamic="force-dynamic";

const xml=(value:unknown)=>String(value??"").replace(/[<>&'\"]/g,character=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[character]!));

export async function GET(){
  const origin=getSiteUrl(),products=await getStorefrontProducts();
  const items=products.filter(product=>product.status==="active").flatMap(product=>product.variants.filter(variant=>variant.enabled&&variant.pricePaise!==null).map(variant=>{
    const link=`${origin}/product/${product.slug}`,image=product.image.startsWith("http")?product.image:`${origin}${product.image}`;
    const description=product.microDescription||product.summary||product.description.split(/\n\s*\n/)[0];
    return `<item><g:id>${xml(variant.sku)}</g:id><g:item_group_id>${xml(product.databaseId??product.slug)}</g:item_group_id><title>${xml(`${product.name} ${variant.sizeMl} ml Perfume Oil`)}</title><description>${xml(description)}</description><link>${xml(link)}</link><g:image_link>${xml(image)}</g:image_link><g:price>${xml(((variant.pricePaise??0)/100).toFixed(2))} INR</g:price><g:availability>${variant.availableQuantity>0?"in_stock":"out_of_stock"}</g:availability><g:condition>new</g:condition><g:brand>Rehmat Panjab</g:brand><g:size>${variant.sizeMl} ml</g:size><g:shipping_label>India standard; free at eligible ₹1,000 subtotal</g:shipping_label><g:return_policy_label>Rehmat Panjab India returns</g:return_policy_label></item>`;
  }));
  const body=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Rehmat Panjab India product feed</title><link>${origin}</link><description>Current Rehmat Panjab perfume-oil catalogue for future Merchant Center review.</description>${items.join("")}</channel></rss>`;
  return new Response(body,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, s-maxage=900, stale-while-revalidate=3600","x-robots-tag":"noindex, nofollow"}});
}
