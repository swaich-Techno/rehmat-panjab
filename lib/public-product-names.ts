const publicProductNames: Record<string, string> = {
  junoon: "Oud Maracuja",
  nazakat: "Delina",
  gulnaar: "Zara Candy",
  afsoon: "Vampire Blood",
  "amber-veil": "BR540",
  "velvet-oud": "Oud Satin Mood",
  "purple-oud": "Purple Oud",
  "golden-dream": "Golden Dream",
  "dubai-chocolate": "Dubai Chocolate",
  mahnoor: "Moon Paris",
  milaap: "Wisal",
  "sukoon-oud": "Oud Mood",
  "shaan-oud": "Oud for Glory",
  samandar: "Acqua di Giò",
  neel: "Light Blue",
  ishq: "Love Spell",
  "siyah-oud": "Black Oud",
  "safaa-musk": "Musk Al Tahara",
  adaa: "Bombshell",
};

export function publicProductName(slug: string, fallback: string) {
  return publicProductNames[slug] ?? fallback;
}
