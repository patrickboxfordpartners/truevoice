// Convex API - interviews
// These are imperative wrappers for use outside React component trees.
// Inside components, prefer useQuery(api.interviews.*) and useMutation(api.interviews.*) directly.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export async function getInterviews(companyId: string) {
  return client.query(api.interviews.getByCompany, { companyId });
}

export async function getInterview(id: string) {
  return client.query(api.interviews.getById, { interviewId: id });
}

export async function getInterviewByToken(token: string) {
  return client.query(api.interviews.getByToken, { token });
}

export async function createInterview(interview: {
  companyId: string;
  createdBy: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  scheduledAt?: number;
  duration?: string;
}) {
  return client.mutation(api.interviews.create, interview);
}

export async function updateInterview(id: string, updates: Record<string, any>) {
  return client.mutation(api.interviews.update, { interviewId: id, ...updates });
}
