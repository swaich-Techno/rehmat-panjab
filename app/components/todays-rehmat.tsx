import type { StorefrontProduct } from "../../lib/catalog";
import { todaysRehmat } from "../../lib/daily-rehmat";
import { CinematicToday } from "./cinematic-today";

export function TodaysRehmat({ products }: { products: StorefrontProduct[] }) {
  const edit = todaysRehmat(products);
  if (!edit.products.length) return null;
  return <CinematicToday
    product={edit.products[0]}
    alternatives={edit.products.slice(1, 3)}
    eyebrow={edit.festival ? `${edit.festival.name} edit · ${edit.weekday}` : `${edit.weekday} edit`}
    headline={edit.headline}
    description={edit.description}
    scene={edit.scene}
  />;
}
