import {merchant} from "../../lib/merchant";
import type {Metadata} from "next";
import {pageMetadata} from "../../lib/seo";

export const metadata:Metadata=pageMetadata({title:"Contact Customer Care",description:"Contact Rehmat Panjab for fragrance guidance, product availability, delivery questions or help with an existing order request.",path:"/contact"});

export default function ContactPage(){return <main id="main-content" className="legal-page"><p className="eyebrow">Customer care</p><h1>Contact Us</h1><p>For product guidance, availability, delivery or an existing request, contact Rehmat Panjab directly.</p><dl><div><dt>Telephone</dt><dd><a href={`tel:${merchant.phoneE164}`}>{merchant.phone}</a></dd></div><div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${merchant.whatsapp}`} target="_blank" rel="noreferrer">Message {merchant.phone}</a></dd></div>{merchant.email&&<div><dt>Support email</dt><dd><a href={`mailto:${merchant.email}`}>{merchant.email}</a></dd></div>}{merchant.hours&&<div><dt>Support hours</dt><dd>{merchant.hours}</dd></div>}{merchant.address&&<div><dt>Business address</dt><dd>{merchant.address}</dd></div>}</dl><p>Delivery is available within India. Free standard shipping applies to eligible product subtotals of ₹1,000 or more; other available delivery charges are disclosed before payment or manual order confirmation.</p></main>}
