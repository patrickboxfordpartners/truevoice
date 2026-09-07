import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Pencil, Copy, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

type TemplateType = "advance" | "reject" | "invitation" | "reminder" | "followup" | "custom";

interface TemplateItem {
  _id?: Id<"email_templates">;
  name: string;
  type: TemplateType;
  subject: string;
  body: string;
  isDefault: boolean;
}

const SEED_TEMPLATES: TemplateItem[] = [
  {
    name: "Interview Invitation",
    type: "invitation",
    subject: "You're invited to interview for {{position}}",
    body: `Hi {{candidate_name}},

We're excited to invite you to an interview for the {{position}} role at {{company_name}}.

Please use the link below to join your interview session:
{{interview_link}}

Date & Time: {{interview_date}}
Duration: Approximately {{duration}} minutes

IMPORTANT: This interview uses AI-powered speech analysis to evaluate response authenticity. During the interview, your microphone audio will be transcribed and analyzed in real-time to assess speech patterns, response timing, and conversational flow. No audio recordings are stored. You will be asked to provide consent before the interview begins.

If you have any questions about this process, feel free to reply to this email.

Best regards,
{{sender_name}}
{{company_name}}`,
    isDefault: true,
  },
  {
    name: "Interview Reminder",
    type: "reminder",
    subject: "Reminder: Your interview for {{position}} is coming up",
    body: `Hi {{candidate_name}},

This is a friendly reminder that your interview for {{position}} is scheduled for {{interview_date}}.

Join here: {{interview_link}}

Please make sure your camera and microphone are working before the session.

Reminder: This interview includes AI-powered speech authenticity analysis. You will be asked to consent before the session begins. No audio recordings are stored.

See you soon!
{{sender_name}}`,
    isDefault: true,
  },
  {
    name: "Post-Interview Follow-up",
    type: "followup",
    subject: "Thank you for interviewing with {{company_name}}",
    body: `Hi {{candidate_name}},

Thank you for taking the time to interview for the {{position}} role. We appreciate your interest in {{company_name}}.

We'll review your interview and get back to you within {{response_days}} business days.

Best regards,
{{sender_name}}
{{company_name}}`,
    isDefault: true,
  },
  {
    name: "Advance to Next Round",
    type: "advance",
    subject: "Next steps for your {{position}} application",
    body: `Hi {{candidate_name}},

Thank you for your interest in the {{position}} role at {{company_name}}. After reviewing your profile and interview, we'd like to move forward with the next step.

We'll be in touch shortly with scheduling details.

Best regards,
{{sender_name}}
{{company_name}}`,
    isDefault: true,
  },
  {
    name: "Application Update (Reject)",
    type: "reject",
    subject: "Update on your {{position}} application",
    body: `Hi {{candidate_name}},

Thank you for your interest in the {{position}} role at {{company_name}} and for taking the time to speak with us.

After careful review, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.

We encourage you to apply for future openings that may be a better match.

Best regards,
{{sender_name}}
{{company_name}}`,
    isDefault: true,
  },
];

const TYPE_LABELS: Record<TemplateType, string> = {
  advance: "Advance",
  reject: "Reject",
  invitation: "Invitation",
  reminder: "Reminder",
  followup: "Follow-up",
  custom: "Custom",
};

const VARIABLES = [
  "candidate_name",
  "position",
  "company_name",
  "interview_link",
  "interview_date",
  "duration",
  "sender_name",
  "response_days",
];

export const EmailTemplateDialog = ({ open, onOpenChange, companyId }: EmailTemplateDialogProps) => {
  const { toast } = useToast();
  const savedTemplates = useQuery(api.queries.getEmailTemplates, { companyId });
  const saveTemplate = useMutation(api.mutations.saveEmailTemplate);
  const deleteTemplate = useMutation(api.mutations.deleteEmailTemplate);

  const templates: TemplateItem[] =
    savedTemplates && savedTemplates.length > 0
      ? savedTemplates.map((t) => ({
          _id: t._id,
          name: t.name,
          type: t.type as TemplateType,
          subject: t.subject,
          body: t.body,
          isDefault: t.isDefault,
        }))
      : SEED_TEMPLATES;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("invitation");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templates.length > 0 && selectedIndex < templates.length) {
      const t = templates[selectedIndex];
      setName(t.name);
      setType(t.type);
      setSubject(t.subject);
      setBody(t.body);
    }
  }, [savedTemplates, selectedIndex]);

  const handleSelect = (idx: string) => {
    const i = parseInt(idx);
    setSelectedIndex(i);
    const t = templates[i];
    if (t) {
      setName(t.name);
      setType(t.type);
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  const handleNewTemplate = () => {
    setName("New Template");
    setType("custom");
    setSubject("");
    setBody("");
    setSelectedIndex(-1);
    setTab("edit");
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + `{{${variable}}}`);
  };

  const renderPreview = (text: string) =>
    text
      .replace(/\{\{candidate_name\}\}/g, "Sarah Chen")
      .replace(/\{\{position\}\}/g, "Senior Frontend Engineer")
      .replace(/\{\{company_name\}\}/g, "Acme Corp")
      .replace(/\{\{interview_link\}\}/g, "https://example.com/interview/abc123")
      .replace(/\{\{interview_date\}\}/g, "Feb 15, 2026 at 2:00 PM")
      .replace(/\{\{duration\}\}/g, "45")
      .replace(/\{\{sender_name\}\}/g, "John Doe")
      .replace(/\{\{response_days\}\}/g, "5");

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = selectedIndex >= 0 ? templates[selectedIndex] : undefined;
      await saveTemplate({
        templateId: existing?._id,
        companyId,
        name,
        type,
        subject,
        body,
        isDefault: false,
      });
      toast({ title: "Template saved", description: `"${name}" has been saved.` });
    } catch {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const existing = selectedIndex >= 0 ? templates[selectedIndex] : undefined;
    if (!existing?._id) return;
    try {
      await deleteTemplate({ templateId: existing._id });
      setSelectedIndex(0);
      toast({ title: "Deleted", description: `"${existing.name}" has been removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" });
    }
  };

  const current = selectedIndex >= 0 ? templates[selectedIndex] : undefined;
  const canDelete = current?._id && !current.isDefault;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Template</Label>
              <Select
                value={selectedIndex >= 0 ? String(selectedIndex) : ""}
                onValueChange={handleSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t, i) => (
                    <SelectItem key={t._id ?? `seed-${i}`} value={String(i)}>
                      {t.name}
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({TYPE_LABELS[t.type]})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as TemplateType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Subject Line</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[220px] font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Insert variable
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => insertVariable(v)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Subject:</span>
                  <p className="font-medium">{renderPreview(subject)}</p>
                </div>
                <hr className="border-border" />
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                  {renderPreview(body)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-2">
            <div>
              {canDelete && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !name || !subject}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
