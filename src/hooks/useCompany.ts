import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCompany() {
  const { company, loading } = useAuth();
  return {
    data: company,
    isLoading: loading,
    error: null,
  };
}

export function useUpdateCompany() {
  const update = useMutation(api.users.updateCompany);

  return {
    mutateAsync: async (updates: { name?: string; industry?: string }) => {
      await update(updates);
    },
    isPending: false,
  };
}
