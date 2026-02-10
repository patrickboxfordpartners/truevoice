import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreateInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateInterviewDialog = ({ open, onOpenChange }: CreateInterviewDialogProps) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [copied, setCopied] = useState(false);

  const generatedLink = "https://authentiview.com/interview/abc123-xyz789";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: "Link copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Interview</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Name *</Label>
                <Input id="candidateName" placeholder="e.g. Jane Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidateEmail">Candidate Email *</Label>
                <Input id="candidateEmail" type="email" placeholder="jane@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position / Role *</Label>
                <Input id="position" placeholder="e.g. Senior Engineer" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="datetime">Interview Date & Time</Label>
                <Input id="datetime" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea id="notes" placeholder="Private notes for your team..." rows={3} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit">Generate Interview Link</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                Interview Created!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Interview Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm flex-1 truncate">{generatedLink}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">This link expires in 7 days</p>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Email Invitation
              </Button>
              <Button className="w-full" onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
