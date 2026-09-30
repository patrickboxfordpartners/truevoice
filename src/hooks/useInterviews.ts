import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

export function useInterviews() {
  const { company } = useAuth();
  const companyId = company?.id;
  const data = useQuery(api.interviews.getByCompany, companyId ? { companyId } : "skip");
  return {
    data,
    isLoading: data === undefined && !!companyId,
    error: null,
  };
}

export function useCreateInterview() {
  const { company } = useAuth();
  const create = useMutation(api.interviews.create);

  return {
    mutateAsync: async (input: {
      candidate_name: string;
      candidate_email: string;
      position: string;
      scheduled_at?: string;
      duration?: string;
      notes?: string;
    }) => {
      if (!company?.id) throw new Error("No company");
      const id = await create({
        companyId: company.id,
        candidateName: input.candidate_name,
        candidateEmail: input.candidate_email,
        position: input.position,
        scheduledAt: input.scheduled_at ? new Date(input.scheduled_at).getTime() : undefined,
        duration: input.duration,
        notes: input.notes,
      });
      return { id };
    },
    isPending: false,
  };
}

export function useUpdateInterview() {
  const update = useMutation(api.interviews.update);

  return {
    mutateAsync: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      await update({
        interviewId: id as any,
        ...(updates.candidate_name != null && { candidateName: updates.candidate_name as string }),
        ...(updates.candidate_email != null && { candidateEmail: updates.candidate_email as string }),
        ...(updates.position != null && { position: updates.position as string }),
        ...(updates.notes != null && { notes: updates.notes as string }),
        ...(updates.transcript != null && { transcript: updates.transcript as string }),
        ...(updates.candidate_consented != null && { candidateConsented: updates.candidate_consented as boolean }),
      });
    },
    isPending: false,
  };
}
