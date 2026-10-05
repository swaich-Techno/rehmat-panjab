export type ApprovedNotePyramid = { top: string[]; heart: string[]; base: string[] };

// Mirrors owner-approved additive migrations so verified notes remain available
// when a local or preview database has not applied the latest catalogue migration.
export const approvedFragranceNotes: Record<string, ApprovedNotePyramid> = {
  "musk-rizali": { top: ["Bergamot"], heart: ["Saffron"], base: ["White Musk"] },
  "vanilla-musk": { top: ["Vanilla Bean"], heart: ["Almond"], base: ["White Musk"] },
  "white-oud": { top: ["White Pepper"], heart: ["Bergamot"], base: ["Soft Woods"] },
  "oud-rose": { top: ["Rose Petals"], heart: ["Pink Pepper"], base: ["Raspberry"] },
  junoon: { top: ["Passionfruit"], heart: ["Turkish Rose"], base: ["Saffron"] },
  "red-musk": { top: ["Red Berries"], heart: ["Saffron"], base: ["White Musk"] },
  nazakat: { top: ["Lychee"], heart: ["Rhubarb"], base: ["Bergamot"] },
  gulnaar: { top: ["Candied Pear"], heart: ["Strawberry"], base: ["Vanilla"] },
  "deer-musk": { top: ["Cardamom"], heart: ["Bergamot"], base: ["Velvet Musk"] },
  afsoon: { top: ["Dark Cherry", "Plum", "Velvet Rose"], heart: ["Red Berries", "Dark Floral Accord", "Warm Saffron", "Amber"], base: ["Velvet Musk", "Sandalwood", "Vanilla", "Warm Woods", "Soft Amber"] },
  "amber-veil": { top: ["Saffron", "Sweet Amber"], heart: ["Jasmine"], base: ["Cedarwood", "Warm Amber", "Soft Woods"] },
  "velvet-oud": { top: ["Soft Rose"], heart: ["Oud"], base: ["Vanilla", "White Musk"] },
  "purple-oud": { top: ["Warm Spice"], heart: ["Dark Oud"], base: ["Amber", "Smoky Woods"] },
  "golden-dream": { top: ["Vanilla"], heart: ["Caramel"], base: ["Amber", "Creamy Musk"] },
  "dubai-chocolate": { top: ["Chocolate"], heart: ["Vanilla"], base: ["Hazelnut", "Warm Amber"] },
};

export function approvedNotesForSlug(slug: string) {
  return approvedFragranceNotes[slug] ?? null;
}
