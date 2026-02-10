import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Pencil, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_TEMPLATES = {
  invitation: {
    name: "Interview Invitation",
    subject: "You're invited to interview for {{position}}",
    body: `Hi {{candidate_name}},

We're excited to invite you to an interview for the {{position}} role at {{company_name}}.

Please use the link below to join your interview session:
{{interview_link}}

Date & Time: {{interview_date}}
Duration: Approximately {{duration}} minutes

If you have any questions, feel free to reply to this email.

Best regards,
{{sender_name}}
{{company_name}}`,
  },
  reminder: {
    name: "Interview Reminder",
    subject: "Reminder: Your interview for {{position}} is coming up",
    body: `Hi {{candidate_name}},

This is a friendly reminder that your interview for {{position}} is scheduled for {{interview_date}}.

Join here: {{interview_link}}

Please make sure your camera and microphone are working before the session.

See you soon!
{{sender_name}}`,
  },
  followup: {
    name: "Post-Interview Follow-up",
    subject: "Thank you for interviewing with {{company_name}}",
    body: `Hi {{candidate_name}},

Thank you for taking the time to interview for the {{position}} role. We appreciate your interest in {{company_name}}.

We'll review your interview and get back to you within {{response_days}} business days.

Best regards,
{{sender_name}}
{{company_name}}`,
  },
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

type TemplateKey = keyof typeof DEFAULT_TEMPLATES;

export const EmailTemplateDialog = ({ open, onOpenChange }: EmailTemplateDialogProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("invitation");
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES.invitation.subject);
  const [body, setBody] = useState(DEFAULT_TEMPLATES.invitation.body);
  const [tab, setTab] = useState("edit");

  const handleTemplateChange = (key: string) => {
    const t = DEFAULT_TEMPLATES[key as TemplateKey];
    setSelectedTemplate(key as TemplateKey);
    setSubject(t.subject);
    setBody(t.body);
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

  const handleSave = () => {
    toast({ title: "Template saved", description: `"${DEFAULT_TEMPLATES[selectedTemplate].name}" has been updated.` });
  };

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
          <div>
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEFAULT_TEMPLATES).map(([key, t]) => (
                  <SelectItem key={key} value={key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div>
                <Label>Subject Line</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[220px] font-mono text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Insert variable</Label>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
