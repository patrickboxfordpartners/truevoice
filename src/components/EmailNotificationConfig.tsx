import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Bell, Mail, Clock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailNotificationConfigProps {
  companyId: string;
  className?: string;
}

type NotifPref = "all" | "important" | "none";
type ReminderTiming = "immediate" | "1hour" | "3hours" | "1day";

const NOTIF_OPTIONS: { value: NotifPref; label: string }[] = [
  { value: "all", label: "All" },
  { value: "important", label: "Important only" },
  { value: "none", label: "None" },
];

const TIMING_OPTIONS: { value: ReminderTiming; label: string }[] = [
  { value: "immediate", label: "Immediate" },
  { value: "1hour", label: "1 hour" },
  { value: "3hours", label: "3 hours" },
  { value: "1day", label: "1 day" },
];

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
}

function ToggleRow({ label, description, checked, onChange, icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-[hsl(160,84%,39%)]" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function EmailNotificationConfig({ companyId, className = "" }: EmailNotificationConfigProps) {
  const settings = useQuery(api.queries.getJoanSettings, { companyId });
  const upsert = useMutation(api.mutations.upsertJoanSettings);
  const { toast } = useToast();

  const [stageChange, setStageChange] = useState(true);
  const [flagAlerts, setFlagAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [milestones, setMilestones] = useState(true);
  const [notifPref, setNotifPref] = useState<NotifPref>("all");
  const [timing, setTiming] = useState<ReminderTiming>("immediate");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStageChange(settings.autoStageMovement);
      setFlagAlerts(settings.autoRouting);
      setDailyDigest(settings.autoActionItems);
      setInterviewReminders(true);
      setMilestones(true);
      setNotifPref(settings.notificationPreference);
      setTiming(settings.reminderTiming);
      setDirty(false);
    }
  }, [settings]);

  const markDirty = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({
        companyId,
        autoRouting: flagAlerts,
        autoActionItems: dailyDigest,
        autoStageMovement: stageChange,
        reminderTiming: timing,
        notificationPreference: notifPref,
      });
      setDirty(false);
      toast({ title: "Settings saved", description: "Email notification preferences updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl ${className}`}
    >
      <div className="flex items-center gap-2 px-6 pt-5 pb-3">
        <Bell className="h-4 w-4 text-[hsl(160,84%,39%)]" />
        <h3 className="text-sm font-semibold">Email Notifications</h3>
      </div>

      <div className="px-6 pb-2">
        <ToggleRow
          label="Stage change notifications"
          description="Get notified when candidates move between pipeline stages"
          checked={stageChange}
          onChange={markDirty(setStageChange)}
          icon={<Mail className="h-4 w-4" />}
        />
        <ToggleRow
          label="Flag alerts"
          description="Receive alerts when Joan flags a risk on a candidate"
          checked={flagAlerts}
          onChange={markDirty(setFlagAlerts)}
          icon={<Bell className="h-4 w-4" />}
        />
        <ToggleRow
          label="Daily digest"
          description="A daily summary of pipeline activity and action items"
          checked={dailyDigest}
          onChange={markDirty(setDailyDigest)}
          icon={<Mail className="h-4 w-4" />}
        />
        <ToggleRow
          label="Interview reminders"
          description="Reminders before scheduled interviews"
          checked={interviewReminders}
          onChange={markDirty(setInterviewReminders)}
          icon={<Clock className="h-4 w-4" />}
        />
        <ToggleRow
          label="Candidate milestones"
          description="Notifications when candidates hit key milestones"
          checked={milestones}
          onChange={markDirty(setMilestones)}
          icon={<Bell className="h-4 w-4" />}
        />
      </div>

      <div className="px-6 py-4 border-t border-border/50 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Notification level
          </p>
          <div className="flex gap-2">
            {NOTIF_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setNotifPref(opt.value); setDirty(true); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  notifPref === opt.value
                    ? "bg-[hsl(160,84%,39%)] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Reminder timing
          </p>
          <div className="flex gap-2 flex-wrap">
            {TIMING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTiming(opt.value); setDirty(true); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timing === opt.value
                    ? "bg-[hsl(160,84%,39%)] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-5 pt-2">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            dirty
              ? "bg-[hsl(160,84%,39%)] text-white hover:bg-[hsl(160,84%,34%)]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

export default EmailNotificationConfig;
