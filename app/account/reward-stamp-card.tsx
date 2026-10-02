import Link from "next/link";

type Entitlement={id:string;reward_name:string;status:string;earned_at:string;expires_at:string|null;settings_snapshot:Record<string,unknown>|null};

export function RewardStampCard({stampTotal,entitlements}:{stampTotal:number;entitlements:Entitlement[]}){
  const current=((stampTotal%10)+10)%10;const justEarned=current===0&&entitlements.some(item=>item.status==="available");
  return <section className={justEarned?"reward-stamp-card is-complete":"reward-stamp-card"} aria-labelledby="rewards-heading">
    <header><div><p className="eyebrow">Rehmat Rewards</p><h2 id="rewards-heading">{current} of 10 stamps</h2></div><strong>{stampTotal} lifetime</strong></header>
    <ol aria-label={`${current} of 10 reward stamps earned`}>{Array.from({length:10},(_,index)=><li key={index} className={index<current||justEarned?"is-earned":""}><span aria-hidden="true">R</span><span className="sr-only">Stamp {index+1}: {index<current||justEarned?"earned":"not yet earned"}</span></li>)}</ol>
    {justEarned?<p className="reward-celebration" role="status">Your complimentary Rehmat Gift Hamper entitlement is ready. Redemption opens after the owner configures its hamper and shipping details.</p>:<p>One stamp is confirmed after an eligible online order is both paid and delivered. Refunds and reversals can change this balance.</p>}
    <div className="reward-history"><h3>Reward history</h3>{entitlements.length?entitlements.map(item=><article key={item.id}><strong>{item.reward_name}</strong><span>{item.status}</span><small>Earned {new Date(item.earned_at).toLocaleDateString("en-IN")}{item.expires_at?` · expires ${new Date(item.expires_at).toLocaleDateString("en-IN")}`:""}</small></article>):<p>No hamper rewards earned yet.</p>}</div>
    <Link href="/policies/rewards">Rewards terms</Link>
  </section>;
}
