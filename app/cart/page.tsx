import { notFound } from "next/navigation";
import { COMMERCE_ENABLED } from "../../lib/commerce";
import { CartPageContent } from "./page-content";

export default function CartPage() {
  if (!COMMERCE_ENABLED) notFound();
  return <CartPageContent />;
}
