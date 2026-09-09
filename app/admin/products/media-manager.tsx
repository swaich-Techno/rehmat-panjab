"use client";
/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";

export type MediaDraft={id:string;role:"product"|"card"|"hero"|"mood"|"social";storage_path:string;alt_text:string;is_generated:boolean;status:string;sort_order:number};
const publicAsset=(path:string)=>path.startsWith("/")||path.startsWith("http")?path:`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
export function AdminMediaManager({productId,name,slug,initial}:{productId:string;name:string;slug:string;initial:MediaDraft[]}){
  const [items,setItems]=useState(initial),[message,setMessage]=useState(""),[preview,setPreview]=useState(initial[0]?.storage_path??"");
  async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();setMessage("Saving…");const form=new FormData(event.currentTarget);form.set("productId",productId);let response=await fetch("/api/admin/product-media",{method:"POST",body:form});if(response.status===409&&confirm("This image is assigned to another product. Move it here and archive the previous assignment?")){form.set("confirmMove","true");response=await fetch("/api/admin/product-media",{method:"POST",body:form});}const value=await response.json().catch(()=>({message:"Media could not be saved."}));setMessage(value.message);if(response.ok&&value.media)setItems(value.media);}
  return <section className="admin-media-manager"><p className="eyebrow">Media roles</p><h2>{name}</h2><p><strong>Exact slug:</strong> <code>{slug}</code></p><div className="admin-media-grid"><form onSubmit={save}>
    <label>Media role<select name="role" defaultValue="card">{["product","card","hero","mood","social"].map(role=><option key={role}>{role}</option>)}</select></label>
    <label>Existing asset path<input name="path" onChange={e=>setPreview(e.target.value)} placeholder="/images/products/…"/></label><label>Or upload image<input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/avif"/></label>
    <label>Alt text<input name="alt" required minLength={3} maxLength={240}/></label><label>Order<input name="sortOrder" type="number" min="0" max="999" defaultValue="0"/></label><label><input name="generated" type="checkbox"/> Generated campaign artwork</label>
    <div className="admin-media-confirm"><strong>Before saving</strong><span>Product: {name}</span><span>Slug: {slug}</span><span>Role: selected above</span><label><input name="confirmed" type="checkbox" required/> I confirm this image belongs to this exact product and role.</label></div>{preview&&<img src={publicAsset(preview)} alt="Assignment preview"/>}
    <button className="button button-dark" type="submit">Confirm assignment</button><p role="status">{message}</p>
  </form><div><h3>Current assignments</h3>{items.map(item=><article key={item.id}><img src={publicAsset(item.storage_path)} alt={item.alt_text}/><div><strong>{item.role}</strong><code>{item.storage_path}</code><span>{item.is_generated?"Campaign artwork":"Genuine product media"}</span><span>Order {item.sort_order}</span></div></article>)}</div></div></section>;
}
