import type { ScentId } from "./products";

export type QuizOption = { id: string; label: string; feeling: string[]; scores: Partial<Record<ScentId, number>> };
export type QuizQuestion = { id: string; prompt: string; kicker: string; multiple?: boolean; limit?: number; optional?: boolean; options: QuizOption[] };
const o = (id: string, label: string, feeling: string[], scores: QuizOption["scores"]): QuizOption => ({ id, label, feeling, scores });

export const quizQuestions: QuizQuestion[] = [
  { id:"feel",kicker:"01 · First instinct",prompt:"How do you want your fragrance to feel?",options:[
    o("soft","Soft and comforting",["Soft","Comforting"],{musk:5,vanilla:3}),o("warm","Warm and inviting",["Warm","Inviting"],{vanilla:5,saffron:2}),o("bold","Bold and confident",["Bold","Confident"],{saffron:5,"oud-rose":2}),o("elegant","Elegant and refined",["Elegant","Refined"],{"white-oud":4,musk:2}),o("mysterious","Mysterious and deep",["Deep","Mysterious"],{saffron:4,"oud-rose":3}),o("fresh","Fresh and composed",["Clean","Composed"],{"white-oud":5,musk:3}),o("romantic","Romantic and expressive",["Romantic","Expressive"],{"oud-rose":5}),o("calm","Calm and spiritual",["Calm","Quiet"],{musk:5,"white-oud":2})]},
  { id:"character",kicker:"02 · Character",prompt:"Which fragrance character attracts you most?",options:[
    o("musky","Musky",["Musky"],{musk:5,vanilla:3}),o("sweet","Sweet",["Sweet"],{vanilla:5}),o("woody","Woody",["Woody"],{"white-oud":4,saffron:4}),o("floral","Floral",["Floral"],{"oud-rose":5}),o("amber","Amber",["Amber"],{saffron:5}),o("oud","Oud",["Oud"],{saffron:4,"white-oud":3,"oud-rose":4}),o("powdery","Powdery",["Soft"],{musk:4,vanilla:2}),o("spicy","Warm and spicy",["Warm","Spiced"],{saffron:5})]},
  { id:"wear",kicker:"03 · Occasion",prompt:"When will you wear it most?",multiple:true,limit:4,options:[
    o("everyday","Everyday",["Everyday"],{musk:4,vanilla:3,"white-oud":3}),o("work","Work",["Composed"],{"white-oud":5,musk:3}),o("evening","Evening",["Evening"],{saffron:4,"oud-rose":4}),o("weddings","Weddings",["Celebration"],{saffron:5,"oud-rose":5}),o("special","Special occasions",["Special"],{saffron:4,"oud-rose":4}),o("reflection","Prayer or reflection",["Reflective"],{musk:5,"white-oud":2}),o("social","Social gatherings",["Social"],{vanilla:3,"oud-rose":3}),o("gifting","Gifting",["Gift"],{musk:2,vanilla:2,"white-oud":2,"oud-rose":2}),o("varied","Different occasions",["Versatile"],{musk:3,"white-oud":3})]},
  { id:"strength",kicker:"04 · Presence",prompt:"How strong should it feel?",options:[
    o("very-soft","Very soft and close to the skin",["Very soft"],{musk:5}),o("gentle","Gentle but noticeable",["Gentle"],{musk:4,vanilla:3}),o("balanced","Balanced",["Balanced"],{"white-oud":4,vanilla:2}),o("rich","Rich and expressive",["Rich"],{saffron:5,"oud-rose":3}),o("bold","Bold and memorable",["Bold"],{saffron:5,"oud-rose":4}),o("depends","It depends on the occasion",["Adaptable"],{musk:2,"white-oud":2,saffron:2})]},
  { id:"atmosphere",kicker:"05 · Atmosphere",prompt:"Which atmosphere feels most like you?",options:[
    o("morning","A quiet morning",["Quiet","Morning"],{musk:5,"white-oud":3}),o("warm-evening","A warm evening",["Warm","Evening"],{vanilla:4,saffron:3}),o("formal","A formal gathering",["Formal"],{"white-oud":4,saffron:4}),o("celebration","A joyful celebration",["Joyful"],{"oud-rose":4,saffron:4}),o("private","A peaceful private moment",["Private"],{musk:5,vanilla:2}),o("romance","A romantic occasion",["Romantic"],{"oud-rose":5,vanilla:2}),o("night","A luxurious night",["Luxurious"],{saffron:5,"oud-rose":3}),o("beginning","A fresh new beginning",["Fresh"],{"white-oud":5,musk:2})]},
  { id:"style",kicker:"06 · Personal style",prompt:"Which qualities describe your style?",multiple:true,limit:3,options:[
    o("minimal","Minimal",["Minimal"],{musk:4,"white-oud":3}),o("traditional","Traditional",["Traditional"],{saffron:3,"oud-rose":3}),o("modern","Modern",["Modern"],{"white-oud":4}),o("elegant","Elegant",["Elegant"],{"oud-rose":3,"white-oud":3}),o("bold","Bold",["Bold"],{saffron:5}),o("romantic","Romantic",["Romantic"],{"oud-rose":5}),o("spiritual","Spiritual",["Spiritual"],{musk:5}),o("artistic","Artistic",["Artistic"],{"oud-rose":3,saffron:2}),o("understated","Understated",["Understated"],{musk:4,"white-oud":4}),o("luxurious","Luxurious",["Luxurious"],{saffron:5,"oud-rose":3})]},
  { id:"sweetness",kicker:"07 · Sweetness",prompt:"Which type of sweetness do you prefer?",options:[
    o("none","No noticeable sweetness",["Dry"],{"white-oud":5,musk:3}),o("creamy","Soft and creamy",["Creamy"],{vanilla:5,musk:2}),o("subtle","Warm and subtle",["Subtle warmth"],{musk:3,vanilla:3}),o("floral","Floral sweetness",["Floral"],{"oud-rose":5}),o("indulgent","Rich and indulgent",["Rich sweetness"],{vanilla:4,saffron:3}),o("unsure","I am unsure",["Open"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1})]},
  { id:"oud",kicker:"08 · Oud",prompt:"How do you feel about oud?",options:[
    o("light","I prefer a light introduction",["Light oud"],{"white-oud":5}),o("smooth","I enjoy smooth oud",["Smooth oud"],{"white-oud":5}),o("deep","I prefer rich and deep oud",["Deep oud"],{saffron:5,"oud-rose":3}),o("musk","I want oud softened with musk",["Soft oud"],{musk:4,"white-oud":3}),o("florals","I want oud balanced with florals",["Floral oud"],{"oud-rose":5}),o("avoid","I would rather avoid oud",["No oud"],{musk:5,vanilla:5}),o("new","I have not tried it before",["Curious"],{"white-oud":4,musk:2})]},
  { id:"season",kicker:"09 · Season",prompt:"Which season or weather matches your preference?",options:[
    o("summer","Warm summer days",["Summer"],{musk:4,"white-oud":4}),o("summer-evening","Cooler summer evenings",["Summer evening"],{vanilla:3,"oud-rose":2}),o("spring","Spring",["Spring"],{musk:3,"oud-rose":3}),o("autumn","Autumn",["Autumn"],{saffron:4,vanilla:3}),o("winter","Winter",["Winter"],{saffron:5,vanilla:4}),o("all","All seasons",["All season"],{musk:4,"white-oud":4}),o("depends","It depends on the occasion",["Adaptable"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1})]},
  { id:"memory",kicker:"10 · Memory",prompt:"What should people remember about your fragrance?",options:[
    o("comfort","Its comforting softness",["Comforting"],{musk:5,vanilla:3}),o("grace","Its graceful elegance",["Graceful"],{"white-oud":4,"oud-rose":4}),o("warmth","Its warm presence",["Warm"],{vanilla:4,saffron:3}),o("depth","Its confident depth",["Confident"],{saffron:5}),o("romance","Its romantic character",["Romantic"],{"oud-rose":5}),o("clean","Its clean simplicity",["Clean"],{musk:4,"white-oud":5}),o("unusual","Its unusual personality",["Distinctive"],{saffron:3,"oud-rose":3}),o("quiet","Its quiet sophistication",["Quiet sophistication"],{musk:4,"white-oud":4})]},
  { id:"format",kicker:"11 · Direction",prompt:"Would you like a single fragrance or layering idea?",options:[
    o("single","One signature fragrance",["Signature"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1}),o("two","A simple two-fragrance layer",["Two layers"],{musk:2,vanilla:2,"white-oud":2}),o("three","A richer three-fragrance layer",["Three layers"],{saffron:2,"oud-rose":2}),o("both","Show both single and layered options",["Both"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1}),o("decide","Let the guide decide",["Guided"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1})]},
  { id:"recipient",kicker:"12 · Recipient",prompt:"Who is this fragrance journey for?",options:[
    o("self","Myself",["Personal"],{}),o("partner","A partner",["Partner gift"],{"oud-rose":2,vanilla:1}),o("family","A family member",["Family gift"],{musk:2,"white-oud":1}),o("friend","A friend",["Friend gift"],{musk:1,vanilla:1,"white-oud":1}),o("wedding","A wedding gift",["Wedding gift"],{saffron:3,"oud-rose":3}),o("gift","Another special gift",["Special gift"],{musk:1,vanilla:1,saffron:1,"white-oud":1,"oud-rose":1})]},
];

export type QuizAnswers = Record<string, string[]>;
export function scoreQuiz(answers: QuizAnswers) {
  const totals: Record<ScentId, number> = { musk:0, vanilla:0, saffron:0, "white-oud":0, "oud-rose":0, junoon:0, "red-musk":0, nazakat:0, "zara-candy":0, "deer-musk":0 };
  for (const question of quizQuestions) for (const option of question.options) if (answers[question.id]?.includes(option.id)) {
    for (const [id, score] of Object.entries(option.scores)) totals[id as ScentId] += score ?? 0;
  }
  totals.junoon += totals.saffron;
  totals["red-musk"] += Math.round(totals.junoon * .45);
  totals.nazakat += Math.round(totals["oud-rose"] * .7);
  totals["zara-candy"] += Math.round(totals.vanilla * .65);
  totals["deer-musk"] += Math.round(totals.musk * .65);
  return (Object.entries(totals) as [ScentId,number][]).filter(([id]) => id !== "saffron").sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
}

export function buildPortraitName(answers: QuizAnswers, primary: ScentId, words: string[]) {
  const chosen = quizQuestions.flatMap((question) => question.options.filter((option) => answers[question.id]?.includes(option.id))).flatMap((option) => option.feeling);
  const safe = words.filter((word) => /^[A-Za-z][A-Za-z -]{1,30}$/.test(word));
  const lead = safe.find((word) => chosen.some((feeling) => feeling.toLowerCase().includes(word.toLowerCase()))) ?? ({ musk:"Quiet",vanilla:"Velvet",saffron:"Golden","white-oud":"White","oud-rose":"Rose",junoon:"Junoon","red-musk":"Ember",nazakat:"Radiant","zara-candy":"Sweet","deer-musk":"Wild" } as Record<ScentId,string>)[primary];
  const tail = safe.find((word) => word !== lead && ["Strength","Devotion","Evening","Radiance","Stillness","Horizon","Warmth"].includes(word)) ?? "Radiance";
  return `${lead} ${tail}`.slice(0,60);
}
