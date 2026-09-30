// Convex API - companies
// Inside components, prefer useQuery/useMutation directly.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export async function getCompany(_id: string) {
  const viewer = await client.query(api.users.viewer, {});
  return viewer?.company ?? null;
}

export async function updateCompany(id: string, updates: Record<string, any>) {
  return client.mutation(api.users.completeOnboarding, {
    companyName: updates.name ?? "",
  });
}
