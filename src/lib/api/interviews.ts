import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type InterviewInsert = Database["public"]["Tables"]["interviews"]["Insert"];
type InterviewUpdate = Database["public"]["Tables"]["interviews"]["Update"];

export async function getInterviews(companyId: string) {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInterview(id: string) {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getInterviewByToken(token: string) {
  const { data, error } = await supabase
    .from("interviews")
    .select("*, companies(name)")
    .eq("candidate_token", token)
    .single();
  if (error) throw error;
  return data;
}

export async function createInterview(interview: InterviewInsert) {
  const { data, error } = await supabase
    .from("interviews")
    .insert(interview)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInterview(id: string, updates: InterviewUpdate) {
  const { data, error } = await supabase
    .from("interviews")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
