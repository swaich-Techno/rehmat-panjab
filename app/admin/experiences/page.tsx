import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/supabase/auth";
import { ExperienceForm } from "./experience-form";
import { quizQuestions } from "../../../lib/quiz";

export const dynamic="force-dynamic";
export default async function ExperiencesAdminPage(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin") return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const {data}=await (supabase as unknown as SupabaseClient).from("experience_settings").select("*").eq("id",true).single();
  if(!data) return <main id="main-content" className="admin-page"><h1>Experience settings are not installed.</h1><p>Apply the guided-experiences migration first.</p></main>;
  const initial={...(data as Record<string,unknown>),quiz_questions:Array.isArray(data.quiz_questions)&&data.quiz_questions.length===12?data.quiz_questions:quizQuestions};
  return <main id="main-content" className="admin-page"><p className="eyebrow">House administration</p><h1>Guided<br/>experiences.</h1><ExperienceForm initial={initial} /></main>;
}
