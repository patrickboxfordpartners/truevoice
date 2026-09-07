import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useConvexAuth() {
  const { session, loading } = useAuth();

  const isAuthenticated = !!session?.access_token;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        const { data } = await (await import("@/lib/supabase")).supabase.auth.refreshSession();
        return data.session?.access_token ?? null;
      }
      return session?.access_token ?? null;
    },
    [session?.access_token]
  );

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated,
      fetchAccessToken,
    }),
    [loading, isAuthenticated, fetchAccessToken]
  );
}
