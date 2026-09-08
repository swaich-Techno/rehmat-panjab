export function getSiteUrl(){
  const value=process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (value||"https://rehmat-panjab.vercel.app").replace(/\/$/,"");
}
