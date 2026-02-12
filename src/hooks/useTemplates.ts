import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTemplates, upsertTemplate } from "@/lib/api/templates";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/types/supabase";

type TemplateInsert = Database["public"]["Tables"]["email_templates"]["Insert"];

export function useTemplates() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["templates", company?.id],
    queryFn: () => getTemplates(company!.id),
    enabled: !!company?.id,
  });
}

export function useUpsertTemplate() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: (input: Omit<TemplateInsert, "company_id">) =>
      upsertTemplate({ ...input, company_id: company!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
