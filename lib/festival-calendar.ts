export type FestivalRecommendation = {
  id: string; name: string; date: string; timezone: "Asia/Kolkata"; startDate: string; endDate: string;
  tags: string[]; primarySlug: string; alternativeSlugs: string[]; headline: string; description: string;
  status: "published" | "draft"; sourceUrl: string;
};

// Verified against the Government of India holiday calendar. Dates are deliberately
// version controlled; lunar dates are never inferred at runtime.
export const FESTIVAL_RECOMMENDATIONS: FestivalRecommendation[] = [
  { id:"dussehra-2026",name:"Dussehra",date:"2026-10-20",timezone:"Asia/Kolkata",startDate:"2026-10-10",endDate:"2026-10-20",tags:["celebration","evening","warm"],primarySlug:"amber-veil",alternativeSlugs:["velvet-oud","purple-oud"],headline:"Dussehra evenings, dressed in warmth",description:"A richer amber-and-wood edit for gatherings, gifting and festive evenings.",status:"published",sourceUrl:"https://www.iirs.gov.in/holidaycalender" },
  { id:"diwali-2026",name:"Diwali",date:"2026-11-08",timezone:"Asia/Kolkata",startDate:"2026-10-29",endDate:"2026-11-08",tags:["festival","gifting","radiant"],primarySlug:"golden-dream",alternativeSlugs:["amber-veil","oud-rose"],headline:"A luminous edit for Diwali",description:"Warm, radiant perfume oils selected for celebration, gifting and the glow of the evening.",status:"published",sourceUrl:"https://www.india.gov.in/calendar?date=2026-11-02" },
  { id:"guru-nanak-gurpurab-2026",name:"Guru Nanak Gurpurab",date:"2026-11-24",timezone:"Asia/Kolkata",startDate:"2026-11-14",endDate:"2026-11-24",tags:["reflection","soft","grace"],primarySlug:"safaa-musk",alternativeSlugs:["musk-rizali","white-oud"],headline:"A quiet, graceful Gurpurab edit",description:"Soft, close-wearing oils chosen for reflection, family gatherings and thoughtful gifting.",status:"published",sourceUrl:"https://www.india.gov.in/calendar?date=2026-11-02" },
  { id:"christmas-2026",name:"Christmas",date:"2026-12-25",timezone:"Asia/Kolkata",startDate:"2026-12-15",endDate:"2026-12-25",tags:["gifting","warm","gourmand"],primarySlug:"dubai-chocolate",alternativeSlugs:["vanilla-musk","golden-dream"],headline:"Warm gourmand oils for Christmas",description:"Comforting vanilla, amber and gourmand profiles for winter gifting and evening wear.",status:"published",sourceUrl:"https://www.iirs.gov.in/holidaycalender" },
];

export function indiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Kolkata", year:"numeric", month:"2-digit", day:"2-digit" }).format(date);
}

export function activeFestivalRecommendation(dateKey: string) {
  return FESTIVAL_RECOMMENDATIONS.find(item => item.status === "published" && dateKey >= item.startDate && dateKey <= item.endDate) ?? null;
}
