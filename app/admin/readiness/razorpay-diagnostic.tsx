"use client";
import {useState} from "react";

export function RazorpayDiagnostic(){
  const [message,setMessage]=useState("Not checked in this session."),[busy,setBusy]=useState(false);
  async function check(){setBusy(true);setMessage("Checking server-side credentials…");try{const response=await fetch("/api/admin/readiness/razorpay",{method:"POST"});const value=await response.json();setMessage(response.ok?String(value.status).replaceAll("_"," "):value.message??"Credential check failed.");}catch{setMessage("Credential check could not be completed.");}finally{setBusy(false);}}
  async function webhook(){setBusy(true);setMessage("Sending a signed webhook and one idempotent retry…");try{const response=await fetch("/api/admin/readiness/webhook",{method:"POST"});const value=await response.json();const codes=value.firstStatus&&value.retryStatus?` · first ${value.firstStatus}, retry ${value.retryStatus}`:"";setMessage(`${String(value.status).replaceAll("_"," ")}${codes}`);}catch{setMessage("Signed webhook check could not be completed.");}finally{setBusy(false);}}
  async function telegram(){setBusy(true);setMessage("Sending a private Telegram test alert…");try{const response=await fetch("/api/admin/readiness/telegram",{method:"POST"});const value=await response.json();setMessage(String(value.status??value.message??"Telegram alert test failed.").replaceAll("_"," "));}catch{setMessage("Telegram alert test could not be completed.");}finally{setBusy(false);}}
  return <div><button className="button button-outline" type="button" onClick={check} disabled={busy}>{busy?"Checking…":"Run protected Razorpay authentication check"}</button> <button className="button button-outline" type="button" onClick={webhook} disabled={busy}>Run signed webhook + idempotency check</button> <button className="button button-outline" type="button" onClick={telegram} disabled={busy}>Send Telegram test alert</button><p role="status">{message}</p></div>;
}
