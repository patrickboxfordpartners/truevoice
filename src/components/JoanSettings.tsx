import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JoanAvatar } from "./JoanAvatar";
import { EmailTemplateDialog } from "./EmailTemplateDialog";
import StageRulesEditor from "./StageRulesEditor";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Settings, Save, RotateCcw, Loader2, Mail, Copy, ChevronDown, ChevronUp, Webhook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JoanSettingsProps {
  companyId: string;
}

interface JoanSettingsState {
  companyName: string;
  autoRouting: boolean;
  autoActionItems: boolean;
  reminderTiming: "immediate" | "1hour" | "3hours" | "1day";
  autoStageMovement: boolean;
  notificationPreference: "all" | "important" | "none";
  advanceThreshold: number;
  rejectThreshold: number;
  slackWebhookUrl: string;
}

const defaultSettings: JoanSettingsState = {
  companyName: "",
  autoRouting: true,
  autoActionItems: true,
  reminderTiming: "1day",
  autoStageMovement: false,
  notificationPreference: "important",
  advanceThreshold: 70,
  rejectThreshold: 40,
  slackWebhookUrl: "",
};

export const JoanSettings = ({ companyId }: JoanSettingsProps) => {
  const savedSettings = useQuery(api.queries.getJoanSettings, { companyId });
  const upsertSettings = useMutation(api.mutations.upsertJoanSettings);

  const [settings, setSettings] = useState<JoanSettingsState>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [showAtsPayload, setShowAtsPayload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        companyName: savedSettings.companyName || "",
        autoRouting: savedSettings.autoRouting,
        autoActionItems: savedSettings.autoActionItems,
        autoStageMovement: savedSettings.autoStageMovement,
        reminderTiming: savedSettings.reminderTiming,
        notificationPreference: savedSettings.notificationPreference,
        advanceThreshold: savedSettings.advanceThreshold ?? 70,
        rejectThreshold: savedSettings.rejectThreshold ?? 40,
        slackWebhookUrl: savedSettings.slackWebhookUrl || "",
      });
      setHasChanges(false);
    }
  }, [savedSettings]);

  const updateSetting = <K extends keyof JoanSettingsState>(
    key: K,
    value: JoanSettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertSettings({
        companyId,
        companyName: settings.companyName || undefined,
        autoRouting: settings.autoRouting,
        autoActionItems: settings.autoActionItems,
        autoStageMovement: settings.autoStageMovement,
        reminderTiming: settings.reminderTiming,
        notificationPreference: settings.notificationPreference,
        advanceThreshold: settings.advanceThreshold,
        rejectThreshold: settings.rejectThreshold,
        slackWebhookUrl: settings.slackWebhookUrl || undefined,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save Joan settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (savedSettings) {
      setSettings({
        companyName: savedSettings.companyName || "",
        autoRouting: savedSettings.autoRouting,
        autoActionItems: savedSettings.autoActionItems,
        autoStageMovement: savedSettings.autoStageMovement,
        reminderTiming: savedSettings.reminderTiming,
        notificationPreference: savedSettings.notificationPreference,
        advanceThreshold: savedSettings.advanceThreshold ?? 70,
        rejectThreshold: savedSettings.rejectThreshold ?? 40,
        slackWebhookUrl: savedSettings.slackWebhookUrl || "",
      });
    } else {
      setSettings(defaultSettings);
    }
    setHasChanges(false);
  };

  if (savedSettings === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <JoanAvatar size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Joan Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how Joan assists with your hiring process
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Company</h4>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              placeholder="Your company name (used in candidate emails)"
              value={settings.companyName}
              onChange={(e) => updateSetting("companyName", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used in automated candidate emails instead of a generic greeting
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Automation</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-routing">Auto-route emails</Label>
              <p className="text-xs text-muted-foreground">
                Automatically match incoming emails to candidates
              </p>
            </div>
            <Switch
              id="auto-routing"
              checked={settings.autoRouting}
              onCheckedChange={(checked) => updateSetting("autoRouting", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-action-items">Extract action items</Label>
              <p className="text-xs text-muted-foreground">
                Auto-extract tasks from interview transcripts
              </p>
            </div>
            <Switch
              id="auto-action-items"
              checked={settings.autoActionItems}
              onCheckedChange={(checked) => updateSetting("autoActionItems", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-stage">Auto-move pipeline stages</Label>
              <p className="text-xs text-muted-foreground">
                Move candidates based on completed actions
              </p>
            </div>
            <Switch
              id="auto-stage"
              checked={settings.autoStageMovement}
              onCheckedChange={(checked) => updateSetting("autoStageMovement", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Templates</Label>
              <p className="text-xs text-muted-foreground">
                Customize Joan's candidate communication emails
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Mail size={14} />
              Manage Templates
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Autopilot Thresholds</h4>
          <p className="text-xs text-muted-foreground">
            Confidence score thresholds that determine Joan's recommendations
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance-threshold">Advance threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="advance-threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.advanceThreshold}
                  onChange={(e) => updateSetting("advanceThreshold", Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Scores at or above this advance automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject-threshold">Reject threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reject-threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.rejectThreshold}
                  onChange={(e) => updateSetting("rejectThreshold", Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Scores below this recommend rejection
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Advance: {">="}{settings.advanceThreshold}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Review: {settings.rejectThreshold}-{settings.advanceThreshold - 1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Reject: {"<"}{settings.rejectThreshold}</span>
              </div>
            </div>
          </div>
        </div>

        <StageRulesEditor companyId={companyId} />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Reminders</h4>

          <div className="space-y-2">
            <Label htmlFor="reminder-timing">Reminder timing</Label>
            <Select
              value={settings.reminderTiming}
              onValueChange={(value) =>
                updateSetting("reminderTiming", value as JoanSettingsState["reminderTiming"])
              }
            >
              <SelectTrigger id="reminder-timing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediately</SelectItem>
                <SelectItem value="1hour">1 hour before due</SelectItem>
                <SelectItem value="3hours">3 hours before due</SelectItem>
                <SelectItem value="1day">1 day before due</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When Joan should send reminders for upcoming tasks
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>

          <div className="space-y-2">
            <Label htmlFor="notification-preference">Notification level</Label>
            <Select
              value={settings.notificationPreference}
              onValueChange={(value) =>
                updateSetting("notificationPreference", value as JoanSettingsState["notificationPreference"])
              }
            >
              <SelectTrigger id="notification-preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activities</SelectItem>
                <SelectItem value="important">Important only</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often Joan notifies you about her actions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Integrations</h4>

          <div className="space-y-2">
            <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
            <Input
              id="slack-webhook"
              placeholder="https://hooks.slack.com/services/..."
              value={settings.slackWebhookUrl}
              onChange={(e) => updateSetting("slackWebhookUrl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Joan will post hiring activity updates to this Slack channel
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">ATS Webhook Endpoint</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/ats/webhook`;
                  navigator.clipboard.writeText(url);
                  toast({ description: "Webhook URL copied to clipboard" });
                }}
                className="flex items-center gap-1.5"
              >
                <Copy size={12} />
                Copy URL
              </Button>
            </div>
            <code className="block text-xs bg-muted/50 rounded px-2 py-1.5 text-muted-foreground break-all">
              POST {window.location.origin}/ats/webhook
            </code>
            <p className="text-xs text-muted-foreground">
              Send candidate data from your ATS (Greenhouse, Lever, etc.) to this endpoint.
              Include a Bearer token in the Authorization header.
            </p>
            <button
              onClick={() => setShowAtsPayload(!showAtsPayload)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {showAtsPayload ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAtsPayload ? "Hide" : "Show"} expected payload
            </button>
            {showAtsPayload && (
              <pre className="text-[11px] bg-muted/50 rounded p-3 overflow-x-auto text-muted-foreground">
{`{
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "position": "Senior Engineer",
  "companyId": "${companyId}",
  "source": "greenhouse",
  "linkedinUrl": "https://linkedin.com/in/...",
  "githubUrl": "https://github.com/...",
  "resumeText": "...",
  "externalId": "ats-123"
}`}
              </pre>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border flex-wrap">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </Button>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Joan is your AI hiring coordinator. She monitors interviews, extracts action items,
          routes emails to the right candidates, and keeps your hiring pipeline moving smoothly.
          All actions are logged and can be reviewed at any time.
        </p>
      </div>

      <EmailTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        companyId={companyId}
      />
    </div>
  );
};
