import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompany, updateCompany } from "@/lib/api/companies";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/types/supabase";

type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export function useCompany() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["company", company?.id],
    queryFn: () => getCompany(company!.id),
    enabled: !!company?.id,
    initialData: company ?? undefined,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const { company, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (updates: CompanyUpdate) => updateCompany(company!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      refreshProfile();
    },
  });
}
