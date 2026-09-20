import type {Metadata} from "next";

export const DEFAULT_SOCIAL_IMAGE="/og.png";

export function pageMetadata({title,description,path,image=DEFAULT_SOCIAL_IMAGE,imageAlt="Rehmat Panjab concentrated perfume oil",robots}:{title:string;description:string;path:string;image?:string;imageAlt?:string;robots?:Metadata["robots"]}):Metadata{
  const socialTitle=title.toLowerCase().includes("rehmat panjab")?title:`${title} — Rehmat Panjab`;
  return {
    title,
    description,
    alternates:{canonical:path},
    openGraph:{type:"website",siteName:"Rehmat Panjab",title:socialTitle,description,url:path,images:[{url:image,width:1200,height:630,alt:imageAlt}]},
    twitter:{card:"summary_large_image",title:socialTitle,description,images:[image]},
    ...(robots?{robots}:{}),
  };
}
