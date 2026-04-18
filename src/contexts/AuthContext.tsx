import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { posthog } from "@/lib/posthog";
import type { Profile, Company } from "@/types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    company: null,
    loading: true,
  });

  async function fetchProfile(userId: string) {
    try {
      // Fetch profile
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profile) return { profile: null, company: null };

      // If profile has no company, try to create one
      if (!profile.company_id) {
        try {
          const displayName = profile.full_name || profile.email?.split("@")[0] || "User";
          await supabase.rpc("create_user_company", {
            user_id: userId,
            company_name: `${displayName}'s Company`,
          });

          // Re-fetch profile to pick up the company_id set by the RPC
          const { data: updated } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          if (updated) profile = updated;
        } catch (rpcErr) {
          console.warn("Failed to auto-create company:", rpcErr);
        }
      }

      // Fetch company
      let company: Company | null = null;
      if (profile.company_id) {
        const { data } = await supabase
          .from("companies")
          .select("*")
          .eq("id", profile.company_id)
          .single();
        company = data;
      }

      return { profile, company };
    } catch (err) {
      console.warn("fetchProfile failed:", err);
      return { profile: null, company: null };
    }
  }

  async function refreshProfile() {
    if (!state.user) return;
    const { profile, company } = await fetchProfile(state.user.id);
    setState((s) => ({ ...s, profile, company }));
  }

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const { profile, company } = await fetchProfile(session.user.id);
        if (mounted) setState({ user: session.user, session, profile, company, loading: false });
      } else {
        if (mounted) setState((s) => ({ ...s, loading: false }));
      }
    }).catch(() => {
      if (mounted) setState((s) => ({ ...s, loading: false }));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        fetchProfile(session.user.id).then(({ profile, company }) => {
          if (mounted) {
            setState({ user: session.user, session, profile, company, loading: false });
            posthog.identify(session.user.id, {
              email: session.user.email,
              name: profile?.full_name ?? undefined,
              company: company?.name ?? undefined,
              plan: company?.subscription_tier ?? "free",
            });
          }
        }).catch(() => {
          if (mounted) setState({ user: session.user, session, profile: null, company: null, loading: false });
        });
      } else {
        setState({ user: null, session: null, profile: null, company: null, loading: false });
        posthog.reset();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    // Company creation is handled by fetchProfile when it detects a
    // profile without a company_id — no need to do it here.
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
