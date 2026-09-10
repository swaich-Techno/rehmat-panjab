import type {SupabaseClient} from "@supabase/supabase-js";
import Link from "next/link";
import {requireAdmin} from "../../../lib/supabase/auth";
import {COMMERCE_ENABLED,RAZORPAY_ENABLED} from "../../../lib/commerce";
import {getStoreSettings,missingStoreFields} from "../../../lib/store-settings";

export const dynamic="force-dynamic";
const human=(value:string)=>value.split(".").map(part=>part.replace(/([A-Z])/g," $1")).join(" · ");
const checks=[
  ["razorpay_account_activated","Razorpay account activated"],["razorpay_live_mode_available","Live Mode available"],["razorpay_kyc_approved","Razorpay KYC approved"],["razorpay_payment_link_verified","Razorpay.me handle verified"],["razorpay_live_credentials","Razorpay live credentials entered server-side"],["razorpay_webhook_configured","Razorpay webhook configured"],["razorpay_webhook_verified","Webhook signature verified"],["razorpay_live_payment","Controlled live payment completed"],["razorpay_order_recorded","Order recorded correctly"],["razorpay_inventory_verified","Inventory reduced only after verified payment"],["razorpay_refund_reviewed","Refund test reviewed"],
  ["shiprocket_kyc_approved","Shiprocket KYC approved"],["shiprocket_pickup_approved","Pickup address approved"],["shiprocket_rates_verified","Shipping rates verified"],["shiprocket_shipment_tested","Shipment creation tested"],["shiprocket_tracking_tested","Tracking delivery tested"],["order_email_tested","Order-confirmation email tested"],
] as const;

export default async function Page(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin")return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const [settings,{data:providers}]=await Promise.all([getStoreSettings("store_policy_settings"),(supabase as unknown as SupabaseClient).from("provider_readiness").select("provider,status,checklist")]);
  const missing=missingStoreFields(settings);
  const status=new Map((providers??[]).map(row=>[String(row.provider),String(row.status)]));
  const completed=Object.assign({},...(providers??[]).map(row=>row.checklist&&typeof row.checklist==="object"?row.checklist:{})) as Record<string,boolean>;
  const razorpayChecklist=(providers??[]).find(row=>row.provider==="razorpay")?.checklist as Record<string,unknown>|null;const razorpayLink=typeof razorpayChecklist?.razorpay_payment_link==="string"?razorpayChecklist.razorpay_payment_link:null;
  return <main id="main-content" className="admin-page"><p className="eyebrow">Private super-admin review</p><h1>Store readiness.</h1><p>Commerce remains {COMMERCE_ENABLED?"enabled":"disabled"}; Razorpay is {RAZORPAY_ENABLED?"server-enabled":"server-disabled"}. Public checkout must remain unavailable until every operational check is verified.</p>
    <div className="admin-table readiness-list">{missing.length?missing.map(item=><div key={item}><strong>{human(item)}</strong><span>Owner input required</span></div>):<div><strong>Owner settings</strong><span>Complete</span></div>}</div>
    <section className="admin-empty"><h2>Provider status</h2><p><strong>Razorpay:</strong> {status.get("razorpay")??"pending"} · verified account Harkirat Singh · public brand Rehmat Panjab</p>{razorpayLink&&<p>Verified Razorpay.me profile: <a className="text-link" href={razorpayLink} target="_blank" rel="noreferrer">razorpay.me/@harkiratsingh5450</a>. Share only after an order total is manually confirmed.</p>}<div className="policy-readiness">{checks.map(([key,label])=><span data-ready={Boolean(completed[key])} key={key}>{label}</span>)}</div><strong>Not ready for live checkout activation.</strong><p><Link className="text-link" href="/admin/policies">Edit policy settings</Link></p></section>
  </main>;
}
