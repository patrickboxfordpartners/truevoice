import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Convex Scheduled Functions (Crons)
 *
 * Joan's automated deadline reminder system:
 * - Runs every hour
 * - Checks for action items due within 48 hours
 * - Sends email reminders via AgentMail
 * - Logs activity for transparency
 */

const crons = cronJobs();

/**
 * Hourly deadline reminder check
 * Scans for upcoming deadlines and sends reminders
 */
crons.hourly(
  "check-deadline-reminders",
  internal.actions.sendDeadlineReminders.sendDeadlineReminders
);

/**
 * Joan Autopilot sweep -- every 15 minutes
 * Processes completed intelligence briefs and queues recommendations
 */
crons.interval(
  "autopilot-sweep",
  { minutes: 15 },
  internal.actions.autopilot.runAutopilotSweep
);

export default crons;
