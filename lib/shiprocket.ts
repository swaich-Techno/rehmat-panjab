import "server-only";
import type {DeliveryAddress} from "./address";

export type ShiprocketAddress={shipping_customer_name:string;shipping_address:string;shipping_address_2:string;shipping_city:string;shipping_pincode:string;shipping_state:string;shipping_country:"India";shipping_phone:string};
export function toShiprocketAddress(address:DeliveryAddress):ShiprocketAddress{return {shipping_customer_name:address.recipientName,shipping_address:[address.house,address.streetVillage].join(", "),shipping_address_2:[address.locality,address.landmark].filter(Boolean).join(", "),shipping_city:address.city,shipping_pincode:address.pinCode,shipping_state:address.state,shipping_country:"India",shipping_phone:address.mobile.replace(/^\+91/,"")};}
export function shiprocketActive(){return process.env.SHIPROCKET_ENABLED==="true"&&Boolean(process.env.SHIPROCKET_EMAIL&&process.env.SHIPROCKET_PASSWORD);}
export async function createShiprocketShipment(address:DeliveryAddress):Promise<never>{void address;throw new Error("Shiprocket shipment creation is inactive until KYC, pickup, rates and tracking are verified.");}
