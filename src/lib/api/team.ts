// TODO: Phase 3 - migrate team management to Convex mutations
// Team operations require profiles table mutations (updateRole, removeMember, invite)
// that need dedicated Convex functions in convex/users.ts

import { supabase } from "@/lib/supabase";

export async function getTeamMembers(companyId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateMemberRole(memberId: string, role: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ company_id: null, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
}

export async function inviteTeamMember(email: string, role: string, companyId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    throw new Error("No user found with that email. They must sign up first.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ company_id: companyId, role, updated_at: new Date().toISOString() })
    .eq("id", profile.id);

  if (error) throw error;
}
