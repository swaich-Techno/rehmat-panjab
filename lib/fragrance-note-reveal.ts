export type FragranceNotePalette = { light: string; middle: string; deep: string };
export type CatalogueNoteGroups = { top: string[]; heart: string[]; base: string[] } | null | undefined;
export type FragranceIngredientVisual = { note: string; key: string; asset: string; tier: "top" | "heart" | "base"; index: number; count: number };

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
  "amber-veil": { light: "#fff1b8", middle: "#d59b47", deep: "#684326" },
  "velvet-oud": { light: "#f7dfd9", middle: "#a65c64", deep: "#3b2029" },
  "purple-oud": { light: "#e5d4ed", middle: "#72507d", deep: "#2d2038" },
  "golden-dream": { light: "#fff1b0", middle: "#d89a35", deep: "#805126" },
  "dubai-chocolate": { light: "#e5b77d", middle: "#8b4d2e", deep: "#351c18" },
  "mahnoor": { light: "#f6d5b4", middle: "#c34f72", deep: "#6f173b" },
  "milaap": { light: "#ead9bd", middle: "#b77945", deep: "#7c3948" },
  "sukoon-oud": { light: "#bf8750", middle: "#71322c", deep: "#2e1715" },
  "shaan-oud": { light: "#b79864", middle: "#675069", deep: "#241b19" },
  "samandar": { light: "#d3bd62", middle: "#48b8b8", deep: "#12577a" },
  "neel": { light: "#fff9dc", middle: "#e2c948", deep: "#2c61a1" },
  "ishq": { light: "#f7ead8", middle: "#eaa09a", deep: "#c86d6f" },
  "siyah-oud": { light: "#be784d", middle: "#713945", deep: "#292729" },
  "safaa-musk": { light: "#fffdf5", middle: "#e4ddcf", deep: "#a8a8a4" },
  "adaa": { light: "#e3bd76", middle: "#cb426b", deep: "#8c214c" },
} as const satisfies Record<string, FragranceNotePalette>;

const ingredientAsset = (key: string) => `/images/fragrance-notes/${key}.webp`;

const NOTE_ASSET_KEYS: Record<string, string> = {
  almond: "almonds", almonds: "almonds", amber: "amber-resin", "sweet amber": "amber-resin", "warm amber": "amber-resin",
  bergamot: "bergamot-slice", "cedar": "wood-chips", cedarwood: "wood-chips", "soft woods": "wood-chips", "smoky woods": "wood-chips", woods: "wood-chips",
  caramel: "caramel", cardamom: "cardamom-pods", chocolate: "dark-chocolate", "dark cherry": "dark-cherries",
  "dark oud": "wood-chips", oud: "wood-chips", hazelnut: "hazelnuts", hazelnuts: "hazelnuts", jasmine: "jasmine-sambac",
  lychee: "lychee", passionfruit: "passionfruit", "pink pepper": "pink-peppercorns", raspberry: "raspberries",
  "red berries": "red-berries", rhubarb: "rhubarb", rose: "rose-petals", "rose petals": "rose-petals", "soft rose": "rose-petals", "turkish rose": "rose-petals",
  saffron: "saffron-threads", strawberry: "strawberries", vanilla: "vanilla-pod", "vanilla bean": "vanilla-pod",
  "white musk": "white-musk-orb", musk: "white-musk-orb", "creamy musk": "white-musk-orb", "velvet musk": "velvet-musk-dark",
  "white pepper": "white-peppercorns", "warm spice": "cardamom-pods",
};

const normalizedNote = (note: string) => note.trim().toLocaleLowerCase("en-IN");

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
  "amber-veil": [["Saffron", "saffron-threads"], ["Jasmine", "jasmine-sambac"], ["Cedarwood", "wood-chips"]],
  "velvet-oud": [["Soft Rose", "rose-petals"], ["Oud", "wood-chips"], ["Vanilla", "vanilla-pod"]],
  "purple-oud": [["Warm Spice", "cardamom-pods"], ["Dark Oud", "wood-chips"], ["Amber", "amber-resin"]],
  "golden-dream": [["Vanilla", "vanilla-pod"], ["Caramel", "caramel"], ["Amber", "amber-resin"]],
  "dubai-chocolate": [["Chocolate", "dark-chocolate"], ["Vanilla", "vanilla-pod"], ["Hazelnut", "hazelnuts"]],
} as const satisfies Record<string, readonly (readonly [string, string])[]>;

export function fragranceNotePaletteFor(slug: string): FragranceNotePalette | null {
  return FRAGRANCE_NOTE_PALETTES[slug as keyof typeof FRAGRANCE_NOTE_PALETTES] ?? null;
}

export function ingredientVisualsFor(slug: string, groups: CatalogueNoteGroups): FragranceIngredientVisual[] {
  const notes = groups && groups.top.some(note => note.trim()) && groups.heart.some(note => note.trim()) && groups.base.some(note => note.trim()) ? groups : null;
  const configured = FRAGRANCE_INGREDIENT_VISUALS[slug as keyof typeof FRAGRANCE_INGREDIENT_VISUALS];
  if (!notes) return [];
  const configuredByNote = new Map((configured ?? []).map(([note, key]) => [normalizedNote(note), key]));
  return (["base", "heart", "top"] as const).flatMap(tier => {
    const tierNotes = notes[tier].map(note => note.trim()).filter(Boolean);
    return tierNotes.flatMap((note, index) => {
      const key = configuredByNote.get(normalizedNote(note)) ?? NOTE_ASSET_KEYS[normalizedNote(note)];
      return key ? [{ note, key, asset: ingredientAsset(key), tier, index, count: tierNotes.length }] : [];
    });
  });
}

export function hasCompleteIngredientVisuals(groups: CatalogueNoteGroups, visuals: FragranceIngredientVisual[]) {
  if (!groups) return false;
  const expected = [...groups.top, ...groups.heart, ...groups.base].filter(note => note.trim()).length;
  return expected >= 3 && visuals.length === expected;
}
