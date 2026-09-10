import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateOrderQuote } from "../../../lib/quote";
const schema=z.object({lines:z.array(z.object({variantId:z.string().uuid(),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(20),couponCode:z.string().trim().max(40).optional(),customerIdentifier:z.string().trim().max(120).optional(),deliveryPin:z.string().trim().regex(/^\d{6}$/).optional()}).strict();
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:"Check the order details."},{status:400});try{return NextResponse.json(await calculateOrderQuote(parsed.data.lines,parsed.data.couponCode,parsed.data.customerIdentifier,parsed.data.deliveryPin));}catch(error){return NextResponse.json({message:error instanceof Error?error.message:"The order could not be quoted."},{status:400});}}
