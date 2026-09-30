import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { posthog } from "@/lib/posthog";

interface AuthState {
  user: { id: string; email?: string; name?: string } | null;
  profile: {
    _id: string;
    userId: string;
    email: string;
    full_name: string | null;
    role: string;
    company_id: string | null;
    has_completed_onboarding: boolean;
  } | null;
  company: {
    _id: string;
    id: string;
    name: string | null;
    subscription_tier: string;
  } | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    company: null,
    loading: true,
  });

  const viewer = useQuery(
    api.users.viewer,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (isLoading) {
      setState((s) => ({ ...s, loading: true }));
      return;
    }

    if (!isAuthenticated) {
      setState({ user: null, profile: null, company: null, loading: false });
      posthog.reset();
      return;
    }

    if (viewer === undefined) {
      return;
    }

    if (viewer) {
      const user = {
        id: viewer.userId,
        email: viewer.email ?? undefined,
        name: viewer.full_name ?? undefined,
      };
      setState({
        user,
        profile: viewer,
        company: viewer.company ?? null,
        loading: false,
      });
      posthog.identify(viewer.userId, {
        email: viewer.email,
        name: viewer.full_name ?? undefined,
        company: viewer.company?.name ?? undefined,
        plan: viewer.company?.subscription_tier ?? "free",
      });
    } else {
      setState({ user: null, profile: null, company: null, loading: false });
    }
  }, [isAuthenticated, isLoading, viewer]);

  async function signOut() {
    const { signOut: convexSignOut } = await import("../../convex/_generated/api").then(
      (m) => ({ signOut: m.api.auth.signOut })
    );
    // Will be handled by the auth provider
    window.location.href = "/login";
  }

  function refreshProfile() {
    // Convex queries are reactive -- no manual refresh needed
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
