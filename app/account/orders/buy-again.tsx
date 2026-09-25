"use client";
import {useState} from "react";
import {useCart} from "../../components/cart-provider";
import type {CartLine} from "../../../lib/cart";
export function BuyAgain({orderId}:{orderId:string}){const cart=useCart(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);async function buy(){setBusy(true);const response=await fetch(`/api/account/orders/${orderId}/buy-again`,{method:"POST"});const value=await response.json();if(response.ok)(value.lines as CartLine[]).forEach(line=>cart.add(line));setMessage(value.message);setBusy(false);}return <div className="buy-again"><button className="button button-dark" type="button" onClick={buy} disabled={busy}>{busy?"Checking current availability…":"Buy Again"}</button><p role="status">{message}</p><small>Current prices, inventory and eligibility are checked. Previous coupons are not restored.</small></div>;}
