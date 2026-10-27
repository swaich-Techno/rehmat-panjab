"use client";

import {useState} from "react";

type SampleVariant={id:string;label:string};

export function ConfirmationForm({sampleVariants=[]}:{sampleVariants?:SampleVariant[]}){
  const [message,setMessage]=useState("");
  const [isSample,setIsSample]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const sampleVariantId=String(form.get("sampleVariantId")||"");
    if(isSample&&!sampleVariantId){setMessage("Choose the verified in-stock 3 ml tester.");return;}
    const response=await fetch("/api/admin/whatsapp-orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      reference:form.get("reference"),customerIdentifier:form.get("customerIdentifier")||undefined,userId:form.get("userId")||undefined,
      couponCode:isSample?undefined:form.get("couponCode")||undefined,subtotalPaise:Number(form.get("subtotal"))*100,
      discountPaise:Number(form.get("discount")||0)*100,paymentConfirmed:form.get("paymentConfirmed")==="on",delivered:form.get("delivered")==="on",
      sampleCampaignId:isSample?"diwali-sample-2026":undefined,sampleVariantId:isSample?sampleVariantId:undefined,
    })});
    const data=await response.json();setMessage(data.message);
    if(response.ok){event.currentTarget.reset();setIsSample(false);}
  }
  return <form className="admin-form" onSubmit={submit}>
    <label>Order reference<input name="reference" required /></label>
    <label>Customer phone or email<input name="customerIdentifier" required={isSample} /></label>
    <label>Customer account UUID<input name="userId" placeholder="Required for a reward stamp" /></label>
    <label><input name="sampleCampaign" type="checkbox" checked={isSample} onChange={(event)=>setIsSample(event.target.checked)}/> Confirm as limited ₹99 3 ml sample</label>
    {isSample&&<label>Eligible 3 ml tester<select name="sampleVariantId" required defaultValue=""><option value="" disabled>Choose the verified tester</option>{sampleVariants.map(variant=><option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label>}
    <label>Coupon code<input name="couponCode" autoCapitalize="characters" disabled={isSample} /></label>
    <label>Eligible subtotal (₹){isSample?<input key="sample-subtotal" name="subtotal" type="number" value="99" readOnly />:<input key="order-subtotal" name="subtotal" type="number" min="0" required />}</label>
    <label>Confirmed discount (₹)<input name="discount" type="number" min="0" defaultValue="0" disabled={isSample} /></label>
    <label><input name="paymentConfirmed" type="checkbox" required={isSample}/> Payment verified</label>
    <label><input name="delivered" type="checkbox"/> Delivery verified</label>
    <button className="button button-dark" type="submit">Confirm WhatsApp order</button>
    <p className="form-message" aria-live="polite">{message}</p>
  </form>;
}
