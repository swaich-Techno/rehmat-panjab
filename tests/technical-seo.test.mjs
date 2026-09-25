import test from "node:test";
import assert from "node:assert/strict";
import {readFile,stat} from "node:fs/promises";

const read=(path)=>readFile(path,"utf8");

test("canonical origin and public metadata never use a Vercel host",async()=>{
  const [site,layout,seo,product]=await Promise.all([read("lib/site-url.ts"),read("app/layout.tsx"),read("lib/seo.ts"),read("app/product/[slug]/page.tsx")]);
  assert.match(site,/https:\/\/www\.rehmatpanjab\.com/);
  assert.doesNotMatch(`${site}${layout}${seo}${product}`,/rehmat-panjab\.vercel\.app/);
  assert.match(layout,/alternates:\{canonical:"\/"\}/);
  assert.match(product,/path:`\/product\/\$\{product\.slug\}`/);
  assert.match(product,/product\.status==="active"\?\{index:true,follow:true\}:\{index:false,follow:true\}/);
});

test("sitemap contains only active public products on the www origin",async()=>{
  const [sitemap,products]=await Promise.all([read("app/sitemap.ts"),read("lib/products.ts")]);
  assert.match(sitemap,/getSiteUrl\(\)/);
  assert.match(sitemap,/filter\(product=>product\.status==="active"\)/);
  assert.doesNotMatch(sitemap,/new Date\(\)/);
  for(const slug of ["musk-rizali","vanilla-musk","white-oud","oud-rose","junoon","red-musk","nazakat","gulnaar","deer-musk","afsoon"])assert.match(products,new RegExp(`slug:"${slug}"`));
  for(const route of ["/admin","/auth","/api","/cart","/my-rehmat"])assert.doesNotMatch(sitemap,new RegExp(`"${route}`));
});

test("robots preserve private-route blocking and advertise the canonical sitemap",async()=>{
  const robots=await read("app/robots.ts");
  for(const route of ["/admin","/auth/","/account/","/api/","/cart","/my-rehmat"])assert.match(robots,new RegExp(route.replaceAll("/","\\/")));
  assert.match(robots,/sitemap: `\$\{origin\}\/sitemap\.xml`/);
});

test("Guide navigation has a real target and route-aware links",async()=>{
  const [header,guide]=await Promise.all([read("app/components/site-header.tsx"),read("app/components/rehmat-guide.tsx")]);
  assert.match(header,/href==="#rehmat-guide"&&pathname!=="\/"\?"\/#rehmat-guide":href/);
  assert.match(guide,/id="rehmat-guide"/);
  assert.match(guide,/window\.location\.hash==="#rehmat-guide"/);
});

test("brand icons and structured data are explicit and factual",async()=>{
  const [home,collection,product,icon,apple]=await Promise.all([read("app/page.tsx"),read("app/collection/page.tsx"),read("app/product/[slug]/page.tsx"),stat("app/icon.png"),stat("app/apple-icon.png")]);
  assert.ok(icon.size>0);assert.ok(apple.size>0);
  assert.match(home,/"@type":"Organization"/);assert.match(home,/"@type":"WebSite"/);
  assert.match(collection,/"@type":"CollectionPage"/);assert.match(collection,/"@type":"ItemList"/);
  assert.match(product,/"@type":"ProductGroup"/);assert.match(product,/"@type":"Product"/);assert.match(product,/"@type":"Offer"/);assert.match(product,/priceCurrency:variant\.currency/);assert.match(product,/brand:\{"@type":"Brand",name:"Rehmat Panjab"\}/);
  assert.doesNotMatch(`${home}${collection}${product}`,/priceValidUntil|gtin|mpn/);
});

test("public metadata is unique and images retain stable geometry",async()=>{
  const paths=["app/page.tsx","app/collection/page.tsx","app/discover/page.tsx","app/contact/page.tsx","app/find-your-scent/page.tsx","app/create-your-fragrance/page.tsx","app/next-drop/page.tsx","app/layer/page.tsx"];
  const sources=await Promise.all(paths.map(read));
  const descriptions=sources.map(source=>source.match(/description:"([^"]+)"/)?.[1]).filter(Boolean);
  assert.equal(new Set(descriptions).size,paths.length);
  const [hero,media,css]=await Promise.all([read("app/components/homepage-campaign.tsx"),read("app/components/product-media.tsx"),read("app/globals.css")]);
  assert.match(hero,/width="1731"/);assert.match(hero,/height="909"/);
  assert.match(hero,/width="1200"/);assert.match(hero,/height="1500"/);
  assert.match(hero,/width="960"/);assert.match(hero,/height="1200"/);
  assert.equal((hero.match(/unoptimized/g)??[]).length,4);
  assert.match(media,/width=\{notesConfirmed\?960:1122\}/);assert.match(media,/height=\{notesConfirmed\?1200:1402\}/);assert.match(media,/unoptimized/);assert.match(media,/sizes=/);assert.match(css,/\.product-media[^}]*aspect-ratio: 4 \/ 5/s);
});
