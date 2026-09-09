"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "../../lib/cart";
import { availabilityLabel, firstPrice, hasAvailableStock, suitabilityLabels, type StorefrontProduct } from "../../lib/catalog";
import { ProductMedia } from "../components/product-media";

export function CollectionCatalogue({ products }: { products: StorefrontProduct[] }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [character, setCharacter] = useState("all");
  const [suitability, setSuitability] = useState("all");
  const [size, setSize] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");
  const families = [...new Set(products.flatMap((product) => product.scentFamily ? [product.scentFamily] : []))].sort();
  const characters = [...new Set(products.flatMap((product) => product.character))].sort();
  const sizes = [...new Set(products.flatMap((product) => product.enabledSizes))].sort((a, b) => a - b);

  const normalized = query.trim().toLowerCase();
  const maximum = maxPrice ? Number(maxPrice) * 100 : null;
  const filtered = products.filter((product) => {
      const price = firstPrice(product);
      if (normalized && ![product.name, product.subtitle, product.scentFamily, suitabilityLabels[product.suitability], product.suitabilityNote, ...product.character, ...product.searchAliases].filter(Boolean).join(" ").toLowerCase().includes(normalized)) return false;
      if (family !== "all" && product.scentFamily !== family) return false;
      if (character !== "all" && !product.character.includes(character)) return false;
      if (suitability !== "all" && product.suitability !== suitability) return false;
      if (size !== "all" && !product.enabledSizes.includes(Number(size))) return false;
      if (availability === "available" && !hasAvailableStock(product)) return false;
      if (availability === "coming_soon" && product.status !== "coming_soon") return false;
      if (availability === "sold_out" && (product.status === "coming_soon" || hasAvailableStock(product))) return false;
      if (maximum !== null && (price === null || price > maximum)) return false;
      return true;
  }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      if (sort === "price-low") return (firstPrice(a) ?? Number.MAX_SAFE_INTEGER) - (firstPrice(b) ?? Number.MAX_SAFE_INTEGER);
      if (sort === "price-high") return (firstPrice(b) ?? -1) - (firstPrice(a) ?? -1);
      return Number(b.featured) - Number(a.featured) || a.number.localeCompare(b.number);
  });

  return (
    <>
      <section className="catalogue-controls" aria-label="Filter the collection">
        <div className="catalogue-search"><label htmlFor="catalogue-search">Search</label><input id="catalogue-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, family, or character" /></div>
        <div><label htmlFor="catalogue-family">Family</label><select id="catalogue-family" value={family} onChange={(event) => setFamily(event.target.value)}><option value="all">All families</option>{families.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
        <div><label htmlFor="catalogue-character">Character</label><select id="catalogue-character" value={character} onChange={(event) => setCharacter(event.target.value)}><option value="all">All characters</option>{characters.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
        <div><label htmlFor="catalogue-suitability">Suitability</label><select id="catalogue-suitability" value={suitability} onChange={(event) => setSuitability(event.target.value)}><option value="all">All</option><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option></select></div>
        <div><label htmlFor="catalogue-size">Size</label><select id="catalogue-size" value={size} onChange={(event) => setSize(event.target.value)}><option value="all">All sizes</option>{sizes.map((value) => <option value={value} key={value}>{value} ml</option>)}</select></div>
        <div><label htmlFor="catalogue-availability">Availability</label><select id="catalogue-availability" value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="coming_soon">Launching soon</option><option value="sold_out">Sold out</option></select></div>
        <div><label htmlFor="catalogue-price">Maximum price</label><input id="catalogue-price" type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="₹" /></div>
        <div><label htmlFor="catalogue-sort">Sort</label><select id="catalogue-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></div>
        <p aria-live="polite">{filtered.length} {filtered.length === 1 ? "oil" : "oils"}</p>
      </section>
      <section className="collection-list" aria-label="Rehmat fragrances">
        {filtered.length ? filtered.map((product, index) => {
          const price = firstPrice(product);
          const pricedVariant=product.variants.filter(item=>item.pricePaise!==null).sort((a,b)=>(a.pricePaise??0)-(b.pricePaise??0))[0];
          return <article className={`collection-product layout-${index % 2 ? "right" : "left"}`} key={product.databaseId ?? product.id}>
            <Link className="collection-media-link" href={`/product/${product.slug}`} data-cursor="VIEW"><ProductMedia product={product} priority={index === 0} /></Link>
            <div className="collection-copy">
              <div className="number-rule"><span>{product.number}</span><i /></div>
              <h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2>
              {product.inspirationLine && <p className="product-inspiration">{product.inspirationLine}</p>}
              <p className="product-subtitle">{product.subtitle}</p><p>{product.atmosphere}</p>
              <p className="product-suitability"><span>{suitabilityLabels[product.suitability]}</span>{product.suitabilityNote && <> · {product.suitabilityNote}</>}</p>
              <ul aria-label="Scent character">{product.character.map((word) => <li key={word}>{word}</li>)}</ul>
              <div className="collection-price">{pricedVariant?.promotionalLabel && <span>{pricedVariant.promotionalLabel}</span>}<strong>{price === null ? "Contact for price" : <>{pricedVariant?.normalPricePaise&&<del>{formatMoney(pricedVariant.normalPricePaise)}</del>} From {formatMoney(price)} {pricedVariant?.normalPricePaise&&<small>Save {formatMoney(pricedVariant.normalPricePaise-price)}</small>}</>}</strong></div>
              <div className="collection-actions"><span className={`status-dot status-${hasAvailableStock(product) ? "active" : "sold_out"}`}>{availabilityLabel(product)}</span><Link className="text-link" href={`/product/${product.slug}`} data-cursor="VIEW">Enter the atmosphere ↗</Link></div>
            </div>
          </article>;
        }) : <div className="catalogue-empty"><div className="empty-drop" aria-hidden="true" /><h2>No oils match.</h2><p>Clear or widen the filters to return to the full collection.</p><button className="button button-outline" type="button" onClick={() => { setQuery(""); setFamily("all"); setCharacter("all"); setSuitability("all"); setSize("all"); setAvailability("all"); setMaxPrice(""); }}>Clear filters</button></div>}
      </section>
    </>
  );
}
