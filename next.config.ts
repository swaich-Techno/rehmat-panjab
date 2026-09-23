import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/product-images/**" }],
  },
  async redirects(){
    return [{source:"/:path*",has:[{type:"host",value:"rehmat-panjab.vercel.app"}],destination:"https://www.rehmatpanjab.com/:path*",permanent:true}];
  },
};

export default nextConfig;
