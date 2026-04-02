import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Mail, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateInterview } from "@/hooks/useInterviews";
import { getSiteUrl } from "@/lib/config";

const schema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  candidateEmail: z.string().email("Valid email required"),
  position: z.string().min(1, "Position is required"),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateInterviewDialog = ({ open, onOpenChange }: CreateInterviewDialogProps) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [copied, setCopied] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");
  const createInterview = useCreateInterview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const generatedLink = generatedToken
    ? `${getSiteUrl()}/interview/${generatedToken}`
    : "";

  const onSubmit = async (data: FormData) => {
    createInterview.mutate(
      {
        candidate_name: data.candidateName,
        candidate_email: data.candidateEmail,
        position: data.position,
        scheduled_at: data.scheduledAt || null,
        notes: data.notes || null,
      },
      {
        onSuccess: (interview) => {
          setGeneratedToken(interview.candidate_token);
          setStep("success");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to create interview",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: "Link copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    setGeneratedToken("");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Interview</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Name *</Label>
                <Input id="candidateName" placeholder="e.g. Jane Doe" {...register("candidateName")} />
                {errors.candidateName && <p className="text-xs text-destructive">{errors.candidateName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidateEmail">Candidate Email *</Label>
                <Input id="candidateEmail" type="email" placeholder="jane@example.com" {...register("candidateEmail")} />
                {errors.candidateEmail && <p className="text-xs text-destructive">{errors.candidateEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position / Role *</Label>
                <Input id="position" placeholder="e.g. Senior Engineer" {...register("position")} />
                {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Interview Date & Time</Label>
                <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea id="notes" placeholder="Private notes for your team..." rows={3} {...register("notes")} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={createInterview.isPending}>
                  {createInterview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Interview Link
                </Button>
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
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-sm flex-1 min-w-0 break-all select-all bg-muted/50 rounded px-2 py-1.5">{generatedLink}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Share this link with the candidate. It expires in 7 days.</p>
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
