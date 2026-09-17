export type FragranceNotePalette = { light: string; middle: string; deep: string };
export type CatalogueNoteGroups = { top: string[]; heart: string[]; base: string[] } | null | undefined;
export type PrimaryFragranceNotes = { top: string; heart: string; base: string };

// Visual direction only. Note copy always comes from the catalogue product.
export const FRAGRANCE_NOTE_PALETTES = {
  "musk-rizali": { light: "#fff8df", middle: "#e6c875", deep: "#b87324" },
  "vanilla-musk": { light: "#fff3d5", middle: "#d8bd94", deep: "#c99b43" },
  "white-oud": { light: "#fff8e8", middle: "#ead5a5", deep: "#769579" },
  "oud-rose": { light: "#e5a0a8", middle: "#ad4357", deep: "#6f162c" },
  "junoon": { light: "#e8bd58", middle: "#c96b24", deep: "#741c2b" },
  "red-musk": { light: "#efc06b", middle: "#b86538", deep: "#8d1627" },
  "nazakat": { light: "#f6dfbd", middle: "#e3919c", deep: "#a93f52" },
  "gulnaar": { light: "#fff0cf", middle: "#e6756d", deep: "#b93142" },
  "deer-musk": { light: "#d9b36c", middle: "#9a6334", deep: "#284c37" },
  "afsoon": { light: "#d29155", middle: "#7d1e32", deep: "#3d0919" },
} as const satisfies Record<string, FragranceNotePalette>;

export function fragranceNotePaletteFor(slug: string): FragranceNotePalette | null {
  return FRAGRANCE_NOTE_PALETTES[slug as keyof typeof FRAGRANCE_NOTE_PALETTES] ?? null;
}

export function primaryFragranceNotes(groups: CatalogueNoteGroups): PrimaryFragranceNotes | null {
  const top = groups?.top.find((note) => note.trim())?.trim();
  const heart = groups?.heart.find((note) => note.trim())?.trim();
  const base = groups?.base.find((note) => note.trim())?.trim();
  return top && heart && base ? { top, heart, base } : null;
}
