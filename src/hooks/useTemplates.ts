import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

export function useTemplates() {
  const { company } = useAuth();
  const companyId = company?.id;
  const data = useQuery(api.queries.getEmailTemplates, companyId ? { companyId } : "skip");
  return {
    data: data ?? [],
    isLoading: data === undefined && !!companyId,
    error: null,
  };
}

export function useUpsertTemplate() {
  const { company } = useAuth();
  const save = useMutation(api.mutations.saveEmailTemplate);

  return {
    mutateAsync: async (input: {
      template_type: string;
      name: string;
      subject: string;
      body: string;
    }) => {
      if (!company?.id) throw new Error("No company");
      await save({
        companyId: company.id,
        name: input.name,
        type: input.template_type as any,
        subject: input.subject,
        body: input.body,
      });
    },
    isPending: false,
  };
}
