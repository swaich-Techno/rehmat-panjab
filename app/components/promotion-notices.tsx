import { BUY_TWO_GIFT_LABEL, FESTIVAL_END_ISO, FESTIVAL_PUBLIC_LABEL, FESTIVAL_START_ISO } from "../../lib/promotions.mjs";
const renderedAt=Date.now();

export function PromotionNotices({compact=false}:{compact?:boolean}){
  const festival=renderedAt>=new Date(FESTIVAL_START_ISO).getTime()&&renderedAt<=new Date(FESTIVAL_END_ISO).getTime();
  return <aside className={compact?"promotion-notices is-compact":"promotion-notices"} aria-label="Current offers">
    <p><strong>Choose your gift</strong><span>{BUY_TWO_GIFT_LABEL} The secure checkout applies only the single highest-value eligible promotion.</span></p>
    {festival&&<p><strong>Festival celebration</strong><span>{FESTIVAL_PUBLIC_LABEL} Ends 23 October 2026 at 11:59 PM IST.</span></p>}
  </aside>;
}
