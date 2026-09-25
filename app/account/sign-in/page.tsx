import type {Metadata} from "next";
import {MagicLinkSignIn} from "./magic-link-sign-in";
import {isSupabaseConfigured} from "../../../lib/supabase/config";

export const metadata:Metadata={title:"Customer Sign In",robots:{index:false,follow:false}};
export default async function AccountSignIn({searchParams}:{searchParams:Promise<{returnTo?:string;error?:string}>}){const params=await searchParams;const returnTo=params.returnTo?.startsWith("/")&&!params.returnTo.startsWith("//")?params.returnTo:"/account";return <main id="main-content" className="account-sign-in"><p className="eyebrow">Your private account</p><h1>Return by email.</h1><p>We’ll send a secure, single-use sign-in link. No password is required.</p><MagicLinkSignIn configured={isSupabaseConfigured()} returnTo={returnTo} initialError={params.error==="link"?"That sign-in link could not be verified. Request a new one.":""}/></main>;}
