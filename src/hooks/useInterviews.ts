import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInterviews, createInterview, updateInterview } from "@/lib/api/interviews";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type InterviewInsert = Database["public"]["Tables"]["interviews"]["Insert"];
type InterviewUpdate = Database["public"]["Tables"]["interviews"]["Update"];

async function resolveCompanyId(userId: string): Promise<string> {
  // First check if profile already has a company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name, email")
    .eq("id", userId)
    .single();

  if (profile?.company_id) {
    return profile.company_id;
  }

  // Create company via RPC
  const fullName = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const { data: rpcResult, error: rpcError } = await supabase.rpc("create_user_company", {
    user_id: userId,
    company_name: `${fullName}'s Company`,
  });

  const rpcData = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
  if (rpcError || !rpcData?.company_id) {
    throw new Error(`Failed to create company: ${rpcError?.message || "Unknown error"}`);
  }

  return rpcData.company_id;
}

export function useInterviews() {
  const { company, user } = useAuth();
  return useQuery({
    queryKey: ["interviews", company?.id],
    queryFn: () => getInterviews(company!.id),
    enabled: !!company?.id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const { company, user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<InterviewInsert, "company_id" | "created_by">) => {
      if (!user) throw new Error("Not authenticated");

      let companyId = company?.id;
      if (!companyId) {
        companyId = await resolveCompanyId(user.id);
        // Refresh auth context so it picks up the new company
        await refreshProfile();
      }

      // Upsert a persistent candidate profile keyed on (company_id, email)
      const { data: candidateData, error: candidateError } = await supabase
        .from("candidates")
        .upsert(
          {
            company_id: companyId,
            name: input.candidate_name,
            email: input.candidate_email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,email", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (candidateError) {
        // Non-fatal: proceed without linking rather than blocking the interview
        console.warn("Candidate upsert failed:", candidateError.message);
      }

      return createInterview({
        ...input,
        company_id: companyId,
        created_by: user.id,
        candidate_id: candidateData?.id ?? null,
      });
    },
    onSuccess: (interview) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.refetchQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });

      // Fire invitation email — non-blocking, silent fail (user can resend from dashboard)
      supabase.functions.invoke("send-interview-email", {
        body: { interview_id: interview.id, template_type: "invitation" },
      }).catch(() => {});
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: InterviewUpdate & { id: string }) =>
      updateInterview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.refetchQueries({ queryKey: ["interviews"] });
    },
  });
}
