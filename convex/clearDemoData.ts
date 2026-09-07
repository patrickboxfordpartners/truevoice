import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clear all demo data for clean re-seeding
 *
 * Deletes all data for demo-company
 */
export const clearDemoData = mutation({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    candidatesDeleted: v.number(),
    actionItemsDeleted: v.number(),
    emailThreadsDeleted: v.number(),
    scoresDeleted: v.number(),
    activitiesDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const { companyId } = args;

    console.log("🗑️  Clearing demo data for company:", companyId);

    // Delete candidates
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // Delete action items
    const actionItems = await ctx.db
      .query("action_items")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const item of actionItems) {
      await ctx.db.delete(item._id);
    }

    // Delete email threads
    const emailThreads = await ctx.db
      .query("email_threads")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const thread of emailThreads) {
      await ctx.db.delete(thread._id);
    }

    // Delete interview scores
    const scores = await ctx.db
      .query("interview_scores")
      .collect();

    let scoresDeleted = 0;
    for (const score of scores) {
      // Check if this score belongs to a candidate from this company
      const candidate = candidates.find(c => c.interviewId === score.interviewId);
      if (candidate) {
        await ctx.db.delete(score._id);
        scoresDeleted++;
      }
    }

    // Delete Joan activity
    const activities = await ctx.db
      .query("joan_activity")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    console.log(`✅ Deleted ${candidates.length} candidates`);
    console.log(`✅ Deleted ${actionItems.length} action items`);
    console.log(`✅ Deleted ${emailThreads.length} email threads`);
    console.log(`✅ Deleted ${scoresDeleted} interview scores`);
    console.log(`✅ Deleted ${activities.length} Joan activities`);

    return {
      success: true,
      candidatesDeleted: candidates.length,
      actionItemsDeleted: actionItems.length,
      emailThreadsDeleted: emailThreads.length,
      scoresDeleted,
      activitiesDeleted: activities.length,
    };
  },
});
