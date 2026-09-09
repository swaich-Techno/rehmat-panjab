import { notFound } from "next/navigation";
import { COMMERCE_ENABLED } from "../../lib/commerce";
import { CartPageContent } from "./page-content";
import {getPublishedPolicyRecord} from "../../lib/store-settings";

export default async function CartPage() {
  if (!COMMERCE_ENABLED) notFound();
  const policy=await getPublishedPolicyRecord();
  if(!policy)notFound();
  return <CartPageContent policyVersion={policy.version}/>;
}
