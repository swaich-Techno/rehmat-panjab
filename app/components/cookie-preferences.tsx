"use client";
import {useEffect,useState} from "react";
type Preference="all"|"essential";
const storageKey="rehmat-cookie-preference";
export function CookiePreferences(){
  const [open,setOpen]=useState(false),[current,setCurrent]=useState<Preference|null>(null);
  useEffect(()=>{queueMicrotask(()=>{try{const value=localStorage.getItem(storageKey);if(value==="all"||value==="essential")setCurrent(value);else setOpen(true);}catch{setOpen(true);}});const handler=(event:MouseEvent)=>{const target=event.target as HTMLElement|null;if(target?.closest("[data-cookie-preferences]"))setOpen(true);};document.addEventListener("click",handler);return()=>document.removeEventListener("click",handler);},[]);
  function choose(value:Preference){try{localStorage.setItem(storageKey,value);}catch{}setCurrent(value);setOpen(false);window.dispatchEvent(new CustomEvent("rehmat-cookie-preference",{detail:{value}}));}
  if(!open)return null;
  return <aside className="cookie-preferences" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><h2 id="cookie-title">Cookie preferences</h2><p>Rehmat Panjab currently uses necessary browser storage for essential site features. Optional analytics or marketing storage will not be enabled without your choice.</p>{current&&<p><small>Current choice: {current==="all"?"allow optional cookies":"necessary only"}</small></p>}<div><button className="button button-outline" type="button" onClick={()=>choose("essential")}>Reject non-essential</button><button className="button button-dark" type="button" onClick={()=>choose("all")}>Accept optional cookies</button></div></aside>;
}
