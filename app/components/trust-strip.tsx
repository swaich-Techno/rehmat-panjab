export function TrustStrip({items}:{items:string[]}){return <aside className="trust-strip" aria-label="Ordering information">{items.map(item=><span key={item}>{item}</span>)}</aside>}
