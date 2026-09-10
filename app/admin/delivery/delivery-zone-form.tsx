"use client";

import {useState} from "react";

export function DeliveryZoneForm({pins,autoEnabled,verifiedAt}:{pins:string[];autoEnabled:boolean;verifiedAt:string|null}){
  const [message,setMessage]=useState("");
  async function submit(formData:FormData){
    setMessage("Saving…");
    const response=await fetch("/api/admin/delivery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pins:String(formData.get("pins")||"").split(/[\s,]+/).filter(Boolean),autoEnabled:formData.has("autoEnabled"),completeListConfirmed:formData.has("completeListConfirmed")})});
    const result=await response.json().catch(()=>({message:"Delivery settings could not be saved."}));
    setMessage(result.message);
  }
  return <form className="policy-settings-form" action={submit}>
    <fieldset><legend>Approved local-delivery PIN codes</legend><label className="full">Six-digit PIN codes<textarea name="pins" rows={7} defaultValue={pins.join("\n")} placeholder="One PIN code per line"/></label><p>Eligibility uses exact PIN-code matches only. City names and free text are never used.</p></fieldset>
    <fieldset><legend>Activation safeguard</legend><label><input type="checkbox" name="autoEnabled" defaultChecked={autoEnabled}/> Automatically offer free local delivery for approved PIN codes</label><label><input type="checkbox" name="completeListConfirmed"/> I confirm the list is complete and verified</label><p>{verifiedAt?`Last verified ${new Date(verifiedAt).toLocaleString("en-IN")}.`:"Automatic local eligibility is disabled. Edge cases remain manual through WhatsApp."}</p></fieldset>
    <button className="button button-dark" type="submit">Save delivery zone</button><p role="status" aria-live="polite">{message}</p>
  </form>;
}
