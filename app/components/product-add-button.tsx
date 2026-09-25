"use client";
import {COMMERCE_ENABLED} from "../../lib/commerce";
import {isPurchasable,type StorefrontProduct} from "../../lib/catalog";
import {useCart} from "./cart-provider";
export function ProductAddButton({product,className="button button-dark"}:{product:StorefrontProduct;className?:string}){const cart=useCart(),variant=product.variants.find(item=>isPurchasable(product,item));if(!COMMERCE_ENABLED||!variant)return null;return <button className={className} type="button" onClick={()=>cart.add({variantId:variant.id,productSlug:product.slug,productName:product.name,sizeMl:variant.sizeMl,sku:variant.sku,unitPricePaise:variant.pricePaise!,currency:variant.currency,image:product.image,maxQuantity:variant.availableQuantity,quantity:1})}>Add to cart</button>;}
