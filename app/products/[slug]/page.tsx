import {permanentRedirect} from "next/navigation";
import {productRedirects} from "../../../lib/products";

export default async function LegacyPluralProductRoute({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(productRedirects[slug])permanentRedirect(`/products/${productRedirects[slug]}`);
  permanentRedirect(`/product/${slug}`);
}
