// Team management via Convex
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export async function getTeamMembers(companyId: string) {
  const viewer = await client.query(api.users.viewer, {});
  // For now return the current user as the only team member
  // Full team queries need a dedicated Convex function
  if (!viewer) return [];
  return [viewer];
}

export async function updateMemberRole(_memberId: string, _role: string) {
  // TODO: Convex mutation for role updates
}

export async function removeMember(_memberId: string) {
  // TODO: Convex mutation for member removal
}

export async function inviteTeamMember(_email: string, _role: string, _companyId: string) {
  // TODO: Convex mutation for team invites
  throw new Error("Team invites not yet available. Coming soon.");
}
