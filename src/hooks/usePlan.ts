import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "free" | "starter" | "pro" | "scale";

export interface PlanCapabilities {
  tier: PlanTier;
  isActive: boolean;
  hasVideo: boolean;      // Pro + Scale only
  hasTeam: boolean;       // Scale only (up to 10 members)
  maxTeamMembers: number;
  monthlyInterviews: number;
  hasAPI: boolean;        // Scale only
  hasBulkImport: boolean; // Scale only
  canUpgrade: boolean;
}

export function usePlan(): PlanCapabilities {
  const { company } = useAuth();

  const tier = (company?.subscription_tier ?? "free") as PlanTier;
  const isActive =
    tier !== "free" &&
    (company?.subscription_status === "active" || company?.subscription_status === "trialing");

  return {
    tier,
    isActive,
    hasVideo: isActive && (tier === "pro" || tier === "scale"),
    hasTeam: isActive && tier === "scale",
    maxTeamMembers: tier === "scale" ? 10 : tier === "pro" ? 3 : 1,
    monthlyInterviews: tier === "scale" ? 100 : tier === "starter" || tier === "pro" ? 30 : 5,
    hasAPI: isActive && tier === "scale",
    hasBulkImport: isActive && tier === "scale",
    canUpgrade: tier !== "scale" || !isActive,
  };
}
