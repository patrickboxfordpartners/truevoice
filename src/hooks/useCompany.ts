import { useAuth } from "@/contexts/AuthContext";

export function useCompany() {
  const { company, loading } = useAuth();
  return {
    data: company,
    isLoading: loading,
    error: null,
  };
}

export function useUpdateCompany() {
  // TODO: Phase 3 - add Convex mutation for company updates
  // For now, company updates happen through the onboarding flow (api.users.completeOnboarding)
  return {
    mutateAsync: async (_updates: Record<string, unknown>) => {
      console.warn("[useUpdateCompany] Not yet migrated to Convex");
    },
    isPending: false,
  };
}
