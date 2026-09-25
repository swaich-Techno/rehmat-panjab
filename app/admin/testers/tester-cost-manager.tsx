"use client";

import { useState } from "react";
import { calculateTesterCosts } from "../../../lib/tester-packs";
import { formatMoney } from "../../../lib/cart";

type Relation<T> = T | T[] | null;
type Cost = {
  total_oil_purchase_cost_paise:number|null; total_purchased_ml:number|null; bottle_cost_paise:number|null;
  individual_box_cost_paise:number|null; label_cost_paise:number|null; filling_sealing_cost_paise:number|null;
  labour_cost_paise:number|null; pack_insert_cost_paise:number|null; selling_price_paise:number;
  minimum_margin_percent:number|null; margin_approved:boolean; packaging_approved:boolean; admin_notes:string|null;
};
type Intake = {
  supplier_reference:string; opening_notes:string[]; heart_notes:string[]; base_notes:string[];
  description:string|null; audience:string|null; image_path:string|null; content_approved:boolean; image_approved:boolean;
};
type Product = { id:string; name:string; status:string; image_path:string|null; description:string; suitability_note:string|null; tester_product_intake:Relation<Intake> };
export type TesterCostRow = {
  id:string; sku:string; price_paise:number; status:string; enabled:boolean; bottle_id:string|null;
  products:Relation<Product>; bottles:Relation<{status:string;photo_path:string|null}>;
  inventory:Relation<{quantity:number;reserved:number;low_stock_threshold:number}>; tester_variant_costs:Relation<Cost>;
};

const one=<T,>(value:Relation<T>)=>Array.isArray(value)?value[0]??null:value;
const rupees=(value:number|null|undefined)=>value===null||value===undefined?"":value/100;
const list=(value:FormDataEntryValue|null)=>String(value??"").split(",").map(item=>item.trim()).filter(Boolean);

export function TesterCostManager({initial}:{initial:TesterCostRow[]}){
  const [message,setMessage]=useState("");
  async function save(event:React.FormEvent<HTMLFormElement>,variantId:string){
    event.preventDefault(); setMessage("Saving tester review…");
    const form=new FormData(event.currentTarget); const nullable=(name:string)=>form.get(name)===""?null:Number(form.get(name));
    const payload={
      variantId,totalOilPurchaseCostRupees:nullable("totalOilPurchaseCost"),totalPurchasedMl:nullable("totalPurchasedMl"),
      bottleCostRupees:nullable("bottleCost"),individualBoxCostRupees:nullable("individualBoxCost"),labelCostRupees:nullable("labelCost"),
      fillingSealingCostRupees:nullable("fillingSealingCost"),labourCostRupees:nullable("labourCost"),packInsertCostRupees:nullable("packInsertCost"),
      minimumMarginPercent:nullable("minimumMarginPercent"),quantity:Number(form.get("quantity")),lowStockThreshold:Number(form.get("lowStockThreshold")),
      openingNotes:list(form.get("openingNotes")),heartNotes:list(form.get("heartNotes")),baseNotes:list(form.get("baseNotes")),
      description:String(form.get("description")??""),audience:String(form.get("audience")??""),imagePath:String(form.get("imagePath")??""),
      contentApproved:form.get("contentApproved")==="on",imageApproved:form.get("imageApproved")==="on",
      marginApproved:form.get("marginApproved")==="on",packagingApproved:form.get("packagingApproved")==="on",
      activate:form.get("activate")==="on",adminNotes:String(form.get("adminNotes")??""),
    };
    const response=await fetch("/api/admin/testers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json(); setMessage(result.message); if(response.ok)window.location.reload();
  }
  return <div className="admin-tester-list">
    {initial.map(row=>{
      const product=one(row.products),intake=one(product?.tester_product_intake??null),cost=one(row.tester_variant_costs),inventory=one(row.inventory),bottle=one(row.bottles);
      const summary=cost?calculateTesterCosts({totalOilPurchaseCostPaise:cost.total_oil_purchase_cost_paise,totalPurchasedMl:Number(cost.total_purchased_ml)||null,bottleCostPaise:cost.bottle_cost_paise,individualBoxCostPaise:cost.individual_box_cost_paise,labelCostPaise:cost.label_cost_paise,fillingSealingCostPaise:cost.filling_sealing_cost_paise,labourCostPaise:cost.labour_cost_paise,packInsertCostPaise:cost.pack_insert_cost_paise,sellingPricePaise:row.price_paise,marginApproved:cost.margin_approved}):null;
      return <form className="admin-tester-card" key={row.id} onSubmit={event=>save(event,row.id)}>
        <header><div><p className="eyebrow">{row.sku}</p><h2>{product?.name??"Tester"}</h2>{intake?.supplier_reference&&<small>Private supplier reference: {intake.supplier_reference}</small>}</div><span className={`status-dot ${row.status==="active"?"status-active":"status-archived"}`}>{row.status}</span></header>
        <div className="admin-tester-grid">
          <label>Opening notes (comma-separated)<input name="openingNotes" defaultValue={intake?.opening_notes?.join(", ")??""}/></label>
          <label>Heart notes (comma-separated)<input name="heartNotes" defaultValue={intake?.heart_notes?.join(", ")??""}/></label>
          <label>Base notes (comma-separated)<input name="baseNotes" defaultValue={intake?.base_notes?.join(", ")??""}/></label>
          <label>Audience / gender classification<input name="audience" defaultValue={intake?.audience??product?.suitability_note??""}/></label>
          <label className="full">Description<textarea name="description" rows={3} defaultValue={intake?.description??product?.description??""}/></label>
          <label className="full">Owner-approved image path<input name="imagePath" defaultValue={intake?.image_path??product?.image_path??""}/></label>
          <label>Total oil purchase cost (₹)<input name="totalOilPurchaseCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.total_oil_purchase_cost_paise)}/></label>
          <label>Total purchased quantity (ml)<input name="totalPurchasedMl" type="number" min=".01" step=".01" defaultValue={cost?.total_purchased_ml??""}/></label>
          <label>Bottle cost (₹)<input name="bottleCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.bottle_cost_paise??1175)}/></label>
          <label>Individual box (₹)<input name="individualBoxCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.individual_box_cost_paise)}/></label>
          <label>Label (₹)<input name="labelCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.label_cost_paise)}/></label>
          <label>Filling and sealing (₹)<input name="fillingSealingCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.filling_sealing_cost_paise)}/></label>
          <label>Labour (₹)<input name="labourCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.labour_cost_paise)}/></label>
          <label>Insert (₹)<input name="packInsertCost" type="number" min="0" step=".01" defaultValue={rupees(cost?.pack_insert_cost_paise)}/></label>
          <label>Minimum margin (%)<input name="minimumMarginPercent" type="number" min="0" max="100" step=".01" defaultValue={cost?.minimum_margin_percent??""}/></label>
          <label>Opening inventory<input name="quantity" type="number" min={inventory?.reserved??0} step="1" defaultValue={inventory?.quantity??0}/></label>
          <label>Low-stock threshold<input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={inventory?.low_stock_threshold??2}/></label>
        </div>
        <div className="tester-cost-summary">
          <span>Selling price <strong>{formatMoney(row.price_paise)}</strong></span>
          <span>Cost/ml <strong>{summary?.costPerMlPaise===null||!summary?"Missing":formatMoney(Math.round(summary.costPerMlPaise))}</strong></span>
          <span>3 ml oil <strong>{summary?.threeMlOilCostPaise===null||!summary?"Missing":formatMoney(Math.round(summary.threeMlOilCostPaise))}</strong></span>
          <span>Total COGS <strong>{summary?.totalCogsPaise===null||!summary?"Missing":formatMoney(Math.round(summary.totalCogsPaise))}</strong></span>
          <span>Gross profit <strong>{summary?.grossProfitPaise===null||!summary?"Missing":formatMoney(Math.round(summary.grossProfitPaise))}</strong></span>
          <span>Margin <strong>{!summary||summary.grossMarginPercent===null?"Missing":`${summary.grossMarginPercent.toFixed(1)}%`}</strong></span>
        </div>
        {summary?.missing.length?<p className="admin-warning">Missing: {summary.missing.join(", ")}. Margin approval is blocked.</p>:null}
        {bottle?.status!=="active"&&<p className="admin-warning">The 3 ml bottle record is inactive pending a real approved packaging photograph.</p>}
        <label><input name="contentApproved" type="checkbox" defaultChecked={intake?.content_approved}/> Notes, description and audience are owner-approved</label>
        <label><input name="imageApproved" type="checkbox" defaultChecked={intake?.image_approved}/> Product imagery is owner-approved</label>
        <label><input name="marginApproved" type="checkbox" defaultChecked={cost?.margin_approved}/> Margin reviewed and approved</label>
        <label><input name="packagingApproved" type="checkbox" defaultChecked={cost?.packaging_approved}/> Real packaging photograph and presentation approved</label>
        <label><input name="activate" type="checkbox" defaultChecked={row.status==="active"}/> Activate this tester for sale</label>
        <label>Private notes<textarea name="adminNotes" defaultValue={cost?.admin_notes??""}/></label>
        <button className="button button-dark" type="submit">Save tester</button>
      </form>;
    })}
    <p className="form-message" role="status">{message}</p>
  </div>;
}
