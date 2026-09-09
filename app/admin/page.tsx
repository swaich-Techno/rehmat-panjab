import Link from "next/link";
import { requireAdmin } from "../../lib/supabase/auth";
export const dynamic="force-dynamic";
const cards=[
  ["01","Products","/admin/products","Catalogue, variants and inventory."],
  ["02","Reviews","/admin/reviews","Moderation, reports and public responses."],
  ["03","Experiences","/admin/experiences","Layering, quiz and WhatsApp settings."],
  ["04","Discounts","/admin/discounts","Scheduled automatic pricing rules."],
  ["05","Coupons","/admin/coupons","Codes, eligibility and usage limits."],
  ["06","Orders","/admin/orders","Manual WhatsApp confirmations."],
  ["07","Store readiness","/admin/readiness","Contact, policies and Razorpay checklist."],
  ["08","Bottles","/admin/bottles","Bottle formats, packaging details and variant relationships."],
  ["09","Policies","/admin/policies","Owner-approved merchant, shipping, returns, privacy and terms settings."],
];
export default async function AdminPage(){const {role}=await requireAdmin();return <main id="main-content" className="admin-page"><p className="eyebrow">House administration · {role.replace("_"," ")}</p><h1>Rehmat house<br/>operations.</h1><div className="admin-grid">{cards.filter((_,i)=>role==="super_admin"||i<3).map(([n,title,href,copy])=><Link href={href} key={href}><span>{n}</span><h2>{title}</h2><p>{copy}</p></Link>)}</div></main>}
