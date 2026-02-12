import { useMemo } from "react";
import type { Interview } from "@/types";

export function useDashboardStats(interviews: Interview[] | undefined) {
  return useMemo(() => {
    if (!interviews) {
      return {
        interviewsThisMonth: 0,
        interviewsLastMonth: 0,
        avgScore: 0,
        avgScoreLastMonth: 0,
        interviewsToday: 0,
        completedToday: 0,
        needsReview: 0,
        scheduledToday: [] as Interview[],
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const thisMonth = interviews.filter(
      (i) => new Date(i.created_at) >= startOfMonth
    );
    const lastMonth = interviews.filter(
      (i) =>
        new Date(i.created_at) >= startOfLastMonth &&
        new Date(i.created_at) < startOfMonth
    );

    const today = interviews.filter((i) => {
      const d = i.scheduled_at ? new Date(i.scheduled_at) : new Date(i.created_at);
      return d >= startOfToday && d < endOfToday;
    });

    const completedToday = today.filter((i) => i.status === "completed").length;

    const scheduledToday = today.filter(
      (i) => i.status === "scheduled" || i.status === "in_progress"
    );

    // Count completed interviews without a viewed report as "needs review"
    const needsReview = interviews.filter(
      (i) => i.status === "completed"
    ).length;

    return {
      interviewsThisMonth: thisMonth.length,
      interviewsLastMonth: lastMonth.length,
      avgScore: 0, // Will be populated when reports are joined
      avgScoreLastMonth: 0,
      interviewsToday: today.length,
      completedToday,
      needsReview,
      scheduledToday,
    };
  }, [interviews]);
}
