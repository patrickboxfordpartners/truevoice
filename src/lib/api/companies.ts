import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export async function getCompany(id: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, updates: CompanyUpdate) {
  const { data, error } = await supabase
    .from("companies")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
