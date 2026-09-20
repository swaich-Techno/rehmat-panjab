export const CANONICAL_SITE_URL = "https://www.rehmatpanjab.com";

export function getSiteUrl(){
  const value=process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if(!value)return CANONICAL_SITE_URL;
  try{
    const parsed=new URL(value);
    return parsed.origin===CANONICAL_SITE_URL?CANONICAL_SITE_URL:CANONICAL_SITE_URL;
  }catch{
    return CANONICAL_SITE_URL;
  }
}
