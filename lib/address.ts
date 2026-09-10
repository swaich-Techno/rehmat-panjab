import { z } from "zod";

const clean=(value:string)=>value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
const required=(label:string,max:number)=>z.string().transform(clean).pipe(z.string().min(1,`${label} is required.`).max(max,`${label} is too long.`));
const optional=(max:number)=>z.string().transform(clean).pipe(z.string().max(max)).optional().default("");

export function normalizeIndianMobile(value:string){
  const digits=value.replace(/\D/g,"").replace(/^0091/,"");
  const national=digits.length===12&&digits.startsWith("91")?digits.slice(2):digits;
  return /^[6-9]\d{9}$/.test(national)?`+91${national}`:null;
}

const mobile=z.string().transform(clean).refine(value=>Boolean(normalizeIndianMobile(value)),"Enter a valid Indian mobile number.").transform(value=>normalizeIndianMobile(value)!);
const optionalMobile=z.string().transform(clean).refine(value=>!value||Boolean(normalizeIndianMobile(value)),"Enter a valid alternate Indian mobile number.").transform(value=>value?normalizeIndianMobile(value)!:"");

export const deliveryAddressSchema=z.object({
  recipientName:required("Recipient name",100),
  mobile,
  alternateMobile:optionalMobile,
  email:z.string().transform(clean).pipe(z.string().email("Enter a valid email address.").max(160)),
  house:required("House, flat, floor or building",160),
  streetVillage:required("Street, road or village",160),
  locality:required("Area, locality or sector",120),
  landmark:optional(120),
  city:required("City or town",100),
  district:required("District",100),
  state:required("State",100),
  pinCode:z.string().transform(value=>value.replace(/\D/g,"")).pipe(z.string().regex(/^\d{6}$/,"Enter a six-digit PIN code.")),
  country:z.literal("India"),
  addressType:z.enum(["Home","Work","Other"]),
  instructions:optional(240),
}).strict();

export const checkoutAddressSchema=z.object({
  delivery:deliveryAddressSchema,
  billingSameAsDelivery:z.boolean(),
  billing:deliveryAddressSchema.optional(),
}).superRefine((value,context)=>{if(!value.billingSameAsDelivery&&!value.billing)context.addIssue({code:"custom",message:"Enter a billing address.",path:["billing"]});});

export type DeliveryAddress=z.infer<typeof deliveryAddressSchema>;
export type CheckoutAddress=z.infer<typeof checkoutAddressSchema>;

export const emptyDeliveryAddress:DeliveryAddress={recipientName:"",mobile:"",alternateMobile:"",email:"",house:"",streetVillage:"",locality:"",landmark:"",city:"",district:"",state:"Punjab",pinCode:"",country:"India",addressType:"Home",instructions:""};

export function formatAddressLines(address:DeliveryAddress){
  return [address.house,address.streetVillage,address.locality,address.landmark,[address.city,address.district,address.state].filter(Boolean).join(", "),`${address.pinCode}, India`].filter(Boolean);
}

export function addressPreview(address:DeliveryAddress){
  return [address.recipientName,address.mobile,...formatAddressLines(address),address.instructions?`Delivery instructions: ${address.instructions}`:""].filter(Boolean).join("\n");
}
