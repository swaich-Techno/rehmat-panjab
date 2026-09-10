import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";

export type ExperienceSettings = {
  layeringEnabled: boolean;
  layeringMaxFragrances: number;
  featuredPrompts: string[];
  suggestedMoods: string[];
  suggestedOccasions: string[];
  safetyNotice: string;
  productExclusions: string[];
  quizEnabled: boolean;
  portraitWords: string[];
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  whatsappNotice: string;
  guideEnabled: boolean;
  guideGreeting: string;
  guidePrompts: string[];
  guideAllowedProducts: string[];
  guideExcludedProducts: string[];
  guideSafetyResponse: string;
  guideEscalationMessage: string;
  guideMaxRecommendations: number;
  guideProvider: string;
  guideDeterministicFallback: boolean;
  guideRateLimit: number;
  guideGeneralKnowledge:boolean;
  guideProductGrounding:boolean;
  guideEmergencyDisable:boolean;
  guideModel:string;
  guideDailyLimit:number;
  guideTimeoutMs:number;
  guideMaxTokens:number;
};

export const defaultExperienceSettings: ExperienceSettings = {
  layeringEnabled: true,
  layeringMaxFragrances: 5,
  featuredPrompts: [
    "What can I layer with Musk Rizali?",
    "Create a warm and elegant combination.",
    "Create a three-fragrance combination for a wedding.",
    "Suggest something soft for everyday use.",
    "Can I combine Vanilla Musk, Oud Rose and White Oud?",
    "Which fragrance should I apply first?",
    "Make this combination lighter.",
    "Suggest an evening combination using available products.",
  ],
  suggestedMoods: ["Soft", "Warm", "Elegant", "Confident", "Calm", "Romantic"],
  suggestedOccasions: ["Everyday", "Work", "Evening", "Wedding", "Celebration", "Reflection"],
  safetyNotice: "Layering suggestions are creative fragrance guidance. Apply lightly and patch-test products individually before combining them.",
  productExclusions: [],
  quizEnabled: true,
  portraitWords: ["Quiet", "Golden", "Velvet", "Soft", "Amber", "Oud", "Rose", "Gentle", "Saffron", "White", "Warmth", "Radiance", "Stillness", "Devotion", "Horizon", "Evening"],
  whatsappEnabled: true,
  whatsappNumber: "917009464475",
  whatsappDefaultMessage: "Please confirm availability, delivery charges and payment instructions.",
  whatsappNotice: "This opens a manually confirmed order request. It does not place, reserve or pay for an order.",
  guideEnabled: true,
  guideGreeting: "Sat Sri Akal. Tell me what you want your fragrance to feel like, and I’ll help you choose.",
  guidePrompts: ["Help me choose my first oil","Find something for everyday wear","Suggest an evening fragrance","Compare two fragrances","Build a layering combination","Show fragrances within my budget"],
  guideAllowedProducts: [],
  guideExcludedProducts: ["saffron-amber-oud"],
  guideSafetyResponse: "I can offer fragrance guidance, but not medical or allergy guarantees.",
  guideEscalationMessage: "For help with an order, please continue on WhatsApp.",
  guideMaxRecommendations: 3,
  guideProvider: "deterministic",
  guideDeterministicFallback: true,
  guideRateLimit: 12,
  guideGeneralKnowledge:true,guideProductGrounding:true,guideEmergencyDisable:false,guideModel:"",guideDailyLimit:100,guideTimeoutMs:8000,guideMaxTokens:240,
};

export async function getExperienceSettings(): Promise<ExperienceSettings> {
  try {
    const raw = await createSupabaseServerClient();
    if (!raw) return defaultExperienceSettings;
    const client = raw as unknown as SupabaseClient;
    const { data } = await client.from("public_experience_settings").select("*").eq("id", true).maybeSingle();
    if (!data) return defaultExperienceSettings;
    return {
      layeringEnabled: Boolean(data.layering_enabled),
      layeringMaxFragrances: Math.max(2, Math.min(5, Number(data.layering_max_fragrances ?? 5))),
      featuredPrompts: Array.isArray(data.featured_prompts) ? data.featured_prompts : defaultExperienceSettings.featuredPrompts,
      suggestedMoods: Array.isArray(data.suggested_moods) ? data.suggested_moods : defaultExperienceSettings.suggestedMoods,
      suggestedOccasions: Array.isArray(data.suggested_occasions) ? data.suggested_occasions : defaultExperienceSettings.suggestedOccasions,
      safetyNotice: String(data.safety_notice ?? defaultExperienceSettings.safetyNotice),
      productExclusions: Array.isArray(data.product_exclusions) ? data.product_exclusions : [],
      quizEnabled: Boolean(data.quiz_enabled),
      portraitWords: Array.isArray(data.portrait_words) ? data.portrait_words : defaultExperienceSettings.portraitWords,
      whatsappEnabled: Boolean(data.whatsapp_enabled),
      whatsappNumber: String(data.whatsapp_number ?? defaultExperienceSettings.whatsappNumber).replace(/\D/g, "").slice(0, 15),
      whatsappDefaultMessage: String(data.whatsapp_default_message ?? defaultExperienceSettings.whatsappDefaultMessage),
      whatsappNotice: String(data.whatsapp_notice ?? defaultExperienceSettings.whatsappNotice),
      guideEnabled: data.guide_enabled === undefined ? true : Boolean(data.guide_enabled),
      guideGreeting: String(data.guide_greeting ?? defaultExperienceSettings.guideGreeting),
      guidePrompts: Array.isArray(data.guide_prompts) ? data.guide_prompts : defaultExperienceSettings.guidePrompts,
      guideAllowedProducts: Array.isArray(data.guide_allowed_products) ? data.guide_allowed_products : [],
      guideExcludedProducts: Array.isArray(data.guide_excluded_products) ? data.guide_excluded_products : defaultExperienceSettings.guideExcludedProducts,
      guideSafetyResponse: String(data.guide_safety_response ?? defaultExperienceSettings.guideSafetyResponse),
      guideEscalationMessage: String(data.guide_escalation_message ?? defaultExperienceSettings.guideEscalationMessage),
      guideMaxRecommendations: Math.max(1,Math.min(5,Number(data.guide_max_recommendations??3))),
      guideProvider: String(data.guide_provider??"deterministic"),
      guideDeterministicFallback: data.guide_deterministic_fallback === undefined ? true : Boolean(data.guide_deterministic_fallback),
      guideRateLimit: Math.max(1,Math.min(60,Number(data.guide_rate_limit??12))),
      guideGeneralKnowledge:data.guide_general_knowledge===undefined?true:Boolean(data.guide_general_knowledge),
      guideProductGrounding:data.guide_product_grounding===undefined?true:Boolean(data.guide_product_grounding),
      guideEmergencyDisable:Boolean(data.guide_emergency_disable),
      guideModel:String(data.guide_model??""),guideDailyLimit:Math.max(1,Math.min(10000,Number(data.guide_daily_limit??100))),guideTimeoutMs:Math.max(1000,Math.min(20000,Number(data.guide_timeout_ms??8000))),guideMaxTokens:Math.max(64,Math.min(1000,Number(data.guide_max_tokens??240))),
    };
  } catch {
    return defaultExperienceSettings;
  }
}
