export type FragranceNotePalette = { light: string; middle: string; deep: string };
export type CatalogueNoteGroups = { top: string[]; heart: string[]; base: string[] } | null | undefined;
export type PrimaryFragranceNotes = { top: string; heart: string; base: string };
export type FragranceIngredientVisual = { note: string; key: string; asset: string };

// Visual direction only. Note copy always comes from the catalogue product.
export const FRAGRANCE_NOTE_PALETTES = {
  "musk-rizali": { light: "#fffdf2", middle: "#ead9a8", deep: "#b9944c" },
  "vanilla-musk": { light: "#fff0a8", middle: "#e1b946", deep: "#9b6927" },
  "white-oud": { light: "#f9fdff", middle: "#eee0ae", deep: "#a69058" },
  "oud-rose": { light: "#fff1dc", middle: "#d69b88", deep: "#9b5360" },
  "junoon": { light: "#e8bd58", middle: "#c96b24", deep: "#741c2b" },
  "red-musk": { light: "#fff0d9", middle: "#ca786b", deep: "#821d31" },
  "nazakat": { light: "#fff0b8", middle: "#e7a49e", deep: "#a65a6b" },
  "gulnaar": { light: "#ffe0a1", middle: "#e88739", deep: "#a63b22" },
  "deer-musk": { light: "#c7a56a", middle: "#705338", deep: "#171718" },
  "afsoon": { light: "#d57b68", middle: "#7d1e32", deep: "#2d0610" },
} as const satisfies Record<string, FragranceNotePalette>;

const ingredientAsset = (key: string) => `/images/fragrance-notes/${key}.webp`;

// The note strings are verification gates. Visible and accessible copy still comes from product.notes.
export const FRAGRANCE_INGREDIENT_VISUALS = {
  "musk-rizali": [["Bergamot", "bergamot-slice"], ["Saffron", "saffron-threads"], ["White Musk", "white-musk-orb"]],
  "vanilla-musk": [["Vanilla Bean", "vanilla-pod"], ["Almond", "almonds"], ["White Musk", "white-musk-orb"]],
  "white-oud": [["White Pepper", "white-peppercorns"], ["Bergamot", "bergamot-slice"], ["Soft Woods", "wood-chips"]],
  "oud-rose": [["Rose Petals", "rose-petals"], ["Pink Pepper", "pink-peppercorns"], ["Raspberry", "raspberries"]],
  "junoon": [["Passionfruit", "passionfruit"], ["Turkish Rose", "rose-petals"], ["Saffron", "saffron-threads"]],
  "red-musk": [["Red Berries", "red-berries"], ["Saffron", "saffron-threads"], ["White Musk", "white-musk-orb"]],
  "nazakat": [["Lychee", "lychee"], ["Rhubarb", "rhubarb"], ["Bergamot", "bergamot-slice"]],
  "gulnaar": [["Candied Pear", "candied-pear"], ["Strawberry", "strawberries"], ["Vanilla", "vanilla-pod"]],
  "deer-musk": [["Cardamom", "cardamom-pods"], ["Bergamot", "bergamot-slice"], ["Velvet Musk", "velvet-musk-dark"]],
  "afsoon": [["Dark Cherry", "dark-cherries"], ["Red Berries", "red-berries"], ["Velvet Musk", "velvet-musk-burgundy"]],
} as const satisfies Record<string, readonly (readonly [string, string])[]>;

export function fragranceNotePaletteFor(slug: string): FragranceNotePalette | null {
  return FRAGRANCE_NOTE_PALETTES[slug as keyof typeof FRAGRANCE_NOTE_PALETTES] ?? null;
}

export function primaryFragranceNotes(groups: CatalogueNoteGroups): PrimaryFragranceNotes | null {
  const top = groups?.top.find((note) => note.trim())?.trim();
  const heart = groups?.heart.find((note) => note.trim())?.trim();
  const base = groups?.base.find((note) => note.trim())?.trim();
  return top && heart && base ? { top, heart, base } : null;
}

export function ingredientVisualsFor(slug: string, groups: CatalogueNoteGroups): FragranceIngredientVisual[] {
  const notes = primaryFragranceNotes(groups);
  const configured = FRAGRANCE_INGREDIENT_VISUALS[slug as keyof typeof FRAGRANCE_INGREDIENT_VISUALS];
  if (!notes || !configured) return [];
  const actual = [notes.top, notes.heart, notes.base];
  return configured.flatMap(([note, key], index) => actual[index]?.localeCompare(note, undefined, { sensitivity: "accent" }) === 0
    ? [{ note: actual[index], key, asset: ingredientAsset(key) }]
    : []);
}
