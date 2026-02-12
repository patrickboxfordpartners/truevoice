import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export async function getTeamMembers(companyId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateMemberRole(memberId: string, role: Role) {
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

export async function inviteTeamMember(email: string, role: Role, companyId: string) {
  // For MVP, we update an existing profile's company_id.
  // A full implementation would send an invite email.
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
