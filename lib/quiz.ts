import type { ScentId } from "./products";

export type QuizOption = {
  id: string;
  label: string;
  feeling: string[];
  tint: string;
  scores: Partial<Record<ScentId, number>>;
};

export type QuizQuestion = { id: string; prompt: string; kicker: string; options: QuizOption[] };

export const quizQuestions: QuizQuestion[] = [
  {
    id: "entrance", kicker: "First instinct", prompt: "How should your fragrance enter a room?", options: [
      { id: "whisper", label: "A whisper", feeling: ["Soft", "Close", "Quiet"], tint: "#dce5dc", scores: { musk: 4, "white-oud": 2 } },
      { id: "glow", label: "A warm glow", feeling: ["Golden", "Warm", "Slow"], tint: "#d4a764", scores: { vanilla: 4, saffron: 3 } },
      { id: "trace", label: "A velvet trace", feeling: ["Deep", "Floral", "Lingering"], tint: "#b26a70", scores: { "oud-rose": 4, saffron: 2 } },
    ],
  },
  {
    id: "texture", kicker: "Texture", prompt: "Which surface feels most like you?", options: [
      { id: "glass", label: "Cool glass", feeling: ["Clear", "Bright", "Clean"], tint: "#d9e2d6", scores: { musk: 3, "white-oud": 4 } },
      { id: "velvet", label: "Warm velvet", feeling: ["Soft", "Creamy", "Comforting"], tint: "#d6aa75", scores: { vanilla: 4, "oud-rose": 1 } },
      { id: "wood", label: "Polished wood", feeling: ["Dry", "Warm", "Grounded"], tint: "#8a5e3b", scores: { saffron: 4, "white-oud": 2 } },
    ],
  },
  {
    id: "light", kicker: "Light", prompt: "Choose the hour your scent belongs to.", options: [
      { id: "morning", label: "Pale morning", feeling: ["Airy", "New", "Luminous"], tint: "#ebe9d5", scores: { "white-oud": 4, musk: 3 } },
      { id: "golden", label: "Golden hour", feeling: ["Radiant", "Honeyed", "Open"], tint: "#ce9950", scores: { vanilla: 3, saffron: 3 } },
      { id: "night", label: "After dark", feeling: ["Intimate", "Rich", "Magnetic"], tint: "#653a37", scores: { "oud-rose": 4, saffron: 3 } },
    ],
  },
  {
    id: "memory", kicker: "Memory", prompt: "What should linger after you leave?", options: [
      { id: "clean", label: "Clean skin", feeling: ["Familiar", "Soft", "Close"], tint: "#d6dfd7", scores: { musk: 5 } },
      { id: "comfort", label: "Quiet comfort", feeling: ["Warm", "Calm", "Tender"], tint: "#d5b58c", scores: { vanilla: 5 } },
      { id: "mystery", label: "A little mystery", feeling: ["Shadowed", "Deep", "Unsaid"], tint: "#6f4637", scores: { saffron: 4, "oud-rose": 3 } },
    ],
  },
  {
    id: "contrast", kicker: "Contrast", prompt: "Which tension draws you in?", options: [
      { id: "bright-dry", label: "Bright / dry", feeling: ["Crisp", "Wooded", "Still"], tint: "#dad8c4", scores: { "white-oud": 5 } },
      { id: "soft-deep", label: "Soft / deep", feeling: ["Layered", "Warm", "Smooth"], tint: "#a8664f", scores: { saffron: 4, vanilla: 2 } },
      { id: "floral-dark", label: "Floral / dark", feeling: ["Petalled", "Velvet", "Wooded"], tint: "#a64f5a", scores: { "oud-rose": 5 } },
    ],
  },
  {
    id: "radius", kicker: "Presence", prompt: "How close should it stay?", options: [
      { id: "only-me", label: "Mostly for me", feeling: ["Private", "Subtle", "Skin-close"], tint: "#d7dfd5", scores: { musk: 4, vanilla: 2 } },
      { id: "nearby", label: "For someone nearby", feeling: ["Warm", "Inviting", "Near"], tint: "#ba835a", scores: { vanilla: 3, saffron: 2 } },
      { id: "remembered", label: "Just remembered", feeling: ["Distinct", "Poised", "Lasting"], tint: "#8a4e50", scores: { "oud-rose": 3, "white-oud": 3 } },
    ],
  },
];

export function scoreQuiz(answerIds: string[]) {
  const totals: Record<ScentId, number> = { musk: 0, vanilla: 0, saffron: 0, "white-oud": 0, "oud-rose": 0 };
  const chosen = quizQuestions.flatMap((question) => question.options).filter((option) => answerIds.includes(option.id));
  chosen.forEach((option) => Object.entries(option.scores).forEach(([id, score]) => { totals[id as ScentId] += score ?? 0; }));
  return Object.entries(totals).sort((a, b) => b[1] - a[1]) as [ScentId, number][];
}
