"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { GuideProduct, GuideReply } from "../../lib/rehmat-guide";

type Config={enabled:boolean;greeting:string;prompts:string[];whatsapp:{enabled:boolean;number:string;notice:string};source:string};
type Message={id:number;role:"guide"|"visitor";text:string;products?:GuideProduct[];layering?:boolean};
const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);

export function RehmatGuide(){
  const [open,setOpen]=useState(false),[config,setConfig]=useState<Config|null>(null),[messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const panel=useRef<HTMLDivElement>(null),launcher=useRef<HTMLButtonElement>(null),field=useRef<HTMLInputElement>(null);
  useEffect(()=>{fetch("/api/rehmat-guide").then(r=>r.json()).then((value:Config)=>{setConfig(value);setMessages([{id:1,role:"guide",text:value.greeting}]);}).catch(()=>setError("The guide could not be loaded."));},[]);
  useEffect(()=>{const show=()=>setOpen(true);window.addEventListener("open-rehmat-guide",show);return()=>window.removeEventListener("open-rehmat-guide",show);},[]);
  useEffect(()=>{if(!open)return;field.current?.focus();const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);launcher.current?.focus();return;}if(event.key!=="Tab"||!panel.current)return;const controls=[...panel.current.querySelectorAll<HTMLElement>('a,button,input:not([disabled])')];if(!controls.length)return;const first=controls[0],last=controls.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[open]);
  async function ask(text:string){const clean=text.trim();if(!clean||loading)return;setMessages(v=>[...v,{id:Date.now(),role:"visitor",text:clean}]);setInput("");setLoading(true);setError("");try{const response=await fetch("/api/rehmat-guide",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:clean})});const value=await response.json() as GuideReply&{message:string};if(!response.ok)throw new Error(value.message);setMessages(v=>[...v,{id:Date.now()+1,role:"guide",text:value.message,products:value.products,layering:value.layering}]);}catch(cause){setError(cause instanceof Error?cause.message:"Please try again.");}finally{setLoading(false);}}
  function submit(event:FormEvent){event.preventDefault();void ask(input);}
  function whatsapp(products:GuideProduct[],layering=false){const lines=products.map(p=>`${p.name}: ${p.variants.map(v=>`${v.sizeMl} ml ${money(v.pricePaise)}`).join(" / ")}`);return `https://wa.me/${config?.whatsapp.number}?text=${encodeURIComponent(`Sat Sri Akal, I would like to ask about ${layering?"this layering combination":"these fragrances"}:\n${lines.join("\n")}\nPlease confirm availability and ordering details.`)}`;}
  if(config&&!config.enabled)return null;
  return <>
    <button ref={launcher} className="guide-launcher" type="button" aria-label="Open Rehmat Guide" aria-expanded={open} aria-controls="rehmat-guide-panel" onClick={()=>setOpen(true)}><span aria-hidden="true">R</span><b>Ask Rehmat Guide</b></button>
    {open&&<div className="guide-shell" role="presentation"><button className="guide-scrim" aria-label="Close Rehmat Guide" onClick={()=>setOpen(false)}/><div ref={panel} id="rehmat-guide-panel" className="guide-panel" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <header><div><p>Rehmat Panjab</p><h2 id="guide-title">Rehmat Guide</h2><span>Your personal fragrance companion.</span></div><button type="button" aria-label="Close Rehmat Guide" onClick={()=>{setOpen(false);launcher.current?.focus();}}>×</button></header>
      <div className="guide-messages" aria-live="polite">{messages.map(message=><article key={message.id} className={`guide-message is-${message.role}`}><p>{message.text}</p>{message.products?.map(product=><section className="guide-product" key={product.slug}>
        <Image src={product.image} alt={product.imageAlt} width={96} height={120}/><div><h3>{product.name}</h3>{product.inspirationLine&&<small>{product.inspirationLine}</small>}<p>{product.reason}</p><p className="guide-notes">{product.notes?[...product.notes.top,...product.notes.heart,...product.notes.base].slice(0,5).join(" · "):product.atmosphere}</p><p>{product.variants.length?product.variants.map(v=>`${v.sizeMl} ml · ${money(v.pricePaise)} · ${v.availableQuantity} available`).join(" | "):"No orderable size available"}</p><div><Link href={`/product/${product.slug}`}>View product</Link></div></div>
      </section>)}{message.products?.length&&config?.whatsapp.enabled?<a className="guide-whatsapp" href={whatsapp(message.products,message.layering)} target="_blank" rel="noreferrer">Add to WhatsApp order</a>:null}</article>)}{loading&&<p className="guide-status">Considering the live collection…</p>}{error&&<p className="guide-error" role="alert">{error}</p>}</div>
      {messages.length===1&&<div className="guide-prompts">{config?.prompts.slice(0,4).map(prompt=><button type="button" key={prompt} onClick={()=>void ask(prompt)}>{prompt}</button>)}</div>}
      <form onSubmit={submit}><label htmlFor="guide-input" className="sr-only">Ask about a fragrance</label><input ref={field} id="guide-input" value={input} maxLength={360} onChange={e=>setInput(e.target.value)} placeholder="Soft for work, under ₹700…" disabled={loading}/><button type="submit" disabled={loading||!input.trim()} aria-label="Send fragrance question">Send</button></form>
      <footer><button type="button" onClick={()=>{setMessages(config?[{id:Date.now(),role:"guide",text:config.greeting}]:[]);setError("");}}>Reset conversation</button><span>{config?.source==="deterministic"?"Grounded catalogue guide":"Grounded guide with fallback"}</span></footer>
    </div></div>}
  </>;
}
