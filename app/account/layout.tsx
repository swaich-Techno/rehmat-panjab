import Link from "next/link";
import type {Metadata} from "next";

export const metadata:Metadata={robots:{index:false,follow:false}};

export default function AccountLayout({children}:{children:React.ReactNode}){return <div className="account-area"><nav className="account-nav" aria-label="Customer account"><Link href="/account">Overview</Link><Link href="/account/orders">Orders</Link><Link href="/account/profile">Profile</Link><Link href="/account/addresses">Addresses</Link></nav>{children}</div>;}
