"use client";
import {useState} from "react";
import {createSupabaseBrowserClient} from "../../lib/supabase/browser";
export function SignOutButton(){const [busy,setBusy]=useState(false);return <button className="text-link" type="button" disabled={busy} onClick={async()=>{setBusy(true);await createSupabaseBrowserClient()?.auth.signOut();window.location.assign("/");}}>{busy?"Signing out…":"Sign out"}</button>;}
