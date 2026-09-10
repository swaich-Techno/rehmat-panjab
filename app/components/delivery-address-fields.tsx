"use client";

import type {DeliveryAddress} from "../../lib/address";

export function DeliveryAddressFields({value,onChange,legend="Delivery address"}:{value:DeliveryAddress;onChange:(value:DeliveryAddress)=>void;legend?:string}){
  const set=(field:keyof DeliveryAddress,next:string)=>onChange({...value,[field]:next});
  return <fieldset className="delivery-address-fields"><legend>{legend}</legend>
    <p className="field-note">Required fields are marked *. India delivery only; serviceability is confirmed separately.</p>
    <label>Recipient full name *<input required maxLength={100} autoComplete="name" value={value.recipientName} onChange={e=>set("recipientName",e.target.value)}/></label>
    <label>Indian mobile number *<input required inputMode="tel" maxLength={16} autoComplete="tel" value={value.mobile} onChange={e=>set("mobile",e.target.value)}/></label>
    <label>Alternate mobile <span>optional</span><input inputMode="tel" maxLength={16} value={value.alternateMobile} onChange={e=>set("alternateMobile",e.target.value)}/></label>
    <label>Email *<input required type="email" maxLength={160} autoComplete="email" value={value.email} onChange={e=>set("email",e.target.value)}/></label>
    <label>House, flat, floor or building *<input required maxLength={160} autoComplete="address-line1" value={value.house} onChange={e=>set("house",e.target.value)}/></label>
    <label>Street, road or village *<input required maxLength={160} autoComplete="address-line2" value={value.streetVillage} onChange={e=>set("streetVillage",e.target.value)}/></label>
    <label>Area, locality or sector *<input required maxLength={120} autoComplete="address-level3" value={value.locality} onChange={e=>set("locality",e.target.value)}/></label>
    <label>Landmark <span>optional</span><input maxLength={120} value={value.landmark} onChange={e=>set("landmark",e.target.value)}/></label>
    <label>City or town *<input required maxLength={100} autoComplete="address-level2" value={value.city} onChange={e=>set("city",e.target.value)}/></label>
    <label>District *<input required maxLength={100} value={value.district} onChange={e=>set("district",e.target.value)}/></label>
    <label>State *<input required maxLength={100} autoComplete="address-level1" value={value.state} onChange={e=>set("state",e.target.value)}/></label>
    <label>Six-digit PIN code *<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={value.pinCode} onChange={e=>set("pinCode",e.target.value.replace(/\D/g,""))}/></label>
    <label>Country<input readOnly value="India" autoComplete="country-name"/></label>
    <label>Address type<select value={value.addressType} onChange={e=>set("addressType",e.target.value)}><option>Home</option><option>Work</option><option>Other</option></select></label>
    <label className="full">Delivery instructions <span>optional</span><textarea maxLength={240} rows={3} value={value.instructions} onChange={e=>set("instructions",e.target.value)}/></label>
  </fieldset>;
}
