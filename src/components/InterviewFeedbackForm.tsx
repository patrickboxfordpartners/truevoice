import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Plus,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewFeedbackFormProps {
  candidateId: Id<"hiring_pipeline">;
  companyId: string;
  className?: string;
}

type InterviewType = "screening" | "technical" | "behavioral" | "final" | "culture";
type Recommendation = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "screening", label: "Screening" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "final", label: "Final" },
  { value: "culture", label: "Culture" },
];

const RECOMMENDATIONS: { value: Recommendation; label: string; color: string; bg: string }[] = [
  { value: "strong_hire", label: "Strong Hire", color: "#22c55e", bg: "bg-green-500/10 text-green-600 border-green-500/30" },
  { value: "hire", label: "Hire", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { value: "no_hire", label: "No Hire", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { value: "strong_no_hire", label: "Strong No Hire", color: "#ef4444", bg: "bg-red-500/10 text-red-600 border-red-500/30" },
];

const SCORE_DIMENSIONS = [
  { key: "technical" as const, label: "Technical" },
  { key: "communication" as const, label: "Communication" },
  { key: "problemSolving" as const, label: "Problem Solving" },
  { key: "cultureFit" as const, label: "Culture Fit" },
  { key: "leadership" as const, label: "Leadership" },
];

function scoreColor(val: number): string {
  if (val >= 80) return "text-green-600";
  if (val >= 60) return "text-blue-600";
  if (val >= 40) return "text-amber-600";
  return "text-red-500";
}

function scoreBarColor(val: number): string {
  if (val >= 80) return "bg-green-500";
  if (val >= 60) return "bg-blue-500";
  if (val >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function InterviewFeedbackForm({ candidateId, companyId, className = "" }: InterviewFeedbackFormProps) {
  const feedback = useQuery(api.queries.getInterviewFeedbackByCandidate, { candidateId });
  const submitFeedback = useMutation(api.mutations.submitInterviewFeedback);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [interviewerName, setInterviewerName] = useState("Hiring Manager");
  const [interviewType, setInterviewType] = useState<InterviewType>("screening");
  const [recommendation, setRecommendation] = useState<Recommendation>("hire");
  const [scores, setScores] = useState<Record<string, number>>({
    technical: 70,
    communication: 70,
    problemSolving: 70,
    cultureFit: 70,
    leadership: 70,
  });
  const [strengths, setStrengths] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState("");
  const [concernInput, setConcernInput] = useState("");
  const [notes, setNotes] = useState("");

  const sortedFeedback = useMemo(() => {
    if (!feedback) return [];
    return [...feedback].sort((a: any, b: any) => b.createdAt - a.createdAt);
  }, [feedback]);

  const resetForm = () => {
    setInterviewerName("Hiring Manager");
    setInterviewType("screening");
    setRecommendation("hire");
    setScores({ technical: 70, communication: 70, problemSolving: 70, cultureFit: 70, leadership: 70 });
    setStrengths([]);
    setConcerns([]);
    setStrengthInput("");
    setConcernInput("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        candidateId,
        companyId,
        interviewerId: "current-user",
        interviewerName,
        interviewType,
        recommendation,
        scores: {
          technical: scores.technical,
          communication: scores.communication,
          problemSolving: scores.problemSolving,
          cultureFit: scores.cultureFit,
          leadership: scores.leadership,
        },
        strengths,
        concerns,
        notes: notes.trim() || undefined,
      });
      resetForm();
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const addStrength = () => {
    const val = strengthInput.trim();
    if (val && !strengths.includes(val)) {
      setStrengths([...strengths, val]);
      setStrengthInput("");
    }
  };

  const addConcern = () => {
    const val = concernInput.trim();
    if (val && !concerns.includes(val)) {
      setConcerns([...concerns, val]);
      setConcernInput("");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setFormOpen(!formOpen)}
        className="w-full flex items-center justify-between glass-card rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Submit Feedback</span>
          {feedback && (
            <span className="text-xs text-muted-foreground">
              ({feedback.length} submitted)
            </span>
          )}
        </div>
        {formOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Collapsible form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-xl p-4 space-y-4 border border-border/50">
              {/* Interviewer name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Interviewer</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>

              {/* Interview type pills */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Interview Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERVIEW_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setInterviewType(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        interviewType === t.value
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recommendation</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RECOMMENDATIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRecommendation(r.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        recommendation === r.value
                          ? `${r.bg} border-current`
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score sliders */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Scores</label>
                <div className="space-y-3">
                  {SCORE_DIMENSIONS.map((dim) => {
                    const val = scores[dim.key] ?? 70;
                    return (
                      <div key={dim.key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 shrink-0">{dim.label}</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={val}
                          onChange={(e) => setScores({ ...scores, [dim.key]: Number(e.target.value) })}
                          className="flex-1 h-1.5 accent-[hsl(160,84%,39%)] rounded-full"
                        />
                        <span className={`text-xs font-bold w-8 text-right ${scoreColor(val)}`}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Strengths</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={strengthInput}
                    onChange={(e) => setStrengthInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStrength(); } }}
                    placeholder="Add a strength..."
                    className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <button onClick={addStrength} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    <Plus size={14} />
                  </button>
                </div>
                {strengths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {strengths.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600">
                        {s}
                        <button onClick={() => setStrengths(strengths.filter((_, j) => j !== i))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Concerns */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Concerns</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={concernInput}
                    onChange={(e) => setConcernInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConcern(); } }}
                    placeholder="Add a concern..."
                    className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <button onClick={addConcern} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                    <Plus size={14} />
                  </button>
                </div>
                {concerns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {concerns.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500">
                        {c}
                        <button onClick={() => setConcerns(concerns.filter((_, j) => j !== i))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional observations..."
                  rows={3}
                  className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,34%)] text-white"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <ClipboardCheck size={14} className="mr-1.5" />}
                  Submit Feedback
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing feedback list */}
      {feedback === undefined ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : sortedFeedback.length > 0 ? (
        <div className="space-y-3">
          {sortedFeedback.map((fb: any, idx: number) => {
            const rec = RECOMMENDATIONS.find((r) => r.value === fb.recommendation);
            return (
              <motion.div
                key={fb._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-xl p-4 border border-border/50"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center">
                    <User size={13} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{fb.interviewerName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{relativeTime(fb.createdAt)}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                    {fb.interviewType}
                  </span>
                  {rec && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${rec.bg}`}>
                      {rec.label}
                    </span>
                  )}
                </div>

                {/* Score bars */}
                {fb.scores && (
                  <div className="space-y-1.5 mb-3">
                    {SCORE_DIMENSIONS.map((dim) => {
                      const val = fb.scores[dim.key];
                      if (val === undefined || val === null) return null;
                      return (
                        <div key={dim.key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-20 shrink-0">{dim.label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold w-6 text-right ${scoreColor(val)}`}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Strengths & concerns */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(fb.strengths || []).map((s: string, i: number) => (
                    <span key={`s-${i}`} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-600">
                      <ThumbsUp size={8} />
                      {s}
                    </span>
                  ))}
                  {(fb.concerns || []).map((c: string, i: number) => (
                    <span key={`c-${i}`} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-500">
                      <ThumbsDown size={8} />
                      {c}
                    </span>
                  ))}
                </div>

                {/* Notes */}
                {fb.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{fb.notes}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        !formOpen && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No interview feedback yet.
          </div>
        )
      )}
    </div>
  );
}

export default InterviewFeedbackForm;
