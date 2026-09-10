import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/supabase/auth";
import { ExperienceForm } from "./experience-form";
import { quizQuestions } from "../../../lib/quiz";

export const dynamic="force-dynamic";
export default async function ExperiencesAdminPage(){
  const {supabase,role}=await requireAdmin();
  if(role!=="super_admin") return <main id="main-content" className="admin-page"><h1>Super-admin access required.</h1></main>;
  const db=supabase as unknown as SupabaseClient;const [{data},{data:knowledge}]=await Promise.all([db.from("experience_settings").select("*").eq("id",true).single(),db.from("fragrance_knowledge").select("topic,version,approval_status,active,last_reviewed,source_title").order("topic")]);
  if(!data) return <main id="main-content" className="admin-page"><h1>Experience settings are not installed.</h1><p>Apply the guided-experiences migration first.</p></main>;
  const initial={...(data as Record<string,unknown>),quiz_questions:Array.isArray(data.quiz_questions)&&data.quiz_questions.length===12?data.quiz_questions:quizQuestions};
  return <main id="main-content" className="admin-page"><p className="eyebrow">House administration</p><h1>Guided<br/>experiences.</h1><ExperienceForm initial={initial}/><section className="policy-admin-preview"><h2>Approved fragrance knowledge</h2><p>{knowledge?.length??0} versioned records. Changes remain protected by administrator RLS.</p><div className="admin-table">{(knowledge??[]).map(item=><div key={`${item.topic}-${item.version}`}><strong>{item.topic}</strong><span>v{item.version} · {item.approval_status}</span><span>{item.active?"Active":"Inactive"} · reviewed {item.last_reviewed}</span></div>)}</div></section></main>;
}
