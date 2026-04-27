import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, Mail, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateInterview } from "@/hooks/useInterviews";
import { getSiteUrl } from "@/lib/config";
import { supabase } from "@/lib/supabase";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  situational: "Situational",
  technical: "Technical",
  authenticity: "Authenticity",
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  behavioral: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  situational: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  technical: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  authenticity: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

interface GeneratedQuestion {
  id: string;
  text: string;
  type: "behavioral" | "situational" | "technical" | "authenticity";
  suggested_follow_up: string;
}

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
  const [language, setLanguage] = useState("default");

  // AI question generation state
  const [jdExpanded, setJdExpanded] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const createInterview = useCreateInterview();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const generatedLink = generatedToken
    ? `${getSiteUrl()}/interview/${generatedToken}`
    : "";

  const handleGenerateQuestions = async () => {
    const position = getValues("position");
    if (!position) {
      toast({ title: "Enter a position first", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { position, job_description: jobDescription || undefined },
      });
      if (error) throw error;
      const questions: GeneratedQuestion[] = data?.questions ?? [];
      setGeneratedQuestions(questions);
      setSelectedQuestions(new Set(questions.map((q) => q.id)));
    } catch (err: any) {
      toast({
        title: "Question generation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const onSubmit = async (data: FormData) => {
    // Embed selected questions into notes as JSON; preserve any plain notes text
    let notesValue: string | null = data.notes || null;
    const chosen = generatedQuestions.filter((q) => selectedQuestions.has(q.id));
    if (chosen.length > 0) {
      const payload = { questions: chosen, notes: data.notes || "" };
      notesValue = JSON.stringify(payload);
    }

    createInterview.mutate(
      {
        candidate_name: data.candidateName,
        candidate_email: data.candidateEmail,
        position: data.position,
        scheduled_at: data.scheduledAt || null,
        notes: notesValue,
        language: language !== "default" ? language : null,
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
    setLanguage("default");
    setJdExpanded(false);
    setJobDescription("");
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
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

              {/* AI Question Generation */}
              <div className="rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setJdExpanded(!jdExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Generate AI Questions
                  </span>
                  {jdExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>

                {jdExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="jobDescription" className="text-xs text-muted-foreground">
                        Job Description (optional — improves question quality)
                      </Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the job description here..."
                        rows={4}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="text-sm resize-none"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 w-full"
                      onClick={handleGenerateQuestions}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {isGenerating ? "Generating..." : "Generate Questions"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Generated questions checklist */}
              {generatedQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Select questions to include ({selectedQuestions.size}/{generatedQuestions.length})
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        if (selectedQuestions.size === generatedQuestions.length) {
                          setSelectedQuestions(new Set());
                        } else {
                          setSelectedQuestions(new Set(generatedQuestions.map((q) => q.id)));
                        }
                      }}
                    >
                      {selectedQuestions.size === generatedQuestions.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {generatedQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={`flex gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuestions.has(q.id)
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-transparent"
                        }`}
                        onClick={() => toggleQuestion(q.id)}
                      >
                        <Checkbox
                          checked={selectedQuestions.has(q.id)}
                          onCheckedChange={() => toggleQuestion(q.id)}
                          className="mt-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs leading-relaxed">{q.text}</p>
                          <span
                            className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              QUESTION_TYPE_COLORS[q.type] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Company Default</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Mandarin Chinese</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                  </SelectContent>
                </Select>
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
