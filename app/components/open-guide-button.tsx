"use client";
export function OpenGuideButton({className="button button-dark"}:{className?:string}){return <button className={className} type="button" onClick={()=>window.dispatchEvent(new Event("open-rehmat-guide"))}>Ask Rehmat Guide</button>}
